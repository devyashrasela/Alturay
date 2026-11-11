const router = require('express').Router();

const authRoutes = require('./authRoutes');
const businessRoutes = require('./businessRoutes');
const productRoutes = require('./productRoutes');
const customerRoutes = require('./customerRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const memberRoutes = require('./memberRoutes');
const uploadRoutes = require('./uploadRoutes');

const authMiddleware = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

// Public routes
router.use('/auth', authRoutes);

// Upload routes (authenticated)
router.use('/upload', uploadRoutes);

// Authenticated routes
router.use('/businesses', authMiddleware, businessRoutes);

// Tenant-scoped routes
router.use('/businesses/:businessId/products', authMiddleware, tenantMiddleware, productRoutes);
router.use('/businesses/:businessId/customers', authMiddleware, tenantMiddleware, customerRoutes);
router.use('/businesses/:businessId/invoices', authMiddleware, tenantMiddleware, invoiceRoutes);
router.use('/businesses/:businessId/dashboard', authMiddleware, tenantMiddleware, dashboardRoutes);
router.use('/businesses/:businessId/members', authMiddleware, tenantMiddleware, memberRoutes);

module.exports = router;
