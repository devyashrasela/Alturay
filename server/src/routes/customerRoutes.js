const router = require('express').Router({ mergeParams: true });
const customerController = require('../controllers/customerController');
const validate = require('../middlewares/validate');
const { requirePermission } = require('../middlewares/requirePermission');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customerValidator');

router.get('/', requirePermission('customer.view'), customerController.list);
router.post('/', requirePermission('customer.create'), validate(createCustomerSchema), customerController.create);
router.get('/:customerId', requirePermission('customer.view'), customerController.getById);
router.put('/:customerId', requirePermission('customer.update'), validate(updateCustomerSchema), customerController.update);
router.delete('/:customerId', requirePermission('customer.delete'), customerController.delete);

module.exports = router;
