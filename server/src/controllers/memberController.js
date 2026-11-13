const { Op, UniqueConstraintError } = require('sequelize');
const { sequelize, BusinessMember, User } = require('../models');
const { ROLES, ROLE_RANK, ROLE_META, permissionsFor, assignableRoles } = require('../constants/roles');
const { canAssign, canManageTarget, decideRoleChange, decideRemoval } = require('../services/memberRules');
const logger = require('../utils/logger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (id) => typeof id === 'string' && UUID_REGEX.test(id);

exports.getAccess = async (req, res, next) => {
  try {
    const role = req.memberRole;
    return res.json({
      success: true,
      data: {
        role,
        role_label: ROLE_META[role]?.label || role,
        permissions: permissionsFor(role),
        assignable_roles: assignableRoles(role),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getRoles = async (req, res, next) => {
  try {
    const roles = ROLES.map((roleKey) => ({
      id: roleKey,
      label: ROLE_META[roleKey]?.label || roleKey,
      description: ROLE_META[roleKey]?.description || '',
      rank: ROLE_RANK[roleKey],
      permissions: permissionsFor(roleKey),
    }));

    return res.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const memberships = await BusinessMember.findAll({
      where: { business_id: req.businessId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    const members = memberships
      .map((m) => ({
        id: m.id,
        user_id: m.user_id,
        name: m.user?.name || '',
        email: m.user?.email || '',
        role: m.role,
        joined_at: m.created_at,
        is_you: m.user_id === req.user.id,
        can_manage: canManageTarget(req.memberRole, m.role) && m.user_id !== req.user.id,
      }))
      .sort((a, b) => {
        // Owner first
        if (a.role === 'owner' && b.role !== 'owner') return -1;
        if (b.role === 'owner' && a.role !== 'owner') return 1;
        // Higher rank first
        const rankDiff = (ROLE_RANK[b.role] || 0) - (ROLE_RANK[a.role] || 0);
        if (rankDiff !== 0) return rankDiff;
        // Earliest joined first
        return new Date(a.joined_at) - new Date(b.joined_at);
      });

    return res.json({
      success: true,
      data: {
        members,
        assignable_roles: assignableRoles(req.memberRole),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.add = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { email, role } = req.body;
    const actorRole = req.memberRole;

    if (!canAssign(actorRole, role)) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: {
          code: 'ROLE_NOT_ASSIGNABLE',
          message: `Your role does not allow assigning the "${role}" role.`,
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const targetUser = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        normalizedEmail
      ),
      attributes: ['id', 'name', 'email'],
      transaction: t,
    });

    if (!targetUser) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No Alturay account exists for this email. Ask them to register first, then add them here.',
        },
      });
    }

    const existingMember = await BusinessMember.findOne({
      where: {
        business_id: req.businessId,
        user_id: targetUser.id,
      },
      transaction: t,
    });

    if (existingMember) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_MEMBER',
          message: 'This user is already a member of this business. Change their role from the list instead.',
        },
      });
    }

    const newMembership = await BusinessMember.create(
      {
        business_id: req.businessId,
        user_id: targetUser.id,
        role,
      },
      { transaction: t }
    );

    await t.commit();

    logger.info('Member added to business', {
      businessId: req.businessId,
      actorUserId: req.user.id,
      actorRole,
      targetUserId: targetUser.id,
      assignedRole: role,
    });

    return res.status(201).json({
      success: true,
      data: {
        member: {
          id: newMembership.id,
          user_id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: newMembership.role,
          joined_at: newMembership.created_at,
          is_you: false,
          can_manage: canManageTarget(actorRole, newMembership.role),
        },
      },
    });
  } catch (error) {
    await t.rollback();
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_MEMBER',
          message: 'This user is already a member of this business. Change their role from the list instead.',
        },
      });
    }
    next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { role: newRole } = req.body;

    if (!isValidUuid(memberId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid member ID.' },
      });
    }

    const member = await BusinessMember.findOne({
      where: {
        id: memberId,
        business_id: req.businessId,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    const decision = decideRoleChange({
      actorRole: req.memberRole,
      actorUserId: req.user.id,
      target: member,
      newRole,
    });

    if (!decision.ok) {
      return res.status(decision.status).json({
        success: false,
        error: { code: decision.code, message: decision.message },
      });
    }

    if (member.role === newRole) {
      return res.json({
        success: true,
        data: {
          member: {
            id: member.id,
            user_id: member.user_id,
            name: member.user?.name || '',
            email: member.user?.email || '',
            role: member.role,
            joined_at: member.created_at,
            is_you: false,
            can_manage: canManageTarget(req.memberRole, member.role),
          },
        },
      });
    }

    const previousRole = member.role;
    await member.update({ role: newRole });

    logger.info('Member role updated', {
      businessId: req.businessId,
      actorUserId: req.user.id,
      targetUserId: member.user_id,
      previousRole,
      newRole,
    });

    return res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          user_id: member.user_id,
          name: member.user?.name || '',
          email: member.user?.email || '',
          role: member.role,
          joined_at: member.created_at,
          is_you: false,
          can_manage: canManageTarget(req.memberRole, member.role),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    if (!isValidUuid(memberId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid member ID.' },
      });
    }

    const member = await BusinessMember.findOne({
      where: {
        id: memberId,
        business_id: req.businessId,
      },
    });

    const decision = decideRemoval({
      actorRole: req.memberRole,
      actorUserId: req.user.id,
      target: member,
    });

    if (!decision.ok) {
      return res.status(decision.status).json({
        success: false,
        error: { code: decision.code, message: decision.message },
      });
    }

    await member.destroy();

    logger.info('Member removed from business', {
      businessId: req.businessId,
      actorUserId: req.user.id,
      targetUserId: member.user_id,
      targetRole: member.role,
    });

    return res.json({
      success: true,
      data: { message: 'Member removed successfully.' },
    });
  } catch (error) {
    next(error);
  }
};

exports.leave = async (req, res, next) => {
  try {
    if (req.memberRole === 'owner') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'OWNER_CANNOT_LEAVE',
          message: 'The business owner cannot leave the business.',
        },
      });
    }

    await BusinessMember.destroy({
      where: {
        business_id: req.businessId,
        user_id: req.user.id,
      },
    });

    logger.info('Member left business', {
      businessId: req.businessId,
      userId: req.user.id,
      role: req.memberRole,
    });

    return res.json({
      success: true,
      data: { message: 'You have left the business.' },
    });
  } catch (error) {
    next(error);
  }
};
