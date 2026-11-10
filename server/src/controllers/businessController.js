const { Op } = require('sequelize');
const { Business, BusinessMember } = require('../models');
const { TEMPLATE_POOLS, DEFAULT_TEMPLATE, PAPER_WIDTHS } = require('../constants/templates');
const { generateInvoicePDF } = require('../services/pdfGeneratorService');
const sampleInvoice = require('../services/pdfTemplates/sample');

const BUSINESS_ATTRIBUTES = [
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
];

exports.list = async (req, res, next) => {
  try {
    const memberships = await BusinessMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Business,
        as: 'business',
        attributes: BUSINESS_ATTRIBUTES,
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
    const {
      name,
      qr_prefix,
      contact_details,
      tax_id,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      email,
      phone,
      currency,
      logo_url,
    } = req.body;

    const normalizedPrefix = (qr_prefix || '').trim().toLowerCase();

    // Check unique QR prefix
    const existing = await Business.findOne({
      where: { qr_prefix: normalizedPrefix },
      attributes: ['id'],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'QR_PREFIX_TAKEN',
          message: `The QR prefix "${normalizedPrefix}" is already in use by another business. Please choose another prefix.`,
        },
      });
    }

    const business = await Business.create({
      name,
      qr_prefix: normalizedPrefix,
      contact_details,
      tax_id,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      email,
      phone,
      currency: currency || 'INR',
      logo_url: logo_url || null,
    });

    // Automatically add creator as owner
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

exports.checkQrPrefix = async (req, res, next) => {
  try {
    const prefix = (req.query.prefix || '').trim().toLowerCase();
    const excludeId = (req.query.excludeId || req.query.businessId || '').trim();
    if (!prefix || prefix.length < 3) {
      return res.json({
        success: true,
        data: {
          prefix,
          available: false,
          reason: 'Prefix must be at least 3 characters.',
        },
      });
    }

    const where = { qr_prefix: prefix };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const existing = await Business.findOne({
      where,
      attributes: ['id'],
    });

    return res.json({
      success: true,
      data: {
        prefix,
        available: !existing,
      },
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
    // If structured address fields are updated, update composite address too
    const updates = { ...req.body };
    if (updates.qr_prefix) {
      updates.qr_prefix = updates.qr_prefix.trim().toLowerCase();
      const existing = await Business.findOne({
        where: { qr_prefix: updates.qr_prefix },
        attributes: ['id'],
      });
      if (existing && existing.id !== req.business.id) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'QR_PREFIX_TAKEN',
            message: `The QR prefix "${updates.qr_prefix}" is already in use.`,
          },
        });
      }
    }

    await req.business.update(updates);

    return res.json({
      success: true,
      data: { business: req.business },
    });
  } catch (error) {
    next(error);
  }
};

exports.previewTemplate = async (req, res, next) => {
  try {
    const type = req.query.type === 'bill' ? 'bill' : 'invoice';
    const templateId = TEMPLATE_POOLS[type].includes(req.query.template) ? req.query.template : DEFAULT_TEMPLATE[type];
    const width = Number(req.query.width);
    const paperWidth = PAPER_WIDTHS.includes(width) ? width : undefined;
    await generateInvoicePDF(sampleInvoice(type), req.business, res, { templateId, paperWidth });
  } catch (error) {
    next(error);
  }
};
