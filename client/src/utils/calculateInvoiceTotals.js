export const calculateInvoiceTotals = (items = [], invoiceDiscount = {}) => {
  const { discount_amount = 0, discount_percent = 0 } = invoiceDiscount;

  let subtotal = 0;
  let taxTotal = 0;

  const calculatedItems = items.map((item) => {
    const lineSubtotal = parseFloat(item.unit_price || 0) * parseInt(item.quantity || 1);
    const itemDiscAmt = parseFloat(item.item_discount_amount || 0);
    const itemDiscPct = parseFloat(item.item_discount_percent || 0);
    const lineAfterDiscount = lineSubtotal - itemDiscAmt - (lineSubtotal * itemDiscPct / 100);
    const taxRate = parseFloat(item.tax_rate || 0);
    const taxAmount = parseFloat((lineAfterDiscount * taxRate / 100).toFixed(2));
    const lineTotal = parseFloat((lineAfterDiscount + taxAmount).toFixed(2));
    subtotal += lineTotal;
    taxTotal += taxAmount;
    return { ...item, tax_amount: taxAmount, line_total: lineTotal };
  });

  const invoiceDiscountTotal =
    parseFloat(discount_amount) + (subtotal * parseFloat(discount_percent) / 100);
  const totalAmount = Math.max(0, parseFloat((subtotal - invoiceDiscountTotal).toFixed(2)));

  return {
    items: calculatedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_total: parseFloat(taxTotal.toFixed(2)),
    total_amount: totalAmount,
  };
};
