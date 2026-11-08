const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'any.required': 'Customer name is required.',
    'string.empty': 'Customer name cannot be empty.',
  }),
  email: Joi.string().trim().email().allow('', null).messages({
    'string.email': 'Please enter a valid email address.',
  }),
  phone: Joi.string().trim().max(20).allow('', null),
  address_line1: Joi.string().trim().max(255).allow('', null),
  address_line2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  pincode: Joi.string().trim().max(20).allow('', null),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  email: Joi.string().trim().email().allow('', null).messages({
    'string.email': 'Please enter a valid email address.',
  }),
  phone: Joi.string().trim().max(20).allow('', null),
  address_line1: Joi.string().trim().max(255).allow('', null),
  address_line2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().trim().max(100).allow('', null),
  pincode: Joi.string().trim().max(20).allow('', null),
  is_active: Joi.boolean(),
}).min(1);

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
