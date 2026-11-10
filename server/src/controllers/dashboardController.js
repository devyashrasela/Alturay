const { Op, fn, col, literal } = require('sequelize');
const { Invoice, Product, InvoiceItem } = require('../models');

// Local date string (YYYY-MM-DD) formatted without UTC timezone drift
const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isoMonthsBack = (monthsBack) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  return formatLocalDate(d);
};

const todayISO = () => formatLocalDate(new Date());

exports.getStats = async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const requestedMonth = req.query.month;

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const targetMonth = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)
      ? requestedMonth
      : currentMonthKey;

    const [yearStr, monthStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${targetMonth}-01`;
    const monthEnd = `${targetMonth}-${String(daysInMonth).padStart(2, '0')}`;

    const [
      totalProducts,
      totalInvoices,
      totalBills,
      revenueResult,
      monthlyRows,
      dailyRows,
      statusRows,
      balanceRows,
      overdueCount,
      topProducts,
    ] = await Promise.all([
      Product.count({ where: { business_id: businessId } }),
      Invoice.count({ where: { business_id: businessId, type: 'invoice' } }),
      Invoice.count({ where: { business_id: businessId, type: 'bill' } }),
      Invoice.findOne({
        where: {
          business_id: businessId,
          status: { [Op.in]: ['issued', 'paid'] },
        },
        attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'total_revenue']],
        raw: true,
      }),
      // Monthly revenue series over the last 6 months (issued + paid)
      Invoice.findAll({
        where: {
          business_id: businessId,
          status: { [Op.in]: ['issued', 'paid'] },
          issue_date: { [Op.gte]: isoMonthsBack(5) },
        },
        attributes: [
          [fn('DATE_FORMAT', col('issue_date'), '%Y-%m'), 'month'],
          [fn('COALESCE', fn('SUM', col('total_amount')), 0), 'revenue'],
          [fn('COUNT', col('id')), 'invoices'],
        ],
        group: ['month'],
        raw: true,
      }),
      // Daily revenue series for the target month (issued + paid)
      Invoice.findAll({
        where: {
          business_id: businessId,
          status: { [Op.in]: ['issued', 'paid'] },
          issue_date: {
            [Op.gte]: monthStart,
            [Op.lte]: monthEnd,
          },
        },
        attributes: [
          [fn('DATE_FORMAT', col('issue_date'), '%Y-%m-%d'), 'date'],
          [fn('COALESCE', fn('SUM', col('total_amount')), 0), 'revenue'],
          [fn('COUNT', col('id')), 'invoices'],
        ],
        group: ['date'],
        raw: true,
      }),
      // Document counts by status (invoices and bills)
      Invoice.findAll({
        where: { business_id: businessId },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      // Outstanding balances (issued, unpaid)
      Invoice.findAll({
        where: { business_id: businessId, status: 'issued' },
        attributes: [
          'type',
          [fn('COALESCE', fn('SUM', col('total_amount')), 0), 'amount'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['type'],
        raw: true,
      }),
      // Invoices & bills past their due date
      Invoice.count({
        where: {
          business_id: businessId,
          status: 'issued',
          due_date: { [Op.lt]: todayISO() },
        },
      }),
      // Top products by revenue across all active sales for this business (exclude cancelled)
      InvoiceItem.findAll({
        attributes: [
          'item_name',
          [fn('COALESCE', fn('SUM', col('line_total')), 0), 'revenue'],
          [fn('COALESCE', fn('SUM', col('quantity')), 0), 'units'],
        ],
        include: [
          {
            model: Invoice,
            as: 'invoice',
            attributes: [],
            where: {
              business_id: businessId,
              status: { [Op.in]: ['issued', 'paid'] },
            },
            required: true,
          },
        ],
        group: ['item_name'],
        order: [literal('revenue DESC')],
        limit: 5,
        raw: true,
      }),
    ]);

    // Fill a continuous 6-month series so the chart never skips a month
    const revenueByMonth = new Map(monthlyRows.map((r) => [r.month, r]));
    const monthly_series = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = revenueByMonth.get(key);
      monthly_series.push({
        month: key,
        label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d),
        revenue: parseFloat(row?.revenue || 0),
        invoices: parseInt(row?.invoices, 10) || 0,
      });
    }

    // Fill continuous daily series for the selected month
    const dailyByDate = new Map(dailyRows.map((r) => [r.date, r]));
    const daily_series = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${targetMonth}-${String(day).padStart(2, '0')}`;
      const row = dailyByDate.get(dateKey);
      daily_series.push({
        date: dateKey,
        day,
        revenue: parseFloat(row?.revenue || 0),
        invoices: parseInt(row?.invoices, 10) || 0,
      });
    }

    const status_counts = { draft: 0, issued: 0, paid: 0, cancelled: 0 };
    statusRows.forEach((r) => {
      status_counts[r.status] = parseInt(r.count, 10) || 0;
    });

    const invoiceReceivable = parseFloat(balanceRows.find((b) => b.type === 'invoice')?.amount || 0);
    const billReceivable = parseFloat(balanceRows.find((b) => b.type === 'bill')?.amount || 0);
    const invoiceRecCount = parseInt(balanceRows.find((b) => b.type === 'invoice')?.count, 10) || 0;
    const billRecCount = parseInt(balanceRows.find((b) => b.type === 'bill')?.count, 10) || 0;

    const outstanding_receivable = invoiceReceivable + billReceivable;
    const receivable_count = invoiceRecCount + billRecCount;

    return res.json({
      success: true,
      data: {
        stats: {
          total_products: totalProducts,
          total_invoices: totalInvoices,
          total_bills: totalBills,
          total_documents: totalInvoices + totalBills,
          total_revenue: parseFloat(revenueResult?.total_revenue || 0),
          monthly_series,
          daily_series,
          selected_month: targetMonth,
          status_counts,
          outstanding_receivable,
          outstanding_payable: 0,
          receivable_count,
          payable_count: 0,
          overdue_invoices: overdueCount,
          top_products: topProducts.map((p) => ({
            item_name: p.item_name,
            revenue: parseFloat(p.revenue || 0),
            units: parseInt(p.units, 10) || 0,
          })),
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
      attributes: ['id', 'invoice_number', 'type', 'customer_name', 'total_amount', 'status', 'issue_date', 'due_date', 'created_at'],
    });

    return res.json({
      success: true,
      data: { invoices },
    });
  } catch (error) {
    next(error);
  }
};
