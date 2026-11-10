const { FONT, numberFmt, moneyFmt, formatDate, totalsOf, formatCustomerAddress, formatShippingAddress, formatPaymentMethods } = require('./helpers');

const pageOptions = () => ({
  size: 'A4',
  margin: 45,
});

const PURPLE = '#4C1D95';
const PURPLE_LIGHT = '#F5F3FF';

const render = (doc, invoice, business, ctx = {}) => {
  const margin = 45;
  const pageWidth = doc.page.width - margin * 2;
  const cur = business.currency || 'INR';
  const typeLabel = invoice.type === 'bill' ? 'BILL' : 'INVOICE';

  // ── Header: Title & Logo ──
  doc.y = margin;
  const headerY = doc.y;

  // Title on left
  doc.font(FONT.bold).fontSize(26).fillColor('#111827')
    .text(typeLabel, margin, headerY);
  doc.font(FONT.regular).fontSize(9.5).fillColor('#4B5563');
  doc.text(`${typeLabel} Number: #${invoice.invoice_number}`);
  doc.text(`${typeLabel} Date: ${formatDate(invoice.issue_date)}`);
  if (invoice.due_date) {
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`);
  }
  if (invoice.po_number) {
    doc.text(`PO Number: ${invoice.po_number}`);
  }
  if (invoice.description) {
    doc.moveDown(0.2);
    doc.font(FONT.regular).fontSize(9).fillColor('#6B7280')
      .text(invoice.description, margin, doc.y, { width: pageWidth * 0.6 });
  }

  // Logo / Business mark on right
  const logoBoxSize = 56;
  const logoX = margin + pageWidth - logoBoxSize;

  if (ctx.logo) {
    try {
      doc.image(ctx.logo, logoX, headerY, { fit: [logoBoxSize, logoBoxSize], align: 'right' });
    } catch {
      drawLogoTile(doc, business.name, logoX, headerY, logoBoxSize);
    }
  } else {
    drawLogoTile(doc, business.name, logoX, headerY, logoBoxSize);
  }

  doc.y = Math.max(doc.y, headerY + logoBoxSize + 15);
  doc.moveDown(0.8);

  // ── 2 Columns: Business & Bill-To ──
  const partyY = doc.y;
  const halfW = pageWidth / 2;

  // Left: Business details
  doc.font(FONT.bold).fontSize(10).fillColor('#111827')
    .text(business.name.toUpperCase(), margin, partyY);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563');
  if (business.address) doc.text(business.address, margin, doc.y, { width: halfW - 20 });
  if (business.phone) doc.text(business.phone, margin, doc.y);
  if (business.email) doc.text(business.email, margin, doc.y);
  if (business.tax_id) doc.text(`GST/Tax: ${business.tax_id}`, margin, doc.y);
  const leftPartyBottom = doc.y;

  // Right: Bill To & Ship To
  const rightX = margin + halfW;
  doc.font(FONT.bold).fontSize(10).fillColor('#111827')
    .text(`BILL TO`, rightX, partyY);
  doc.font(FONT.bold).fontSize(11).fillColor('#111827')
    .text(invoice.customer_name || invoice.customer?.name || 'Customer', rightX, doc.y + 2);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563');

  const custPhone = invoice.customer_phone || invoice.customer?.phone;
  if (custPhone) doc.text(custPhone, rightX, doc.y);

  const custEmail = invoice.customer_email || invoice.customer?.email;
  if (custEmail) doc.text(custEmail, rightX, doc.y);

  const custAddress = formatCustomerAddress(invoice.customer);
  if (custAddress) doc.text(custAddress, rightX, doc.y, { width: halfW });

  const shipAddr = formatShippingAddress(invoice.shipping_address);
  if (shipAddr) {
    doc.moveDown(0.4);
    doc.font(FONT.bold).fontSize(8.5).fillColor('#111827').text('SHIP TO:', rightX, doc.y);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563').text(shipAddr, rightX, doc.y, { width: halfW });
  }

  const partiesBottom = Math.max(leftPartyBottom, doc.y, partyY + 65);
  doc.y = partiesBottom + 15;

  // ── Table ──
  const tableTop = doc.y;
  const colW = {
    desc: pageWidth * 0.48,
    price: pageWidth * 0.18,
    qty: pageWidth * 0.12,
    amount: pageWidth * 0.22,
  };

  // Header border box
  doc.save().lineWidth(1).strokeColor('#111827')
    .rect(margin, tableTop, pageWidth, 22).stroke().restore();

  doc.font(FONT.bold).fontSize(9).fillColor('#111827');
  let x = margin + 8;
  doc.text('Item & Description', x, tableTop + 6, { width: colW.desc - 8 }); x += colW.desc;
  doc.text('Unit Price', x, tableTop + 6, { width: colW.price, align: 'right' }); x += colW.price;
  doc.text('Qty', x, tableTop + 6, { width: colW.qty, align: 'center' }); x += colW.qty;
  doc.text('Amount', x, tableTop + 6, { width: colW.amount - 8, align: 'right' });

  doc.y = tableTop + 22;

  // Rows
  const items = invoice.items || [];
  items.forEach((item) => {
    const rY = doc.y;
    const rowH = item.description ? 34 : 22;

    // Row border
    doc.save().lineWidth(0.6).strokeColor('#D1D5DB')
      .rect(margin, rY, pageWidth, rowH).stroke().restore();

    doc.font(FONT.regular).fontSize(9).fillColor('#1F2937');
    x = margin + 8;
    doc.text(item.item_name, x, rY + 5, { width: colW.desc - 8 });
    if (item.description) {
      doc.font(FONT.regular).fontSize(7.5).fillColor('#6B7280')
        .text(item.description, x, rY + 18, { width: colW.desc - 8 });
    }

    x += colW.desc;
    doc.font(FONT.regular).fontSize(9).fillColor('#1F2937');
    doc.text(moneyFmt(item.unit_price, cur), x, rY + 6, { width: colW.price, align: 'right' }); x += colW.price;
    doc.text(String(item.quantity), x, rY + 6, { width: colW.qty, align: 'center' }); x += colW.qty;
    doc.font(FONT.bold).text(moneyFmt(item.line_total, cur), x, rY + 6, { width: colW.amount - 8, align: 'right' });

    doc.y = rY + rowH;
  });

  doc.moveDown(1);

  // ── Notes & Terms (Left) & Totals (Right) ──
  const postTableY = doc.y;
  const t = totalsOf(invoice);

  // Left: Notes / Terms / T&C
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text('NOTES & TERMS:', margin, postTableY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');

  const paymentTerms = invoice.payment_terms || business.default_payment_terms;
  if (paymentTerms) {
    doc.text(`Terms: ${paymentTerms}`, margin, doc.y + 3, { width: halfW - 20 });
  }
  if (invoice.notes) {
    doc.text(invoice.notes, margin, doc.y + 2, { width: halfW - 20 });
  }
  const tc = invoice.terms_and_conditions || business.default_terms_and_conditions;
  if (tc) {
    doc.moveDown(0.3);
    doc.font(FONT.bold).fontSize(8.5).fillColor('#111827').text('Terms & Conditions:', margin, doc.y);
    doc.font(FONT.regular).fontSize(8).fillColor('#4B5563').text(tc, margin, doc.y, { width: halfW - 20 });
  }

  // Right: Totals Box (Bordered grid)
  const totalsW = pageWidth * 0.44;
  const totalsX = margin + pageWidth - totalsW;
  let currentTotY = postTableY;

  const drawBorderedTotalRow = (lbl, val, bold = false) => {
    const rowH = 20;
    doc.save().lineWidth(0.8).strokeColor('#111827')
      .rect(totalsX, currentTotY, totalsW, rowH).stroke().restore();

    doc.font(bold ? FONT.bold : FONT.regular)
      .fontSize(bold ? 10 : 9)
      .fillColor('#111827');
    doc.text(lbl, totalsX + 10, currentTotY + 5, { width: totalsW * 0.5 });
    doc.text(moneyFmt(val, cur), totalsX + totalsW * 0.5, currentTotY + 5, {
      width: totalsW * 0.5 - 10,
      align: 'right',
    });
    currentTotY += rowH;
  };

  drawBorderedTotalRow('Sub-Total', t.preTax);
  if (t.tax > 0) drawBorderedTotalRow('Tax', t.tax);
  if (t.discount > 0) drawBorderedTotalRow('Discount', -t.discount);
  drawBorderedTotalRow('Total', t.total, true);

  doc.y = Math.max(doc.y, currentTotY + 25);

  // ── Bottom: Payment Method & Prepared By ──
  const bottomY = Math.max(doc.y, doc.page.height - margin - 70);

  // Left: Payment Method
  const payMethods = formatPaymentMethods(invoice.accepted_payment_methods || business.default_payment_methods);
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text('PAYMENT METHODS', margin, bottomY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
  if (payMethods) {
    doc.text(`Accepted: ${payMethods}`, margin, doc.y + 2, { width: halfW - 20 });
  } else {
    doc.text(`Bank: Business Account / Cash`, margin, doc.y + 2);
  }

  // Right: Prepared By
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text('PREPARED BY', rightX, bottomY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
  doc.text(business.name, rightX, doc.y + 2);
  doc.text('Authorized Representative', rightX, doc.y);

  // ── Decorative Bottom Bars ──
  doc.save();
  doc.rect(0, doc.page.height - 12, doc.page.width, 12).fill(PURPLE);
  doc.rect(0, doc.page.height - 14, doc.page.width, 2).fill('#15803D');
  doc.restore();
};

const drawLogoTile = (doc, name, x, y, size) => {
  doc.save();
  doc.roundedRect(x, y, size, size, 8).fill(PURPLE);
  const initials = (name || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  doc.font(FONT.bold).fontSize(18).fillColor('#FFFFFF')
    .text(initials, x, y + size / 2 - 10, { width: size, align: 'center' });
  doc.restore();
};

module.exports = { id: 'modern', kind: 'a4', pageOptions, render };
