const Joi = require('joi');

const PAYMENT_METHODS = [
  'cash',
  'check',
  'upi',
  'bank_transfer',
  'credit_card',
  'debit_card',
  'net_banking',
  'other',
];

const shippingAddressSchema = Joi.alternatives().try(
  Joi.object({
    line1: Joi.string().trim().max(255).allow('', null),
    line2: Joi.string().trim().max(255).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(100).allow('', null),
    pincode: Joi.string().trim().max(20).allow('', null),
  }),
  Joi.string().trim().max(1000).allow('', null)
).allow(null);

const invoiceItemSchema = Joi.object({
  product_id: Joi.string().uuid().allow(null),
  item_name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(500).allow('', null),
  unit_price: Joi.number().min(0).precision(2).required(),
  quantity: Joi.number().integer().min(1).required(),
  tax_rate: Joi.number().min(0).max(100).precision(2).default(0),
  item_discount_amount: Joi.number().min(0).precision(2).default(0),
  item_discount_percent: Joi.number().min(0).max(100).precision(2).default(0),
});

const createInvoiceSchema = Joi.object({
  type: Joi.string().valid('invoice', 'bill').required(),
  customer_id: Joi.string().uuid().allow(null, ''),
  customer_name: Joi.string().trim().min(1).max(200).required(),
  customer_phone: Joi.string().trim().max(20).allow('', null),
  customer_email: Joi.string().trim().email().max(255).allow('', null),
  issue_date: Joi.date().iso().required(),
  due_date: Joi.date().iso().min(Joi.ref('issue_date')).allow(null),
  discount_amount: Joi.number().min(0).precision(2).default(0),
  discount_percent: Joi.number().min(0).max(100).precision(2).default(0),
  notes: Joi.string().trim().max(2000).allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  po_number: Joi.string().trim().max(50).allow('', null),
  payment_terms: Joi.string().trim().max(500).allow('', null),
  accepted_payment_methods: Joi.array().items(Joi.string().valid(...PAYMENT_METHODS)).allow(null),
  terms_and_conditions: Joi.string().trim().max(5000).allow('', null),
  shipping_address: shippingAddressSchema,
  items: Joi.array().items(invoiceItemSchema).min(1).required()
    .messages({ 'array.min': 'At least one line item is required' }),
});

const updateInvoiceSchema = Joi.object({
  customer_id: Joi.string().uuid().allow(null, ''),
  customer_name: Joi.string().trim().min(1).max(200),
  customer_phone: Joi.string().trim().max(20).allow('', null),
  customer_email: Joi.string().trim().email().max(255).allow('', null),
  issue_date: Joi.date().iso(),
  due_date: Joi.date().iso().allow(null),
  discount_amount: Joi.number().min(0).precision(2),
  discount_percent: Joi.number().min(0).max(100).precision(2),
  notes: Joi.string().trim().max(2000).allow('', null),
  description: Joi.string().trim().max(2000).allow('', null),
  po_number: Joi.string().trim().max(50).allow('', null),
  payment_terms: Joi.string().trim().max(500).allow('', null),
  accepted_payment_methods: Joi.array().items(Joi.string().valid(...PAYMENT_METHODS)).allow(null),
  terms_and_conditions: Joi.string().trim().max(5000).allow('', null),
  shipping_address: shippingAddressSchema,
  items: Joi.array().items(invoiceItemSchema).min(1),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'issued', 'paid', 'cancelled').required(),
});

module.exports = {
  PAYMENT_METHODS,
  createInvoiceSchema,
  updateInvoiceSchema,
  updateStatusSchema,
};
