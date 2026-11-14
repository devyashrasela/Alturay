import '../Badge/Badge.css';

const PILL_MAP = {
  paid:      { cls: 'ok',   label: 'Paid' },
  issued:    { cls: 'info', label: 'Issued' },
  pending:   { cls: 'warn', label: 'Pending' },
  overdue:   { cls: 'bad',  label: 'Overdue' },
  cancelled: { cls: 'bad',  label: 'Cancelled' },
  draft:     { cls: '',     label: 'Draft' },
  active:    { cls: 'ok',   label: 'Active' },
  inactive:  { cls: '',     label: 'Inactive' },
};

export default function StatusBadge({ status, className = '' }) {
  const normalized = status?.toLowerCase() || '';
  const item = PILL_MAP[normalized] || {
    cls: '',
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : '',
  };

  return (
    <span className={`pill ${item.cls} ${className}`.trim()}>
      {item.label}
    </span>
  );
}
