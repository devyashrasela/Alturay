const router = require('express').Router({ mergeParams: true });
const productController = require('../controllers/productController');
const validate = require('../middlewares/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productValidator');

router.get('/', productController.list);
router.post('/', validate(createProductSchema), productController.create);
router.get('/:productId', productController.getById);
router.put('/:productId', validate(updateProductSchema), productController.update);
router.delete('/:productId', productController.remove);

module.exports = router;
