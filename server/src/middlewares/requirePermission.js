/**
 * Enforces that the authenticated member has all specified permissions.
 * Must run AFTER tenantMiddleware.
 * 
 * Usage:
 *   router.post('/products', requirePermission('product.create'), controller.create);
 */
const requirePermission = (...perms) => {
  return (req, res, next) => {
    if (!req.can || !perms.every((p) => req.can(p))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Your role does not allow this action.',
          required: perms,
        },
      });
    }
    next();
  };
};

/**
 * Enforces that the authenticated member has at least one of the specified permissions.
 * Must run AFTER tenantMiddleware.
 */
const requireAnyPermission = (...perms) => {
  return (req, res, next) => {
    if (!req.can || !perms.some((p) => req.can(p))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'Your role does not allow this action.',
          required: perms,
        },
      });
    }
    next();
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
};
