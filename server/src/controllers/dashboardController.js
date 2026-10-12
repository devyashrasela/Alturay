const { Op, fn, col, literal } = require('sequelize');
const { Invoice, Product } = require('../models');

exports.getStats = async (req, res, next) => {
  try {
    const businessId = req.businessId;

    const [totalProducts, totalInvoices, totalBills, revenueResult] = await Promise.all([
      Product.count({ where: { business_id: businessId } }),
      Invoice.count({ where: { business_id: businessId, type: 'invoice' } }),
      Invoice.count({ where: { business_id: businessId, type: 'bill' } }),
      Invoice.findOne({
        where: { business_id: businessId, status: { [Op.in]: ['issued', 'paid'] } },
        attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'total_revenue']],
        raw: true,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          total_products: totalProducts,
          total_invoices: totalInvoices,
          total_bills: totalBills,
          total_revenue: parseFloat(revenueResult?.total_revenue || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecent = async (req, res, next) => {
  try {
    const invoices = await Invoice.findAll({
      where: { business_id: req.businessId },
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['id', 'invoice_number', 'type', 'customer_name', 'total_amount', 'status', 'issue_date', 'created_at'],
    });

    return res.json({
      success: true,
      data: { invoices },
    });
  } catch (error) {
    next(error);
  }
};
