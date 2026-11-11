const { outranks, assignableRoles, hasPermission } = require('../constants/roles');

const canAssign = (actorRole, newRole) => assignableRoles(actorRole).includes(newRole);

const canManageTarget = (actorRole, targetRole) =>
  targetRole !== 'owner' &&
  (hasPermission(actorRole, 'member.update_role') || hasPermission(actorRole, 'member.remove')) &&
  outranks(actorRole, targetRole);

const decideRoleChange = ({ actorRole, actorUserId, target, newRole }) => {
  if (!hasPermission(actorRole, 'member.update_role')) {
    return {
      ok: false,
      status: 403,
      code: 'INSUFFICIENT_ROLE',
      message: 'You do not have permission to change member roles.',
    };
  }

  if (!target) {
    return { ok: false, status: 404, code: 'MEMBER_NOT_FOUND', message: 'Member not found in this business.' };
  }

  if (target.user_id === actorUserId) {
    return { ok: false, status: 400, code: 'CANNOT_MODIFY_SELF', message: 'You cannot change your own role.' };
  }

  if (target.role === 'owner') {
    return { ok: false, status: 409, code: 'OWNER_IMMUTABLE', message: 'The business owner role cannot be changed.' };
  }

  if (!canManageTarget(actorRole, target.role)) {
    return {
      ok: false,
      status: 403,
      code: 'INSUFFICIENT_ROLE',
      message: `You cannot modify the role of a member with role "${target.role}".`,
    };
  }

  if (!canAssign(actorRole, newRole)) {
    return {
      ok: false,
      status: 403,
      code: 'ROLE_NOT_ASSIGNABLE',
      message: `Your role does not allow assigning the "${newRole}" role.`,
    };
  }

  return { ok: true };
};

const decideRemoval = ({ actorRole, actorUserId, target }) => {
  if (!hasPermission(actorRole, 'member.remove')) {
    return {
      ok: false,
      status: 403,
      code: 'INSUFFICIENT_ROLE',
      message: 'You do not have permission to remove members.',
    };
  }

  if (!target) {
    return { ok: false, status: 404, code: 'MEMBER_NOT_FOUND', message: 'Member not found in this business.' };
  }

  if (target.user_id === actorUserId) {
    return {
      ok: false,
      status: 400,
      code: 'CANNOT_MODIFY_SELF',
      message: 'Use the leave business endpoint to leave a business.',
    };
  }

  if (target.role === 'owner') {
    return { ok: false, status: 409, code: 'OWNER_IMMUTABLE', message: 'The business owner cannot be removed.' };
  }

  if (!canManageTarget(actorRole, target.role)) {
    return {
      ok: false,
      status: 403,
      code: 'INSUFFICIENT_ROLE',
      message: `You cannot remove a member with role "${target.role}".`,
    };
  }

  return { ok: true };
};

module.exports = {
  canAssign,
  canManageTarget,
  decideRoleChange,
  decideRemoval,
};
