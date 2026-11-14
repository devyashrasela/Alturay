import Icon from '../Icon/Icon';

export function DataTableRowActions({ children, className = '' }) {
  return <div className={`act ${className}`.trim()}>{children}</div>;
}

export function DataTableActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  size = 14,
  className = '',
  disabled = false,
}) {
  const isDanger = variant === 'danger';
  return (
    <button
      type="button"
      className={`act-btn ${isDanger ? 'del' : ''} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
