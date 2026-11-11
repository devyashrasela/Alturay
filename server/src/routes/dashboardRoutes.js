const router = require('express').Router({ mergeParams: true });
const dashboardController = require('../controllers/dashboardController');
const { requirePermission } = require('../middlewares/requirePermission');

router.get('/stats', requirePermission('dashboard.view'), dashboardController.getStats);
router.get('/recent', requirePermission('invoice.view'), dashboardController.getRecent);

module.exports = router;
