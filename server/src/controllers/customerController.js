const { Op } = require('sequelize');
const { Customer, Invoice } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', all = false } = req.query;
    const isAll = all === 'true' || all === true;
    const parsedLimit = isAll ? 200 : Math.min(parseInt(limit, 10) || 20, 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = isAll ? 0 : (parsedPage - 1) * parsedLimit;

    const whereClause = { business_id: req.businessId };
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { city: { [Op.like]: term } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit: parsedLimit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: { customers: rows },
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      business_id: req.businessId,
    });

    return res.status(201).json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.customerId, business_id: req.businessId },
      include: [
        {
          model: Invoice,
          as: 'invoices',
          attributes: ['id', 'invoice_number', 'type', 'total_amount', 'status', 'issue_date'],
          limit: 10,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found.' },
      });
    }

    return res.json({ success: true, data: { customer } });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.customerId, business_id: req.businessId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found.' },
      });
    }

    await customer.update(req.body);

    return res.json({ success: true, data: { customer } });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.customerId, business_id: req.businessId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found.' },
      });
    }

    await customer.destroy();

    return res.json({
      success: true,
      message: 'Customer deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.remove = exports.delete;
