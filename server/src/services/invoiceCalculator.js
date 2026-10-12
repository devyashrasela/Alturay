/**
 * Invoice calculation utility.
 * Applies per-line-item discounts, then tax, then invoice-level discounts.
 */
const calculateInvoiceTotals = (items, invoiceDiscount = {}) => {
  const { discount_amount = 0, discount_percent = 0 } = invoiceDiscount;

  let subtotal = 0;
  let taxTotal = 0;

  const calculatedItems = items.map((item) => {
    const lineSubtotal = parseFloat(item.unit_price) * parseInt(item.quantity);

    // Per-line discount
    const itemDiscAmt = parseFloat(item.item_discount_amount || 0);
    const itemDiscPct = parseFloat(item.item_discount_percent || 0);
    const lineAfterDiscount = lineSubtotal - itemDiscAmt - (lineSubtotal * itemDiscPct / 100);

    // Tax on discounted amount
    const taxRate = parseFloat(item.tax_rate || 0);
    const taxAmount = parseFloat((lineAfterDiscount * taxRate / 100).toFixed(2));
    const lineTotal = parseFloat((lineAfterDiscount + taxAmount).toFixed(2));

    subtotal += lineTotal;
    taxTotal += taxAmount;

    return {
      ...item,
      tax_amount: taxAmount,
      line_total: lineTotal,
    };
  });

  // Invoice-level discount applied to the subtotal (sum of all line totals)
  const invoiceDiscountTotal = parseFloat(discount_amount) +
    (subtotal * parseFloat(discount_percent) / 100);

  const totalAmount = parseFloat((subtotal - invoiceDiscountTotal).toFixed(2));

  return {
    items: calculatedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_total: parseFloat(taxTotal.toFixed(2)),
    discount_amount: parseFloat(parseFloat(discount_amount).toFixed(2)),
    discount_percent: parseFloat(parseFloat(discount_percent).toFixed(2)),
    total_amount: Math.max(0, totalAmount),
  };
};

module.exports = { calculateInvoiceTotals };
