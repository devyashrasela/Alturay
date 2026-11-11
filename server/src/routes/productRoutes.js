const router = require('express').Router({ mergeParams: true });
const productController = require('../controllers/productController');
const validate = require('../middlewares/validate');
const { requirePermission } = require('../middlewares/requirePermission');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');

router.get('/', requirePermission('product.view'), productController.list);
router.post('/', requirePermission('product.create'), validate(createProductSchema), productController.create);
router.get('/:productId', requirePermission('product.view'), productController.getById);
router.put('/:productId', requirePermission('product.update'), validate(updateProductSchema), productController.update);
router.delete('/:productId', requirePermission('product.delete'), productController.remove);

module.exports = router;
