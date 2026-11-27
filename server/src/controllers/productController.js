const { Op } = require('sequelize');
const { Product } = require('../models');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const whereClause = { business_id: req.businessId };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'name',
        'sku',
        'description',
        'unit_price',
        'tax_rate',
        'unit',
        'is_active',
        'created_at',
      ],
      limit: parsedLimit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: { products: rows },
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...req.body,
      business_id: req.businessId,
    });

    return res.status(201).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId, business_id: req.businessId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
      });
    }

    return res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId, business_id: req.businessId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
      });
    }

    await product.update(req.body);
    return res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.productId, business_id: req.businessId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
      });
    }

    // Soft delete (paranoid mode sets deleted_at)
    await product.destroy();
    return res.json({ success: true, data: { message: 'Product deleted successfully.' } });
  } catch (error) {
    next(error);
  }
};
