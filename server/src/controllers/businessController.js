const { Business, BusinessMember } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const memberships = await BusinessMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Business,
        as: 'business',
        attributes: ['id', 'name', 'email', 'phone', 'currency', 'logo_url', 'created_at'],
      }],
      attributes: ['role', 'created_at'],
    });

    const businesses = memberships.map((m) => ({
      ...m.business.toJSON(),
      role: m.role,
      joined_at: m.created_at,
    }));

    return res.json({ success: true, data: { businesses } });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, phone, tax_id, address, currency } = req.body;

    const business = await Business.create({ name, email, phone, tax_id, address, currency });

    // Automatically add the creator as the owner
    await BusinessMember.create({
      user_id: req.user.id,
      business_id: business.id,
      role: 'owner',
    });

    return res.status(201).json({
      success: true,
      data: { business },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: { business: req.business },
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    await req.business.update(req.body);

    return res.json({
      success: true,
      data: { business: req.business },
    });
  } catch (error) {
    next(error);
  }
};
