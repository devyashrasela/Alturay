const Joi = require('joi');
const { TEMPLATE_POOLS, PAPER_WIDTHS } = require('../constants/templates');
const { INDIAN_STATES } = require('../constants/indianStates');

const createBusinessSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'any.required': 'Business name is required.',
    'string.empty': 'Business name cannot be empty.',
  }),
  qr_prefix: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-zA-Z0-9_-]{3,30}$/)
    .required()
    .messages({
      'any.required': 'QR prefix is required.',
      'string.empty': 'QR prefix cannot be empty.',
      'string.pattern.base':
        'QR prefix must be 3-30 characters long and contain only letters, numbers, hyphens, or underscores.',
    }),
  contact_details: Joi.string().trim().min(2).max(255).required().messages({
    'any.required': 'Contact details are required.',
    'string.empty': 'Contact details cannot be empty.',
  }),
  tax_id: Joi.string().trim().min(3).max(50).required().messages({
    'any.required': 'GSTIN / Tax ID is required.',
    'string.empty': 'GSTIN / Tax ID cannot be empty.',
  }),
  address_line1: Joi.string().trim().min(2).max(255).required().messages({
    'any.required': 'Address line 1 is required.',
    'string.empty': 'Address line 1 cannot be empty.',
  }),
  address_line2: Joi.string().trim().min(2).max(255).required().messages({
    'any.required': 'Address line 2 is required.',
    'string.empty': 'Address line 2 cannot be empty.',
  }),
  city: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'City is required.',
    'string.empty': 'City cannot be empty.',
  }),
  state: Joi.string()
    .valid(...INDIAN_STATES)
    .required()
    .messages({
      'any.required': 'State is required.',
      'any.only': 'Please select a valid state from the list of 28 Indian states.',
    }),
  pincode: Joi.string().trim().min(3).max(20).required().messages({
    'any.required': 'Pin code is required.',
    'string.empty': 'Pin code cannot be empty.',
  }),
  email: Joi.string().trim().email().required().messages({
    'any.required': 'Email is required.',
    'string.email': 'Please enter a valid email address.',
  }),
  phone: Joi.string().trim().min(6).max(20).required().messages({
    'any.required': 'Phone number is required.',
    'string.empty': 'Phone number cannot be empty.',
  }),
  currency: Joi.string().trim().max(10).default('INR'),
  logo_url: Joi.string().trim().uri().max(500).allow('', null),
});

const updateBusinessSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  qr_prefix: Joi.string().trim().lowercase().pattern(/^[a-zA-Z0-9_-]{3,30}$/),
  contact_details: Joi.string().trim().min(2).max(255),
  email: Joi.string().trim().email().allow('', null),
  phone: Joi.string().trim().max(20).allow('', null),
  tax_id: Joi.string().trim().max(50).allow('', null),
  address: Joi.string().trim().max(500).allow('', null),
  address_line1: Joi.string().trim().max(255).allow('', null),
  address_line2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().max(100).allow('', null),
  state: Joi.string().valid(...INDIAN_STATES).allow('', null),
  pincode: Joi.string().trim().max(20).allow('', null),
  currency: Joi.string().trim().max(10),
  logo_url: Joi.string().trim().uri().max(500).allow('', null),
  invoice_template_id: Joi.string().valid(...TEMPLATE_POOLS.invoice),
  bill_template_id: Joi.string().valid(...TEMPLATE_POOLS.bill),
  receipt_paper_width: Joi.number().valid(...PAPER_WIDTHS),
}).min(1);

module.exports = { createBusinessSchema, updateBusinessSchema };
