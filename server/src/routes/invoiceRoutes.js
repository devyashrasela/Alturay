const router = require('express').Router({ mergeParams: true });
const invoiceController = require('../controllers/invoiceController');
const { Invoice, InvoiceItem, Business } = require('../models');
const { generateInvoicePDF } = require('../services/pdfGeneratorService');
const validate = require('../middlewares/validate');
const { createInvoiceSchema, updateInvoiceSchema, updateStatusSchema } = require('../validators/invoiceValidator');

router.get('/', invoiceController.list);
router.post('/', validate(createInvoiceSchema), invoiceController.create);
router.get('/:invoiceId', invoiceController.getById);
router.put('/:invoiceId', validate(updateInvoiceSchema), invoiceController.update);
router.patch('/:invoiceId/status', validate(updateStatusSchema), invoiceController.updateStatus);

// PDF download
router.get('/:invoiceId/pdf', async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.invoiceId, business_id: req.businessId },
      include: [{ model: InvoiceItem, as: 'items' }],
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found.' },
      });
    }

    generateInvoicePDF(invoice, req.business, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
