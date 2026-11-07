const { FONT, numberFmt, moneyFmt, formatDate, totalsOf } = require('./helpers');

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

  // Logo / Business mark on right
  const logoBoxSize = 56;
  const logoX = margin + pageWidth - logoBoxSize;

  if (ctx.logo) {
    try {
      doc.image(ctx.logo, logoX, headerY, { fit: [logoBoxSize, logoBoxSize], align: 'right' });
    } catch {
      // fallback to stylized tile
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

  // Right: Bill To
  const rightX = margin + halfW;
  doc.font(FONT.bold).fontSize(10).fillColor('#111827')
    .text(`BILL TO`, rightX, partyY);
  doc.font(FONT.bold).fontSize(11).fillColor('#111827')
    .text(invoice.customer_name || 'Customer', rightX, doc.y + 2);
  doc.font(FONT.regular).fontSize(9).fillColor('#4B5563');
  if (invoice.customer_phone) doc.text(invoice.customer_phone, rightX, doc.y);

  const partiesBottom = Math.max(doc.y, partyY + 65);
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
    // Row border
    doc.save().lineWidth(0.6).strokeColor('#D1D5DB')
      .rect(margin, rY, pageWidth, 22).stroke().restore();

    doc.font(FONT.regular).fontSize(9).fillColor('#1F2937');
    x = margin + 8;
    doc.text(item.item_name, x, rY + 6, { width: colW.desc - 8 }); x += colW.desc;
    doc.text(moneyFmt(item.unit_price, cur), x, rY + 6, { width: colW.price, align: 'right' }); x += colW.price;
    doc.text(String(item.quantity), x, rY + 6, { width: colW.qty, align: 'center' }); x += colW.qty;
    doc.font(FONT.bold).text(moneyFmt(item.line_total, cur), x, rY + 6, { width: colW.amount - 8, align: 'right' });

    doc.y = rY + 22;
  });

  doc.moveDown(1);

  // ── Notes (Left) & Totals (Right) ──
  const postTableY = doc.y;
  const t = totalsOf(invoice);

  // Left: Notes / Terms
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text('NOTES / TERMS:', margin, postTableY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
  const notesText = invoice.notes || 'Payment is due within 15 days of receiving this invoice.';
  doc.text(notesText, margin, doc.y + 4, { width: halfW - 20 });

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
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text('PAYMENT METHOD', margin, bottomY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
  doc.text(`Bank: Business Account`, margin, doc.y + 2);
  doc.text(`Account Name: ${business.name}`, margin, doc.y);

  // Right: Prepared By
  doc.font(FONT.bold).fontSize(9).fillColor('#111827')
    .text('PREPARED BY', rightX, bottomY);
  doc.font(FONT.regular).fontSize(8.5).fillColor('#4B5563');
  doc.text(business.name, rightX, doc.y + 2);
  doc.text('Authorized Representative', rightX, doc.y);

  // ── Decorative Bottom Bars ──
  doc.save();
  // Bottom purple bar
  doc.rect(0, doc.page.height - 12, doc.page.width, 12).fill(PURPLE);
  // Thin accent line above it
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
