const Joi = require('joi');

const addMemberSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required.',
  }),
  role: Joi.string().valid('admin', 'manager', 'staff').required().messages({
    'any.only': 'Role must be admin, manager, or staff.',
    'any.required': 'Role is required.',
  }),
});

const updateMemberRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'manager', 'staff').required().messages({
    'any.only': 'Role must be admin, manager, or staff.',
    'any.required': 'Role is required.',
  }),
});

module.exports = {
  addMemberSchema,
  updateMemberRoleSchema,
};
