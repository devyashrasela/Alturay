const item = (id, name, price, qty, rate) => {
  const base = price * qty;
  const tax = +(base * rate / 100).toFixed(2);
  return {
    id,
    item_name: name,
    unit_price: price,
    quantity: qty,
    tax_rate: rate,
    tax_amount: tax,
    item_discount_amount: 0,
    item_discount_percent: 0,
    line_total: +(base + tax).toFixed(2),
  };
};

module.exports = (type) => {
  const items = [
    item('1', 'Notebook A5', 120, 2, 18),
    item('2', 'Gel pen', 15, 4, 5),
    item('3', 'Tote bag', 349, 1, 12),
  ];
  const subtotal = +items.reduce((s, i) => s + i.line_total, 0).toFixed(2);
  const tax_total = +items.reduce((s, i) => s + i.tax_amount, 0).toFixed(2);

  return {
    id: 'sample',
    type,
    status: 'issued',
    invoice_number: type === 'bill' ? 'BILL-001' : 'INV-001',
    customer_name: 'Sample Customer',
    customer_phone: '+91 98765 43210',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    notes: 'Thank you for your business. Payment is due within 15 days.',
    subtotal,
    tax_total,
    discount_amount: 0,
    discount_percent: 0,
    total_amount: subtotal,
    items,
  };
};
