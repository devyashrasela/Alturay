const router = require('express').Router();
const businessController = require('../controllers/businessController');
const memberController = require('../controllers/memberController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const validate = require('../middlewares/validate');
const { requirePermission } = require('../middlewares/requirePermission');
const authorizeBusinessUpdate = require('../middlewares/authorizeBusinessUpdate');
const { createBusinessSchema, updateBusinessSchema } = require('../validators/businessValidator');

router.get('/', businessController.list);
router.get('/check-qr-prefix', businessController.checkQrPrefix);
router.post('/', validate(createBusinessSchema), businessController.create);
router.get('/:businessId', tenantMiddleware, requirePermission('business.view'), businessController.getById);
router.get('/:businessId/templates/preview', tenantMiddleware, requirePermission('billing.configure'), businessController.previewTemplate);
router.put('/:businessId', tenantMiddleware, validate(updateBusinessSchema), authorizeBusinessUpdate, businessController.update);
router.get('/:businessId/access', tenantMiddleware, memberController.getAccess);
router.get('/:businessId/roles', tenantMiddleware, requirePermission('member.view'), memberController.getRoles);

module.exports = router;
