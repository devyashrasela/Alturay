const { BusinessMember, Business } = require('../models');

const tenantMiddleware = async (req, res, next) => {
  try {
    const businessId = req.params.businessId || req.headers['x-business-id'];

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_BUSINESS',
          message: 'Business ID is required. Provide it as a route parameter or X-Business-Id header.',
        },
      });
    }

    // Verify the authenticated user has access to this business
    const membership = await BusinessMember.findOne({
      where: {
        user_id: req.user.id,
        business_id: businessId,
      },
      include: [{
        model: Business,
        as: 'business',
      }],
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this business.',
        },
      });
    }

    req.business = membership.business;
    req.businessId = businessId;
    req.memberRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantMiddleware;
