const STATUS_MAP = {
  paid:      { variant: 'success', label: 'Paid' },
  issued:    { variant: 'info',    label: 'Issued' },
  draft:     { variant: 'default', label: 'Draft' },
  cancelled: { variant: 'danger',  label: 'Cancelled' },
  pending:   { variant: 'warning', label: 'Pending' },
  overdue:   { variant: 'danger',  label: 'Overdue' },
  active:    { variant: 'success', label: 'Active' },
  inactive:  { variant: 'default', label: 'Inactive' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status?.toLowerCase()] || { variant: 'default', label: status };
  return (
    <span className={`badge badge--${config.variant}`}>
      <span className="badge__dot" />
      {config.label}
    </span>
  );
}
