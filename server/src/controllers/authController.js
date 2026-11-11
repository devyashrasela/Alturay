const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Business, BusinessMember } = require('../models');

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'An account with this email already exists.',
        },
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password_hash });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'created_at'],
      include: [{
        model: Business,
        as: 'businesses',
        through: { attributes: ['role', 'created_at'] },
        attributes: [
          'id',
          'name',
          'qr_prefix',
          'contact_details',
          'email',
          'phone',
          'tax_id',
          'address_line1',
          'address_line2',
          'city',
          'state',
          'pincode',
          'currency',
          'logo_url',
          'invoice_template_id',
          'bill_template_id',
          'receipt_paper_width',
          'default_payment_methods',
          'default_payment_terms',
          'default_terms_and_conditions',
          'default_due_days',
          'default_bill_due_days',
          'created_at',
        ],
      }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    const userJson = user.toJSON();
    if (Array.isArray(userJson.businesses)) {
      userJson.businesses = userJson.businesses.map((b) => ({
        ...b,
        role: b.BusinessMember ? b.BusinessMember.role : null,
        joined_at: b.BusinessMember ? b.BusinessMember.created_at : null,
      }));
    }

    return res.json({
      success: true,
      data: { user: userJson },
    });
  } catch (error) {
    next(error);
  }
};
