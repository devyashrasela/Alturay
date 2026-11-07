const Joi = require('joi');
const { TEMPLATE_POOLS, PAPER_WIDTHS } = require('../constants/templates');

const createBusinessSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  email: Joi.string().trim().email().allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  tax_id: Joi.string().trim().max(50).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  currency: Joi.string().trim().max(10).default('INR'),
});

const updateBusinessSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  email: Joi.string().trim().email().allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  tax_id: Joi.string().trim().max(50).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  currency: Joi.string().trim().max(10),
  logo_url: Joi.string().trim().uri().max(500).allow('', null),
  invoice_template_id: Joi.string().valid(...TEMPLATE_POOLS.invoice),
  bill_template_id: Joi.string().valid(...TEMPLATE_POOLS.bill),
  receipt_paper_width: Joi.number().valid(...PAPER_WIDTHS),
}).min(1);

module.exports = { createBusinessSchema, updateBusinessSchema };
