const FIELD_PERMISSIONS = {
  qr_prefix: 'business.update_identity',

  name: 'business.update_profile',
  contact_details: 'business.update_profile',
  email: 'business.update_profile',
  phone: 'business.update_profile',
  tax_id: 'business.update_profile',
  address_line1: 'business.update_profile',
  address_line2: 'business.update_profile',
  city: 'business.update_profile',
  state: 'business.update_profile',
  pincode: 'business.update_profile',
  currency: 'business.update_profile',
  logo_url: 'business.update_profile',

  invoice_template_id: 'billing.configure',
  bill_template_id: 'billing.configure',
  receipt_paper_width: 'billing.configure',
  default_payment_methods: 'billing.configure',
  default_payment_terms: 'billing.configure',
  default_terms_and_conditions: 'billing.configure',
  default_due_days: 'billing.configure',
  default_bill_due_days: 'billing.configure',
};

function authorizeBusinessUpdate(req, res, next) {
  if (!req.can) {
    return res.status(403).json({
      success: false,
      error: { code: 'NOT_A_MEMBER', message: 'You do not have access to this business.' },
    });
  }

  const bodyKeys = Object.keys(req.body || {});

  for (const key of bodyKeys) {
    const requiredPerm = FIELD_PERMISSIONS[key];
    if (!requiredPerm) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `Unknown field: ${key}` },
      });
    }

    if (key === 'qr_prefix') {
      const isUnchanged = req.business && req.body.qr_prefix === req.business.qr_prefix;
      if (!req.can('business.update_identity') && !isUnchanged) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: 'Your role does not allow updating business identity (QR prefix).',
            required: ['business.update_identity'],
          },
        });
      }
    } else if (!req.can(requiredPerm)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Your role does not allow this action.',
          required: [requiredPerm],
        },
      });
    }
  }

  next();
}

module.exports = authorizeBusinessUpdate;
