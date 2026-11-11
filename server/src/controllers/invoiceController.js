const { Op } = require('sequelize');
const { sequelize, Invoice, InvoiceItem, Business, Product, Customer, User } = require('../models');
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
      include: [
        {
          model: InvoiceItem,
          as: 'items',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
        },
      ],
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
    const {
      type,
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      issue_date,
      due_date,
      discount_amount,
      discount_percent,
      notes,
      description,
      po_number,
      payment_terms,
      accepted_payment_methods,
      terms_and_conditions,
      shipping_address,
      items,
    } = req.body;

    // Atomic sequence numbering with row-level lock
    const business = await Business.findByPk(req.businessId, { lock: true, transaction: t });
    const seqField = type === 'invoice' ? 'next_invoice_seq' : 'next_bill_seq';
    const prefix = type === 'invoice' ? 'INV' : 'BILL';
    const invoiceNumber = `${prefix}-${String(business[seqField]).padStart(3, '0')}`;

    // Calculate totals
    const totals = calculateInvoiceTotals(items, { discount_amount, discount_percent });

    // Use user-provided values; if field was omitted completely in API payload, fall back to business defaults
    const resolvedPaymentTerms = payment_terms !== undefined
      ? (payment_terms && payment_terms.trim() ? payment_terms.trim() : null)
      : (type === 'invoice' ? (business.default_payment_terms || null) : null);

    const resolvedPaymentMethods = accepted_payment_methods !== undefined
      ? (Array.isArray(accepted_payment_methods) && accepted_payment_methods.length > 0 ? accepted_payment_methods : null)
      : (business.default_payment_methods || null);

    const resolvedTermsAndConditions = terms_and_conditions !== undefined
      ? (terms_and_conditions && terms_and_conditions.trim() ? terms_and_conditions.trim() : null)
      : (type === 'invoice' ? (business.default_terms_and_conditions || null) : null);

    let resolvedDueDate = due_date || null;
    if (!resolvedDueDate && issue_date) {
      const dueDays = type === 'bill'
        ? (business.default_bill_due_days != null ? business.default_bill_due_days : 0)
        : (business.default_due_days != null ? business.default_due_days : 15);
      const issueD = new Date(issue_date);
      if (!isNaN(issueD.getTime())) {
        issueD.setDate(issueD.getDate() + dueDays);
        resolvedDueDate = issueD.toISOString().split('T')[0];
      }
    }

    // Create invoice
    const invoice = await Invoice.create({
      business_id: req.businessId,
      created_by: req.user.id,
      invoice_number: invoiceNumber,
      type,
      customer_id: customer_id || null,
      customer_name,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      issue_date,
      due_date: resolvedDueDate,
      subtotal: totals.subtotal,
      tax_total: totals.tax_total,
      discount_amount: totals.discount_amount,
      discount_percent: totals.discount_percent,
      total_amount: totals.total_amount,
      notes: (notes && notes.trim()) || null,
      description: (description && description.trim()) || null,
      po_number: (po_number && po_number.trim()) || null,
      payment_terms: resolvedPaymentTerms,
      accepted_payment_methods: resolvedPaymentMethods,
      terms_and_conditions: resolvedTermsAndConditions,
      shipping_address: shipping_address || null,
      status: 'draft',
    }, { transaction: t });

    // Create line items
    const invoiceItems = totals.items.map((item) => ({
      invoice_id: invoice.id,
      product_id: item.product_id || null,
      item_name: item.item_name,
      description: item.description || null,
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

    // Fetch the full invoice with items and creator
    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: InvoiceItem, as: 'items' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
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
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name'],
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

    if (!req.can('invoice.edit_any')) {
      if (invoice.created_by !== req.user.id) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: 'You can only edit drafts you created.',
            required: ['invoice.edit_any'],
          },
        });
      }
    }

    const { items, ...invoiceData } = req.body;

    if ('payment_terms' in invoiceData) {
      invoiceData.payment_terms = invoiceData.payment_terms && invoiceData.payment_terms.trim() ? invoiceData.payment_terms.trim() : null;
    }
    if ('terms_and_conditions' in invoiceData) {
      invoiceData.terms_and_conditions = invoiceData.terms_and_conditions && invoiceData.terms_and_conditions.trim() ? invoiceData.terms_and_conditions.trim() : null;
    }
    if ('notes' in invoiceData) {
      invoiceData.notes = invoiceData.notes && invoiceData.notes.trim() ? invoiceData.notes.trim() : null;
    }
    if ('description' in invoiceData) {
      invoiceData.description = invoiceData.description && invoiceData.description.trim() ? invoiceData.description.trim() : null;
    }
    if ('po_number' in invoiceData) {
      invoiceData.po_number = invoiceData.po_number && invoiceData.po_number.trim() ? invoiceData.po_number.trim() : null;
    }
    if ('accepted_payment_methods' in invoiceData) {
      invoiceData.accepted_payment_methods = (Array.isArray(invoiceData.accepted_payment_methods) && invoiceData.accepted_payment_methods.length > 0)
        ? invoiceData.accepted_payment_methods
        : null;
    }

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
        description: item.description || null,
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
      include: [
        { model: InvoiceItem, as: 'items' },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
      ],
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

    const STATUS_PERMISSIONS = {
      issued: 'invoice.issue',
      paid: 'invoice.mark_paid',
      cancelled: 'invoice.cancel',
    };

    const requiredPerm = STATUS_PERMISSIONS[nextStatus];
    if (requiredPerm && !req.can(requiredPerm)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Your role does not allow transitioning an invoice to '${nextStatus}'.`,
          required: [requiredPerm],
        },
      });
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
