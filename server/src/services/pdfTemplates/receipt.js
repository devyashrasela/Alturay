const { MM, FONT, numberFmt, moneyFmt, formatDate, totalsOf } = require('./helpers');

const SIZES = {
  80: { paper: 80, margin: 4 * MM, body: 8.5, small: 7, title: 12, grand: 11 },
  58: { paper: 58, margin: 3 * MM, body: 7.5, small: 6.5, title: 10.5, grand: 9.5 },
};

const layoutFor = (business) => {
  const s = SIZES[Number(business.receipt_paper_width) === 58 ? 58 : 80];
  const width = s.paper * MM;
  return { ...s, width, inner: width - s.margin * 2 };
};

const pageOptions = (invoice, business, { height }) => {
  const L = layoutFor(business);
  return {
    size: [L.width, height || 800],
    margins: { top: L.margin, bottom: L.margin, left: L.margin, right: L.margin },
    info: { Title: `${invoice.invoice_number} receipt` },
  };
};

const render = (doc, invoice, business) => {
  const L = layoutFor(business);
  const x = L.margin;
  const w = L.inner;
  const cur = business.currency || 'INR';
  const n = (v) => numberFmt(v, cur);

  const text = (str, { size = L.body, bold = false, align = 'left' } = {}) => {
    doc.font(bold ? FONT.bold : FONT.regular).fontSize(size).fillColor('#000000').text(String(str), x, doc.y, { width: w, align });
  };

  const rule = (solid = false) => {
    doc.y += 3;
    const y = doc.y;
    doc.save().lineWidth(0.6).strokeColor('#000000');
    if (!solid) doc.dash(2, { space: 2 });
    doc.moveTo(x, y).lineTo(x + w, y).stroke().restore();
    doc.y = y + 5;
  };

  const row = (left, right, { size = L.body, bold = false, split = 0.6 } = {}) => {
    const y = doc.y;
    const lw = w * split;
    doc.font(bold ? FONT.bold : FONT.regular).fontSize(size).fillColor('#000000');
    doc.text(String(left), x, y, { width: lw });
    const afterLeft = doc.y;
    doc.text(String(right), x + lw, y, { width: w - lw, align: 'right' });
    doc.y = Math.max(afterLeft, doc.y);
  };

  // Header
  text(business.name, { size: L.title, bold: true, align: 'center' });
  if (business.address) text(business.address, { size: L.small, align: 'center' });
  if (business.phone) text(`Ph: ${business.phone}`, { size: L.small, align: 'center' });
  if (business.tax_id) text(`GSTIN: ${business.tax_id}`, { size: L.small, align: 'center' });
  rule();
  text(invoice.type === 'bill' ? 'CASH BILL' : 'INVOICE', { bold: true, align: 'center' });
  rule();

  // Meta
  row('Bill No', invoice.invoice_number, { size: L.small });
  row('Date', formatDate(invoice.issue_date), { size: L.small });
  row('Customer', invoice.customer_name || 'Walk-in Customer', { size: L.small, split: 0.35 });
  if (invoice.customer_phone) row('Phone', invoice.customer_phone, { size: L.small });
  rule();
  row('Item', 'Amount', { size: L.small, bold: true });
  rule();

  // Lines
  let qtyTotal = 0;
  const items = invoice.items || [];
  for (const it of items) {
    qtyTotal += Number(it.quantity) || 0;
    const gross = Number(it.unit_price) * Number(it.quantity);
    const disc = Number(it.item_discount_amount || 0) + (gross * Number(it.item_discount_percent || 0)) / 100;
    text(it.item_name);
    row(`${n(it.unit_price)} x ${it.quantity}`, n(it.line_total), { size: L.small });
    if (disc > 0) row('  Discount', `-${n(disc)}`, { size: L.small });
    doc.y += 3;
  }

  // Totals
  const t = totalsOf(invoice);
  rule();
  row(`Items: ${items.length}`, `Qty: ${qtyTotal}`, { size: L.small, split: 0.5 });
  row('Sub total', n(t.preTax));
  if (t.tax > 0) row('Tax', n(t.tax));
  if (t.discount > 0) row('Discount', `-${n(t.discount)}`);
  rule(true);
  row('TOTAL', moneyFmt(t.total, cur), { size: L.grand, bold: true, split: 0.4 });
  rule(true);

  if (invoice.status === 'paid') {
    doc.y += 2;
    text('*** PAID ***', { bold: true, align: 'center' });
  }
  if (invoice.notes) {
    doc.y += 2;
    text(invoice.notes, { size: L.small, align: 'center' });
  }
  doc.y += 6;
  text('Thank you! Visit again.', { align: 'center' });
  text('Powered by Alturay', { size: L.small, align: 'center' });
};

module.exports = { id: 'receipt', kind: 'thermal', pageOptions, render };
