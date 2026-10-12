const Joi = require('joi');

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
}).min(1);

module.exports = { createBusinessSchema, updateBusinessSchema };
