const item = (id, name, description, price, qty, rate) => {
  const base = price * qty;
  const tax = +(base * rate / 100).toFixed(2);
  return {
    id,
    item_name: name,
    description,
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
    item('1', 'Notebook A5', '160 pages, hardcover ruled', 120, 2, 18),
    item('2', 'Gel pen', '0.5mm quick-dry black ink', 15, 4, 5),
    item('3', 'Tote bag', 'Organic cotton canvas eco-bag', 349, 1, 12),
  ];
  const subtotal = +items.reduce((s, i) => s + i.line_total, 0).toFixed(2);
  const tax_total = +items.reduce((s, i) => s + i.tax_amount, 0).toFixed(2);

  return {
    id: 'sample',
    type,
    status: 'issued',
    invoice_number: type === 'bill' ? 'BILL-001' : 'INV-001',
    description: 'Stationery and supplies for design studio',
    po_number: 'PO-2026-089',
    customer_name: 'Sample Customer',
    customer_phone: '+91 98765 43210',
    customer_email: 'billing@samplecustomer.in',
    shipping_address: {
      line1: 'Building 4B, Sector 62',
      line2: 'Industrial Area',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201309',
    },
    payment_terms: 'Net 15 days',
    accepted_payment_methods: ['cash', 'upi', 'bank_transfer', 'credit_card'],
    terms_and_conditions: '1. Goods once sold are not returnable without original invoice.\n2. In case of any payment delay, interest at 1.5% per month will apply.',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    notes: 'Thank you for your business. Please quote invoice number when transferring via UPI or NEFT.',
    subtotal,
    tax_total,
    discount_amount: 0,
    discount_percent: 0,
    total_amount: subtotal,
    items,
  };
};
