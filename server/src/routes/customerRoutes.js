const router = require('express').Router({ mergeParams: true });
const customerController = require('../controllers/customerController');
const validate = require('../middlewares/validate');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customerValidator');

router.get('/', customerController.list);
router.post('/', validate(createCustomerSchema), customerController.create);
router.get('/:customerId', customerController.getById);
router.put('/:customerId', validate(updateCustomerSchema), customerController.update);
router.delete('/:customerId', customerController.delete);

module.exports = router;
