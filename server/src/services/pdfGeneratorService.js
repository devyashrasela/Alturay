const PDFDocument = require('pdfkit');
const { Writable } = require('stream');
const { getTemplate, resolveTemplateId } = require('./pdfTemplates');
const { registerFonts, loadLogo } = require('./pdfTemplates/helpers');

const MAX_PAGE = 14400; // Acrobat's page-size limit in points
const sink = () => new Writable({ write: (_chunk, _enc, done) => done() });

const build = (tpl, invoice, biz, height) => {
  const doc = new PDFDocument(tpl.pageOptions(invoice, biz, { height }));
  registerFonts(doc);
  return doc;
};

/**
 * Generates an invoice/bill PDF and pipes it to the response stream.
 * Supports A4 layouts and thermal receipts with content-fit dynamic height.
 */
const generateInvoicePDF = async (invoice, business, res, opts = {}) => {
  const biz = {
    ...(business && business.toJSON ? business.toJSON() : business),
    ...(opts.paperWidth && { receipt_paper_width: opts.paperWidth }),
  };

  const requestedTplId = opts.templateId || resolveTemplateId(invoice, biz);
  const tpl = getTemplate(requestedTplId, invoice.type);
  const ctx = {
    logo: tpl.kind === 'a4' && biz.logo_url ? await loadLogo(biz.logo_url) : null,
  };

  let height;
  if (tpl.kind === 'thermal') {
    const probe = build(tpl, invoice, biz, MAX_PAGE - 400);
    probe.pipe(sink());
    tpl.render(probe, invoice, biz, ctx);
    height = Math.min(MAX_PAGE, Math.ceil(probe.y + (probe.page.margins?.bottom || 15)));
    probe.end();
  }

  const doc = build(tpl, invoice, biz, height);
  const filename = `${invoice.invoice_number || 'document'}.pdf`;

  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  }
  doc.pipe(res);

  tpl.render(doc, invoice, biz, ctx);
  doc.end();
};

module.exports = { generateInvoicePDF };
