const PDFDocument = require('pdfkit');

/**
 * Generates a branded PDF for an invoice/bill and pipes it to the response.
 */
const generateInvoicePDF = (invoice, business, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Set response headers
  const filename = `${invoice.invoice_number}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ── Header: Business Info ──
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#F45B2A')
    .text(business.name, { align: 'left' });

  doc.fontSize(10).font('Helvetica').fillColor('#6B7280');
  if (business.address) doc.text(business.address);
  if (business.email) doc.text(`Email: ${business.email}`);
  if (business.phone) doc.text(`Phone: ${business.phone}`);
  if (business.tax_id) doc.text(`Tax ID: ${business.tax_id}`);

  doc.moveDown(1.5);

  // ── Invoice Title ──
  const typeLabel = invoice.type === 'invoice' ? 'INVOICE' : 'BILL';
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#171717')
    .text(typeLabel, { align: 'right' });

  doc.fontSize(10).font('Helvetica').fillColor('#6B7280');
  doc.text(`Number: ${invoice.invoice_number}`, { align: 'right' });
  doc.text(`Date: ${invoice.issue_date}`, { align: 'right' });
  if (invoice.due_date) doc.text(`Due: ${invoice.due_date}`, { align: 'right' });
  doc.text(`Status: ${invoice.status.toUpperCase()}`, { align: 'right' });

  doc.moveDown(1);

  // ── Bill To ──
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#171717').text('Bill To:');
  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(invoice.customer_name);
  if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`);

  doc.moveDown(1.5);

  // ── Items Table Header ──
  const tableTop = doc.y;
  const colWidths = {
    item: pageWidth * 0.30,
    qty: pageWidth * 0.10,
    price: pageWidth * 0.15,
    discount: pageWidth * 0.15,
    tax: pageWidth * 0.12,
    total: pageWidth * 0.18,
  };

  // Header row background
  doc.rect(50, tableTop - 4, pageWidth, 22).fill('#F3F4F6');
  doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');

  let x = 50;
  doc.text('Item', x, tableTop, { width: colWidths.item }); x += colWidths.item;
  doc.text('Qty', x, tableTop, { width: colWidths.qty, align: 'center' }); x += colWidths.qty;
  doc.text('Price', x, tableTop, { width: colWidths.price, align: 'right' }); x += colWidths.price;
  doc.text('Discount', x, tableTop, { width: colWidths.discount, align: 'right' }); x += colWidths.discount;
  doc.text('Tax %', x, tableTop, { width: colWidths.tax, align: 'right' }); x += colWidths.tax;
  doc.text('Total', x, tableTop, { width: colWidths.total, align: 'right' });

  doc.moveDown(0.8);

  // ── Items Rows ──
  const items = invoice.items || [];
  doc.font('Helvetica').fontSize(9).fillColor('#374151');

  items.forEach((item) => {
    const y = doc.y;
    x = 50;

    const discountStr = (parseFloat(item.item_discount_amount) > 0 || parseFloat(item.item_discount_percent) > 0)
      ? `₹${parseFloat(item.item_discount_amount).toFixed(0)} + ${parseFloat(item.item_discount_percent)}%`
      : '—';

    doc.text(item.item_name, x, y, { width: colWidths.item }); x += colWidths.item;
    doc.text(String(item.quantity), x, y, { width: colWidths.qty, align: 'center' }); x += colWidths.qty;
    doc.text(`₹${parseFloat(item.unit_price).toFixed(2)}`, x, y, { width: colWidths.price, align: 'right' }); x += colWidths.price;
    doc.text(discountStr, x, y, { width: colWidths.discount, align: 'right' }); x += colWidths.discount;
    doc.text(`${parseFloat(item.tax_rate)}%`, x, y, { width: colWidths.tax, align: 'right' }); x += colWidths.tax;
    doc.text(`₹${parseFloat(item.line_total).toFixed(2)}`, x, y, { width: colWidths.total, align: 'right' });

    doc.moveDown(0.6);

    // Thin separator
    doc.strokeColor('#E5E7EB').lineWidth(0.5)
      .moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke();
    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // ── Totals ──
  const totalsX = 50 + pageWidth * 0.55;
  const totalsWidth = pageWidth * 0.45;

  const drawTotalRow = (label, value, bold = false) => {
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 11 : 10)
      .fillColor('#374151');
    doc.text(label, totalsX, y, { width: totalsWidth * 0.55 });
    doc.text(`₹${parseFloat(value).toFixed(2)}`, totalsX + totalsWidth * 0.55, y, {
      width: totalsWidth * 0.45,
      align: 'right',
    });
    doc.moveDown(0.4);
  };

  drawTotalRow('Subtotal', invoice.subtotal);
  drawTotalRow('Tax', invoice.tax_total);

  if (parseFloat(invoice.discount_amount) > 0 || parseFloat(invoice.discount_percent) > 0) {
    const discLabel = parseFloat(invoice.discount_percent) > 0
      ? `Discount (${invoice.discount_percent}%)`
      : 'Discount';
    drawTotalRow(discLabel, `-${(parseFloat(invoice.discount_amount) + (parseFloat(invoice.subtotal) * parseFloat(invoice.discount_percent) / 100)).toFixed(2)}`);
  }

  // Separator
  doc.strokeColor('#171717').lineWidth(1)
    .moveTo(totalsX, doc.y).lineTo(totalsX + totalsWidth, doc.y).stroke();
  doc.moveDown(0.5);

  drawTotalRow('Total Amount', invoice.total_amount, true);

  // ── Notes ──
  if (invoice.notes) {
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('Notes:');
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(invoice.notes);
  }

  // ── Footer ──
  doc.moveDown(3);
  doc.fontSize(9).font('Helvetica').fillColor('#9CA3AF')
    .text('Thank you for your business!', { align: 'center' });
  doc.text(`Generated by Alturay`, { align: 'center' });

  doc.end();
};

module.exports = { generateInvoicePDF };
