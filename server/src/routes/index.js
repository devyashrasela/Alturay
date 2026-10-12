const router = require('express').Router();

const authRoutes = require('./authRoutes');
const businessRoutes = require('./businessRoutes');
const productRoutes = require('./productRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const authMiddleware = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

// Public routes
router.use('/auth', authRoutes);

// Authenticated routes
router.use('/businesses', authMiddleware, businessRoutes);

// Tenant-scoped routes
router.use('/businesses/:businessId/products', authMiddleware, tenantMiddleware, productRoutes);
router.use('/businesses/:businessId/invoices', authMiddleware, tenantMiddleware, invoiceRoutes);
router.use('/businesses/:businessId/dashboard', authMiddleware, tenantMiddleware, dashboardRoutes);

module.exports = router;
