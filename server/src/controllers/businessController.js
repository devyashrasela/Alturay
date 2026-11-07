const { Business, BusinessMember } = require('../models');
const { TEMPLATE_POOLS, DEFAULT_TEMPLATE, PAPER_WIDTHS } = require('../constants/templates');
const { generateInvoicePDF } = require('../services/pdfGeneratorService');
const sampleInvoice = require('../services/pdfTemplates/sample');

exports.list = async (req, res, next) => {
  try {
    const memberships = await BusinessMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Business,
        as: 'business',
        attributes: [
          'id',
          'name',
          'email',
          'phone',
          'currency',
          'logo_url',
          'invoice_template_id',
          'bill_template_id',
          'receipt_paper_width',
          'created_at',
        ],
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
