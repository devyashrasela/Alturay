const { Op } = require('sequelize');
const { sequelize, Invoice, InvoiceItem, Business, Product, Customer } = require('../models');
const { calculateInvoiceTotals } = require('../services/invoiceCalculator');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { business_id: req.businessId };
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Invoice.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [{
        model: InvoiceItem,
        as: 'items',
      }],
    });

    return res.json({
      success: true,
      data: { invoices: rows },
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { type, customer_id, customer_name, customer_phone, issue_date, due_date, discount_amount, discount_percent, notes, items } = req.body;

    // Atomic sequence numbering with row-level lock
    const business = await Business.findByPk(req.businessId, { lock: true, transaction: t });
    const seqField = type === 'invoice' ? 'next_invoice_seq' : 'next_bill_seq';
    const prefix = type === 'invoice' ? 'INV' : 'BILL';
    const invoiceNumber = `${prefix}-${String(business[seqField]).padStart(3, '0')}`;

    // Calculate totals
    const totals = calculateInvoiceTotals(items, { discount_amount, discount_percent });

    // Create invoice
    const invoice = await Invoice.create({
      business_id: req.businessId,
      invoice_number: invoiceNumber,
      type,
      customer_id: customer_id || null,
      customer_name,
      customer_phone,
      issue_date,
      due_date,
      subtotal: totals.subtotal,
      tax_total: totals.tax_total,
      discount_amount: totals.discount_amount,
      discount_percent: totals.discount_percent,
      total_amount: totals.total_amount,
      notes,
      status: 'draft',
    }, { transaction: t });

    // Create line items
    const invoiceItems = totals.items.map((item) => ({
      invoice_id: invoice.id,
      product_id: item.product_id || null,
      item_name: item.item_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      tax_rate: item.tax_rate || 0,
      tax_amount: item.tax_amount,
      item_discount_amount: item.item_discount_amount || 0,
      item_discount_percent: item.item_discount_percent || 0,
      line_total: item.line_total,
    }));

    await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });

    // Increment the sequence
    await business.increment(seqField, { by: 1, transaction: t });

    await t.commit();

    // Fetch the full invoice with items
    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [{ model: InvoiceItem, as: 'items' }],
    });

    return res.status(201).json({
      success: true,
      data: { invoice: fullInvoice },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.invoiceId, business_id: req.businessId },
      include: [
        {
          model: InvoiceItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone', 'email', 'address_line1', 'address_line2', 'city', 'state', 'pincode'],
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found.' },
      });
    }

    return res.json({ success: true, data: { invoice } });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.invoiceId, business_id: req.businessId },
      transaction: t,
    });

    if (!invoice) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found.' },
      });
    }

    if (invoice.status !== 'draft') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Only draft invoices can be edited.' },
      });
    }

    const { items, ...invoiceData } = req.body;

    if (items) {
      // Recalculate totals
      const totals = calculateInvoiceTotals(items, {
        discount_amount: invoiceData.discount_amount ?? invoice.discount_amount,
        discount_percent: invoiceData.discount_percent ?? invoice.discount_percent,
      });

      // Delete old items and recreate
      await InvoiceItem.destroy({ where: { invoice_id: invoice.id }, transaction: t });

      const invoiceItems = totals.items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        item_name: item.item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount,
        item_discount_amount: item.item_discount_amount || 0,
        item_discount_percent: item.item_discount_percent || 0,
        line_total: item.line_total,
      }));

      await InvoiceItem.bulkCreate(invoiceItems, { transaction: t });

      invoiceData.subtotal = totals.subtotal;
      invoiceData.tax_total = totals.tax_total;
      invoiceData.total_amount = totals.total_amount;
    }

    await invoice.update(invoiceData, { transaction: t });
    await t.commit();

    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [{ model: InvoiceItem, as: 'items' }],
    });

    return res.json({ success: true, data: { invoice: fullInvoice } });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.invoiceId, business_id: req.businessId },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found.' },
      });
    }

    const currentStatus = invoice.status;
    const nextStatus = req.body.status;

    if (currentStatus === nextStatus) {
      return res.json({ success: true, data: { invoice } });
    }

    // 1. Prohibit any transition from paid
    if (currentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Paid invoices cannot be cancelled or modified.',
        },
      });
    }

    // 2. Prohibit any transition from cancelled
    if (currentStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Cancelled invoices cannot be reopened or modified.',
        },
      });
    }

    // 3. Draft can only transition to 'issued' or 'cancelled'
    if (currentStatus === 'draft' && !['issued', 'cancelled'].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition draft invoice to '${nextStatus}'. Please issue the invoice first.`,
        },
      });
    }

    // 4. Issued can only transition to 'paid' or 'cancelled'
    if (currentStatus === 'issued' && !['paid', 'cancelled'].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition issued invoice to '${nextStatus}'.`,
        },
      });
    }

    await invoice.update({ status: nextStatus });
    return res.json({ success: true, data: { invoice } });
  } catch (error) {
    next(error);
  }
};
