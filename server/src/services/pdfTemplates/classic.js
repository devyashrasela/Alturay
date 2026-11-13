const { FONT, numberFmt, moneyFmt, formatDate, totalsOf, formatBusinessAddress, formatCustomerAddress, formatShippingAddress, formatPaymentMethods } = require('./helpers');

const pageOptions = () => ({
  size: 'A4',
  margin: 50,
});

const render = (doc, invoice, business) => {
  const margin = 50;
  const pageWidth = doc.page.width - margin * 2;
  const cur = business.currency || 'INR';
  const typeLabel = invoice.type === 'bill' ? 'BILL' : 'INVOICE';

  // ── Header: Title & Meta ──
  doc.y = margin;
  doc.font(FONT.bold).fontSize(28).fillColor('#111827').text(typeLabel, margin, doc.y);
  doc.font(FONT.regular).fontSize(10).fillColor('#374151');
  doc.text(`${typeLabel} NO: ${invoice.invoice_number}`);
  doc.text(formatDate(invoice.issue_date).toUpperCase());

  if (invoice.description) {
    doc.moveDown(0.3);
    doc.font(FONT.regular).fontSize(10).fillColor('#4B5563')
      .text(invoice.description, margin, doc.y, { width: pageWidth * 0.75 });
  }

  doc.moveDown(0.8);

  // Top divider
  doc.save().lineWidth(1.2).strokeColor('#111827')
    .moveTo(margin, doc.y).lineTo(margin + pageWidth, doc.y).stroke().restore();

  doc.moveDown(1);

  // ── Dates & Recipient Section (2 columns) ──
  const secY = doc.y;
  const colWidth = pageWidth / 2;

  // Left column: Dates & Meta
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text(`${typeLabel} Date:`, margin, secY);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563')
    .text(formatDate(invoice.issue_date), margin, doc.y);

  if (invoice.due_date) {
    doc.moveDown(0.5);
    doc.font(FONT.bold).fontSize(9).fillColor('#111827')
      .text('Due Date:', margin, doc.y);
    doc.font(FONT.regular).fontSize(9).fillColor('#4B5563')
      .text(formatDate(invoice.due_date), margin, doc.y);
  }

  if (invoice.po_number) {
    doc.moveDown(0.5);
    doc.font(FONT.bold).fontSize(9).fillColor('#111827')
      .text('PO Number:', margin, doc.y);
    doc.font(FONT.regular).fontSize(9).fillColor('#4B5563')
      .text(invoice.po_number, margin, doc.y);
  }

  if (invoice.payment_terms) {
    doc.moveDown(0.5);
    doc.font(FONT.bold).fontSize(9).fillColor('#111827')
      .text('Payment Terms:', margin, doc.y);
    doc.font(FONT.regular).fontSize(9).fillColor('#4B5563')
      .text(invoice.payment_terms, margin, doc.y, { width: colWidth - 20 });
  }

  const leftBottomY = doc.y;

  // Right column: Invoice To & Ship To
  const rightX = margin + colWidth;
  doc.font(FONT.bold).fontSize(10).fillColor('#111827')
    .text(`${typeLabel} TO`, rightX, secY);
  doc.font(FONT.bold).fontSize(11).fillColor('#111827')
    .text(invoice.customer_name || invoice.customer?.name || 'Customer', rightX, doc.y + 2);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563');

  const custPhone = invoice.customer_phone || invoice.customer?.phone;
  if (custPhone) {
    doc.text(`Phone: ${custPhone}`, rightX, doc.y);
  }

  const custEmail = invoice.customer_email || invoice.customer?.email;
  if (custEmail) {
    doc.text(`Email: ${custEmail}`, rightX, doc.y);
  }

  const custAddress = formatCustomerAddress(invoice.customer);
  if (custAddress) {
    doc.text(custAddress, rightX, doc.y, { width: colWidth - 10 });
  }

  const shipAddr = formatShippingAddress(invoice.shipping_address, invoice.customer);
  if (shipAddr) {
    doc.moveDown(0.6);
    doc.font(FONT.bold).fontSize(8.5).fillColor('#111827')
      .text('SHIP TO:', rightX, doc.y);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563')
      .text(shipAddr, rightX, doc.y, { width: colWidth - 10 });
  }

  const sectionBottom = Math.max(leftBottomY, doc.y, secY + 70);
  doc.y = sectionBottom;
  doc.moveDown(1);

  // Divider above table
  doc.save().lineWidth(1).strokeColor('#111827')
    .moveTo(margin, doc.y).lineTo(margin + pageWidth, doc.y).stroke().restore();
  doc.moveDown(0.5);

  // ── Items Table Header ──
  const tableY = doc.y;
  const colW = {
    item: pageWidth * 0.45,
    qty: pageWidth * 0.15,
    price: pageWidth * 0.20,
    total: pageWidth * 0.20,
  };

  doc.font(FONT.bold).fontSize(10).fillColor('#111827');
  let x = margin;
  doc.text('Item', x, tableY, { width: colW.item }); x += colW.item;
  doc.text('Quantity', x, tableY, { width: colW.qty, align: 'center' }); x += colW.qty;
  doc.text('Price', x, tableY, { width: colW.price, align: 'right' }); x += colW.price;
  doc.text('Total', x, tableY, { width: colW.total, align: 'right' });

  doc.moveDown(0.8);
  // Divider below header
  doc.save().lineWidth(0.8).strokeColor('#D1D5DB')
    .moveTo(margin, doc.y).lineTo(margin + pageWidth, doc.y).stroke().restore();
  doc.moveDown(0.5);

  // ── Items Rows ──
  const items = invoice.items || [];
  items.forEach((item) => {
    const rowY = doc.y;
    x = margin;

    doc.font(FONT.regular).fontSize(9.5).fillColor('#1F2937');
    doc.text(item.item_name, x, rowY, { width: colW.item });
    const afterNameY = doc.y;

    if (item.description) {
      doc.font(FONT.regular).fontSize(8).fillColor('#6B7280')
        .text(item.description, x, afterNameY, { width: colW.item });
    }
    const itemCellBottom = doc.y;

    x += colW.item;
    doc.font(FONT.regular).fontSize(9.5).fillColor('#1F2937');
    doc.text(String(item.quantity), x, rowY, { width: colW.qty, align: 'center' }); x += colW.qty;
    doc.text(moneyFmt(item.unit_price, cur), x, rowY, { width: colW.price, align: 'right' }); x += colW.price;
    doc.font(FONT.bold).text(moneyFmt(item.line_total, cur), x, rowY, { width: colW.total, align: 'right' });

    doc.y = Math.max(itemCellBottom, rowY + 14);
    doc.moveDown(0.5);
  });

  doc.moveDown(0.8);
  // Line below items
  doc.save().lineWidth(1).strokeColor('#111827')
    .moveTo(margin, doc.y).lineTo(margin + pageWidth, doc.y).stroke().restore();
  doc.moveDown(1);

  // ── Totals Section ──
  const totalsW = pageWidth * 0.45;
  const totalsX = margin + pageWidth - totalsW;
  const t = totalsOf(invoice);

  const drawTotalLine = (label, val, isGrand = false) => {
    const currY = doc.y;
    doc.font(isGrand ? FONT.bold : FONT.regular)
      .fontSize(isGrand ? 11 : 9.5)
      .fillColor('#111827');
    doc.text(label, totalsX, currY, { width: totalsW * 0.55 });
    doc.font(isGrand ? FONT.bold : FONT.regular)
      .text(moneyFmt(val, cur), totalsX + totalsW * 0.55, currY, {
        width: totalsW * 0.45,
        align: 'right',
      });
    doc.moveDown(0.4);
  };

  drawTotalLine('Sub Total', t.preTax);
  if (t.tax > 0) drawTotalLine('Taxes', t.tax);
  if (t.discount > 0) drawTotalLine('Discount', -t.discount);

  doc.moveDown(0.2);
  doc.save().lineWidth(1).strokeColor('#111827')
    .moveTo(totalsX, doc.y).lineTo(totalsX + totalsW, doc.y).stroke().restore();
  doc.moveDown(0.5);

  drawTotalLine('Total Amount', t.total, true);

  doc.moveDown(0.2);
  doc.save().lineWidth(1).strokeColor('#111827')
    .moveTo(totalsX, doc.y).lineTo(totalsX + totalsW, doc.y).stroke().restore();

  // ── Footer / Bottom Details ──
  const footerY = Math.max(doc.y + 30, doc.page.height - 150);
  doc.y = footerY;

  // Bottom left: Payment Info, Terms & Conditions, Notes
  const paymentMethodsStr = formatPaymentMethods(invoice.accepted_payment_methods);

  if (paymentMethodsStr) {
    doc.font(FONT.bold).fontSize(9.5).fillColor('#111827')
      .text('Payment Information', margin, footerY);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
    doc.text(`Accepted: ${paymentMethodsStr}`, margin, doc.y, { width: colWidth - 20 });
  }

  if (invoice.notes) {
    doc.moveDown(0.4);
    doc.font(FONT.bold).fontSize(8.5).fillColor('#111827').text('Notes:', margin, doc.y);
    doc.font(FONT.regular).fontSize(8).fillColor('#4B5563').text(invoice.notes, margin, doc.y, { width: colWidth - 20 });
  }

  if (invoice.terms_and_conditions) {
    doc.moveDown(0.4);
    doc.font(FONT.bold).fontSize(8.5).fillColor('#111827').text('Terms & Conditions:', margin, doc.y);
    doc.font(FONT.regular).fontSize(8).fillColor('#4B5563').text(invoice.terms_and_conditions, margin, doc.y, { width: colWidth - 20 });
  }

  // Bottom right: Business info
  doc.font(FONT.bold).fontSize(10).fillColor('#111827')
    .text(business.name, rightX, footerY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
  const bizAddr = formatBusinessAddress(business);
  if (bizAddr) doc.text(bizAddr, rightX, doc.y, { width: colWidth });
  if (business.phone) doc.text(`Phone: ${business.phone}`, rightX, doc.y);
  if (business.email) doc.text(`Email: ${business.email}`, rightX, doc.y);
  if (business.tax_id) doc.text(`Tax ID: ${business.tax_id}`, rightX, doc.y);
};

module.exports = { id: 'classic', kind: 'a4', pageOptions, render };
