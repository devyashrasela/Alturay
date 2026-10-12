const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  sku: Joi.string().trim().max(50).allow('', null),
  description: Joi.string().trim().max(1000).allow('', null),
  unit_price: Joi.number().min(0).precision(2).required(),
  tax_rate: Joi.number().min(0).max(100).precision(2).default(0),
  unit: Joi.string().trim().max(20).default('pcs'),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  sku: Joi.string().trim().max(50).allow('', null),
  description: Joi.string().trim().max(1000).allow('', null),
  unit_price: Joi.number().min(0).precision(2),
  tax_rate: Joi.number().min(0).max(100).precision(2),
  unit: Joi.string().trim().max(20),
}).min(1);

module.exports = { createProductSchema, updateProductSchema };
