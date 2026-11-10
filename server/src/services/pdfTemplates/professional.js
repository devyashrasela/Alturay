const { FONT, numberFmt, moneyFmt, formatDate, totalsOf, formatBusinessAddress, formatCustomerAddress, formatShippingAddress, formatPaymentMethods } = require('./helpers');

const pageOptions = () => ({
  size: 'A4',
  margin: 45,
});

const ACCENT_COLOR = '#4C7A5D';
const ACCENT_LIGHT = '#F0F5F1';

const render = (doc, invoice, business) => {
  const margin = 45;
  const contentLeft = margin + 20; // Room for left accent bar
  const pageWidth = doc.page.width - contentLeft - margin;
  const cur = business.currency || 'INR';
  const typeLabel = invoice.type === 'bill' ? 'BILL' : 'INVOICE';

  // ── Left Accent Bar ──
  doc.save();
  // Pale mint top accent
  doc.roundedRect(margin, margin, 14, 50, 4).fill('#C8DDD0');
  // Forest green main accent strip
  doc.roundedRect(margin, margin + 55, 14, doc.page.height - margin * 2 - 55, 4).fill(ACCENT_COLOR);
  doc.restore();

  // ── Header ──
  doc.y = margin + 5;
  const headerY = doc.y;

  // Left: Invoice No & Due Date
  doc.font(FONT.regular).fontSize(9.5).fillColor('#4B5563')
    .text(`NO. ${invoice.invoice_number}`, contentLeft, headerY);
  const dueStr = invoice.due_date ? formatDate(invoice.due_date) : formatDate(invoice.issue_date);
  doc.text(`DUE ${dueStr.toUpperCase()}`, contentLeft, doc.y);

  if (invoice.po_number) {
    doc.text(`PO: ${invoice.po_number}`, contentLeft, doc.y);
  }

  // Right: Title & Description
  doc.font(FONT.bold).fontSize(30).fillColor('#111827')
    .text(typeLabel, contentLeft, headerY - 5, { width: pageWidth, align: 'right' });

  if (invoice.description) {
    doc.font(FONT.regular).fontSize(9.5).fillColor('#4B5563')
      .text(invoice.description, contentLeft, doc.y, { width: pageWidth, align: 'right' });
  }

  doc.y = Math.max(doc.y, headerY + 50);
  doc.save().lineWidth(0.8).strokeColor('#D1D5DB')
    .moveTo(contentLeft, doc.y).lineTo(contentLeft + pageWidth, doc.y).stroke().restore();

  doc.moveDown(1);

  // ── 2-Column: Recipient & Company ──
  const partyY = doc.y;
  const halfW = pageWidth / 2;

  // Left: Invoice To & Ship To
  doc.font(FONT.bold).fontSize(8.5).fillColor('#6B7280')
    .text(`${typeLabel} TO`, contentLeft, partyY);
  doc.font(FONT.bold).fontSize(13).fillColor('#111827')
    .text(invoice.customer_name || invoice.customer?.name || 'Customer', contentLeft, doc.y + 2);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563');

  const custPhone = invoice.customer_phone || invoice.customer?.phone;
  if (custPhone) doc.text(`Phone: ${custPhone}`, contentLeft, doc.y);

  const custEmail = invoice.customer_email || invoice.customer?.email;
  if (custEmail) doc.text(`Email: ${custEmail}`, contentLeft, doc.y);

  const custAddress = formatCustomerAddress(invoice.customer);
  if (custAddress) doc.text(custAddress, contentLeft, doc.y, { width: halfW - 20 });

  const shipAddr = formatShippingAddress(invoice.shipping_address);
  if (shipAddr) {
    doc.moveDown(0.4);
    doc.font(FONT.bold).fontSize(8.5).fillColor('#6B7280').text('SHIP TO:', contentLeft, doc.y);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563').text(shipAddr, contentLeft, doc.y, { width: halfW - 20 });
  }
  const leftPartyBottom = doc.y;

  // Right: Company
  const compX = contentLeft + halfW;
  doc.font(FONT.bold).fontSize(8.5).fillColor('#6B7280')
    .text('COMPANY:', compX, partyY);
  doc.font(FONT.bold).fontSize(13).fillColor('#111827')
    .text(business.name, compX, doc.y + 2);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563');
  const bizAddr = formatBusinessAddress(business);
  if (bizAddr) doc.text(bizAddr, compX, doc.y, { width: halfW });
  if (business.phone) doc.text(`Phone: ${business.phone}`, compX, doc.y);
  if (business.email) doc.text(`Email: ${business.email}`, compX, doc.y);
  if (business.tax_id) doc.text(`Tax ID: ${business.tax_id}`, compX, doc.y);

  const partiesBottom = Math.max(leftPartyBottom, doc.y, partyY + 70);
  doc.y = partiesBottom + 15;

  // ── Items Table ──
  const tableTop = doc.y;
  // Colored header bar
  doc.roundedRect(contentLeft, tableTop, pageWidth, 24, 3).fill(ACCENT_COLOR);

  doc.font(FONT.bold).fontSize(9.5).fillColor('#FFFFFF');
  doc.text('Description', contentLeft + 12, tableTop + 7, { width: pageWidth * 0.65 });
  doc.text('Price', contentLeft + pageWidth * 0.65, tableTop + 7, { width: pageWidth * 0.35 - 12, align: 'right' });

  doc.y = tableTop + 32;

  // Rows
  const items = invoice.items || [];
  items.forEach((item) => {
    const rowY = doc.y;
    doc.font(FONT.regular).fontSize(9.5).fillColor('#1F2937');

    const descText = item.quantity > 1
      ? `${item.item_name}  (${item.quantity} × ${moneyFmt(item.unit_price, cur)})`
      : item.item_name;

    doc.text(descText, contentLeft + 12, rowY, { width: pageWidth * 0.65 });
    const afterNameY = doc.y;

    if (item.description) {
      doc.font(FONT.regular).fontSize(8).fillColor('#6B7280')
        .text(item.description, contentLeft + 12, afterNameY, { width: pageWidth * 0.65 });
    }
    const itemCellBottom = doc.y;

    doc.font(FONT.bold).fontSize(9.5).fillColor('#1F2937')
      .text(moneyFmt(item.line_total, cur), contentLeft + pageWidth * 0.65, rowY, {
        width: pageWidth * 0.35 - 12,
        align: 'right',
      });

    doc.y = Math.max(itemCellBottom, rowY + 16);
    doc.moveDown(0.4);
    doc.save().lineWidth(0.5).strokeColor('#E5E7EB')
      .moveTo(contentLeft + 6, doc.y).lineTo(contentLeft + pageWidth - 6, doc.y).stroke().restore();
    doc.moveDown(0.4);
  });

  doc.moveDown(1);

  // ── Totals Box (Light green background) ──
  const t = totalsOf(invoice);
  const totalsBoxW = pageWidth * 0.45;
  const totalsBoxX = contentLeft + pageWidth - totalsBoxW;
  const boxTop = doc.y;
  const boxHeight = 75 + (t.discount > 0 ? 16 : 0) + (t.tax > 0 ? 16 : 0);

  doc.roundedRect(totalsBoxX, boxTop, totalsBoxW, boxHeight, 4).fill(ACCENT_LIGHT);

  doc.y = boxTop + 10;
  const drawRow = (lbl, val, bold = false) => {
    const rY = doc.y;
    doc.font(bold ? FONT.bold : FONT.regular)
      .fontSize(bold ? 10.5 : 9)
      .fillColor('#1F2937');
    doc.text(lbl, totalsBoxX + 14, rY, { width: totalsBoxW * 0.45 });
    doc.text(moneyFmt(val, cur), totalsBoxX + totalsBoxW * 0.45, rY, {
      width: totalsBoxW * 0.55 - 14,
      align: 'right',
    });
    doc.moveDown(0.4);
  };

  drawRow('Subtotal', t.preTax);
  if (t.tax > 0) drawRow('Tax', t.tax);
  if (t.discount > 0) drawRow('Discount', -t.discount);

  doc.moveDown(0.2);
  drawRow('TOTAL', t.total, true);

  doc.y = Math.max(doc.y, boxTop + boxHeight + 15);

  // ── Payment Terms / Notes / Terms & Conditions ──
  const paymentMethodsStr = formatPaymentMethods(invoice.accepted_payment_methods);
  const termsText = invoice.payment_terms;
  const tc = invoice.terms_and_conditions;
  const hasBottomDetails = Boolean(paymentMethodsStr || termsText || invoice.notes || tc);

  if (hasBottomDetails) {
    doc.font(FONT.bold).fontSize(9.5).fillColor('#111827')
      .text('PAYMENT DETAILS', contentLeft, doc.y);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');

    if (paymentMethodsStr) {
      doc.text(`Accepted Methods: ${paymentMethodsStr}`, contentLeft, doc.y + 2, { width: pageWidth * 0.65 });
    }
    if (termsText) {
      doc.text(`Terms: ${termsText}`, contentLeft, doc.y + 2, { width: pageWidth * 0.65 });
    }
    if (invoice.notes) {
      doc.text(`Notes: ${invoice.notes}`, contentLeft, doc.y + 2, { width: pageWidth * 0.65 });
    }
    if (tc) {
      doc.moveDown(0.3);
      doc.font(FONT.bold).fontSize(8.5).fillColor('#111827').text('Terms & Conditions:', contentLeft, doc.y);
      doc.font(FONT.regular).fontSize(8).fillColor('#4B5563').text(tc, contentLeft, doc.y, { width: pageWidth * 0.65 });
    }
  }

  // ── Signature Lines at bottom ──
  const sigY = doc.page.height - margin - 35;
  const sigW = 160;

  doc.save().lineWidth(0.8).strokeColor('#4B5563')
    .moveTo(contentLeft, sigY).lineTo(contentLeft + sigW, sigY).stroke()
    .moveTo(contentLeft + pageWidth - 100, sigY).lineTo(contentLeft + pageWidth, sigY).stroke()
    .restore();

  doc.font(FONT.regular).fontSize(8).fillColor('#6B7280')
    .text('Signature of Authorized Person', contentLeft, sigY + 5)
    .text('Date', contentLeft + pageWidth - 100, sigY + 5, { width: 100, align: 'center' });
};

module.exports = { id: 'professional', kind: 'a4', pageOptions, render };
