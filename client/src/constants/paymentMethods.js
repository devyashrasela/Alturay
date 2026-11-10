export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'check', label: 'Check / Cheque' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'net_banking', label: 'Net Banking' },
  { id: 'other', label: 'Other' },
];

export const PAYMENT_METHOD_LABELS = PAYMENT_METHODS.reduce((acc, m) => {
  acc[m.id] = m.label;
  return acc;
}, {});

export default PAYMENT_METHODS;
