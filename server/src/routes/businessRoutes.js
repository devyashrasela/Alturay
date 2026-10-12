const router = require('express').Router();
const businessController = require('../controllers/businessController');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const validate = require('../middlewares/validate');
const { createBusinessSchema, updateBusinessSchema } = require('../validators/businessValidator');

router.get('/', businessController.list);
router.post('/', validate(createBusinessSchema), businessController.create);
router.get('/:businessId', tenantMiddleware, businessController.getById);
router.put('/:businessId', tenantMiddleware, validate(updateBusinessSchema), businessController.update);

module.exports = router;
