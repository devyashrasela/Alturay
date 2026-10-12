const Joi = require('joi');

const invoiceItemSchema = Joi.object({
  product_id: Joi.string().uuid().allow(null),
  item_name: Joi.string().trim().min(1).max(200).required(),
  unit_price: Joi.number().min(0).precision(2).required(),
  quantity: Joi.number().integer().min(1).required(),
  tax_rate: Joi.number().min(0).max(100).precision(2).default(0),
  item_discount_amount: Joi.number().min(0).precision(2).default(0),
  item_discount_percent: Joi.number().min(0).max(100).precision(2).default(0),
});

const createInvoiceSchema = Joi.object({
  type: Joi.string().valid('invoice', 'bill').required(),
  customer_name: Joi.string().trim().min(1).max(200).required(),
  customer_phone: Joi.string().trim().max(20).allow('', null),
  issue_date: Joi.date().iso().required(),
  due_date: Joi.date().iso().min(Joi.ref('issue_date')).allow(null),
  discount_amount: Joi.number().min(0).precision(2).default(0),
  discount_percent: Joi.number().min(0).max(100).precision(2).default(0),
  notes: Joi.string().trim().max(2000).allow('', null),
  items: Joi.array().items(invoiceItemSchema).min(1).required()
    .messages({ 'array.min': 'At least one line item is required' }),
});

const updateInvoiceSchema = Joi.object({
  customer_name: Joi.string().trim().min(1).max(200),
  customer_phone: Joi.string().trim().max(20).allow('', null),
  issue_date: Joi.date().iso(),
  due_date: Joi.date().iso().allow(null),
  discount_amount: Joi.number().min(0).precision(2),
  discount_percent: Joi.number().min(0).max(100).precision(2),
  notes: Joi.string().trim().max(2000).allow('', null),
  items: Joi.array().items(invoiceItemSchema).min(1),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'issued', 'paid', 'cancelled').required(),
});

module.exports = { createInvoiceSchema, updateInvoiceSchema, updateStatusSchema };
