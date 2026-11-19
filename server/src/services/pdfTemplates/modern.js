const {
  FONT,
  numberFmt,
  moneyFmt,
  formatDate,
  totalsOf,
  formatBusinessAddress,
  formatCustomerAddress,
  formatShippingAddress,
  formatPaymentMethods,
  drawBusinessLogo,
} = require('./helpers');

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
  const logoBoxSize = 56;
  const headerTextWidth = pageWidth - logoBoxSize - 20;

  // Title on left
  doc.font(FONT.bold).fontSize(26).fillColor('#111827')
    .text(typeLabel, margin, headerY, { width: headerTextWidth });
  doc.font(FONT.regular).fontSize(9.5).fillColor('#4B5563');
  doc.text(`${typeLabel} Number: #${invoice.invoice_number}`, margin, doc.y, { width: headerTextWidth });
  doc.text(`${typeLabel} Date: ${formatDate(invoice.issue_date)}`, margin, doc.y, { width: headerTextWidth });
  if (invoice.due_date) {
    doc.text(`Due Date: ${formatDate(invoice.due_date)}`, margin, doc.y, { width: headerTextWidth });
  }
  if (invoice.po_number) {
    doc.text(`PO Number: ${invoice.po_number}`, margin, doc.y, { width: headerTextWidth });
  }
  if (invoice.description) {
    doc.moveDown(0.2);
    doc.font(FONT.regular).fontSize(9).fillColor('#6B7280')
      .text(invoice.description, margin, doc.y, { width: headerTextWidth });
  }

  // Logo / Business mark on right
  const logoX = margin + pageWidth - logoBoxSize;

  if (ctx.logo) {
    if (!drawBusinessLogo(doc, ctx.logo, {
      x: logoX,
      y: headerY,
      maxWidth: logoBoxSize,
      maxHeight: logoBoxSize,
      align: 'right',
      valign: 'center',
    })) {
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
  const bizAddr = formatBusinessAddress(business);
  if (bizAddr) doc.text(bizAddr, margin, doc.y, { width: halfW - 20 });
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
  const cellPad = 8;
  const grid = { color: '#111827', width: 0.7 };
  // Left edge of every column, used for both the text boxes and the column rules.
  const colX = [
    margin,
    margin + colW.desc,
    margin + colW.desc + colW.price,
    margin + colW.desc + colW.price + colW.qty,
  ];

  // Vertical rules at each column boundary so the table reads as a grid.
  const drawColumnRules = (top, height) => {
    doc.save().lineWidth(grid.width).strokeColor(grid.color);
    colX.slice(1).forEach((lineX) => {
      doc.moveTo(lineX, top).lineTo(lineX, top + height).stroke();
    });
    doc.restore();
  };

  // Header row
  const headerH = 22;
  doc.save().lineWidth(grid.width).strokeColor(grid.color)
    .rect(margin, tableTop, pageWidth, headerH).stroke().restore();
  drawColumnRules(tableTop, headerH);

  doc.font(FONT.bold).fontSize(9).fillColor('#111827');
  doc.text('Item & Description', colX[0] + cellPad, tableTop + 6, { width: colW.desc - cellPad * 2 });
  doc.text('Unit Price', colX[1], tableTop + 6, { width: colW.price - cellPad, align: 'right' });
  doc.text('Qty', colX[2], tableTop + 6, { width: colW.qty, align: 'center' });
  doc.text('Amount', colX[3], tableTop + 6, { width: colW.amount - cellPad, align: 'right' });

  doc.y = tableTop + headerH;

  // Rows
  const items = invoice.items || [];
  items.forEach((item) => {
    const rY = doc.y;
    const descWidth = colW.desc - cellPad * 2;
    doc.font(FONT.regular).fontSize(9);
    const itemHeight = doc.heightOfString(item.item_name || '', { width: descWidth });
    doc.fontSize(7.5);
    const descriptionHeight = item.description
      ? doc.heightOfString(item.description, { width: descWidth })
      : 0;
    const rowH = Math.max(22, 10 + itemHeight + (descriptionHeight ? descriptionHeight + 4 : 0));

    // Row border + column rules, matching the header grid
    doc.save().lineWidth(grid.width).strokeColor(grid.color)
      .rect(margin, rY, pageWidth, rowH).stroke().restore();
    drawColumnRules(rY, rowH);

    doc.font(FONT.regular).fontSize(9).fillColor('#1F2937');
    doc.text(item.item_name || '', colX[0] + cellPad, rY + 5, { width: descWidth });
    if (item.description) {
      doc.font(FONT.regular).fontSize(7.5).fillColor('#6B7280')
        .text(item.description, colX[0] + cellPad, rY + 5 + itemHeight + 2, { width: descWidth });
    }

    doc.font(FONT.regular).fontSize(9).fillColor('#1F2937');
    doc.text(moneyFmt(item.unit_price, cur), colX[1], rY + 6, { width: colW.price - cellPad, align: 'right' });
    doc.text(String(item.quantity), colX[2], rY + 6, { width: colW.qty, align: 'center' });
    doc.font(FONT.bold).text(moneyFmt(item.line_total, cur), colX[3], rY + 6, { width: colW.amount - cellPad, align: 'right' });

    doc.y = rY + rowH;
  });

  doc.moveDown(1);

  // ── Notes & Terms (Left) & Totals (Right) ──
  const postTableY = doc.y;
  const t = totalsOf(invoice);

  // Left: Notes / Terms / T&C
  const paymentTerms = invoice.payment_terms;
  const tc = invoice.terms_and_conditions;
  const hasLeftNotes = Boolean(paymentTerms || invoice.notes || tc);

  if (hasLeftNotes) {
    doc.font(FONT.bold).fontSize(9).fillColor('#111827')
      .text('NOTES & TERMS:', margin, postTableY);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');

    if (paymentTerms) {
      doc.text(`Terms: ${paymentTerms}`, margin, doc.y + 3, { width: halfW - 20 });
    }
    if (invoice.notes) {
      doc.text(invoice.notes, margin, doc.y + 2, { width: halfW - 20 });
    }
    if (tc) {
      doc.moveDown(0.3);
      doc.font(FONT.bold).fontSize(8.5).fillColor('#111827').text('Terms & Conditions:', margin, doc.y);
      doc.font(FONT.regular).fontSize(8).fillColor('#4B5563').text(tc, margin, doc.y, { width: halfW - 20 });
    }
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
  const payMethods = formatPaymentMethods(invoice.accepted_payment_methods);
  if (payMethods) {
    doc.font(FONT.bold).fontSize(9).fillColor('#111827')
      .text('PAYMENT METHODS', margin, bottomY);
    doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
    doc.text(`Accepted: ${payMethods}`, margin, doc.y + 2, { width: halfW - 20 });
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
