// Client-side helpers to derive an invoice's effective status.
// An invoice that is issued but past its due date displays as "Overdue".

const START_OF_TODAY = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isOverdue = (invoice) => {
  if (!invoice || invoice.type !== 'invoice' || invoice.status !== 'issued' || !invoice.due_date) {
    return false;
  }
  return new Date(invoice.due_date) < START_OF_TODAY();
};

export const effectiveStatus = (invoice) => (isOverdue(invoice) ? 'overdue' : invoice?.status);

export default effectiveStatus;
