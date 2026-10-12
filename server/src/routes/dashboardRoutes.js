const router = require('express').Router({ mergeParams: true });
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getStats);
router.get('/recent', dashboardController.getRecent);

module.exports = router;
