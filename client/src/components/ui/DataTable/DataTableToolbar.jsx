import Icon from '../Icon/Icon';

export function DataTableToolbar({ children, className = '' }) {
  return (
    <div className={`toolbar ${className}`.trim()}>
      <div className="tb">{children}</div>
    </div>
  );
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search…',
  ariaLabel = 'Search',
  className = '',
}) {
  return (
    <div className={`s ${className}`.trim()}>
      <Icon name="search" size={15} />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function DataTableSegment({
  label,
  icon = 'updown',
  onClick,
  active = false,
  className = '',
  title,
}) {
  return (
    <button
      type="button"
      className={`seg ${active ? 'active' : ''} ${className}`.trim()}
      onClick={onClick}
      title={title}
    >
      {label && <span>{label}</span>}
      {icon && <Icon name={icon} size={14} />}
    </button>
  );
}

export function DataTableTabs({
  tabs = [],
  activeTab = '',
  onTabChange,
  ariaLabel = 'Filter documents',
}) {
  return (
    <>
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            className={`seg ${isSelected ? 'active' : ''}`}
            aria-selected={isSelected}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </>
  );
}

export function DataTableRefreshButton({ onClick, ariaLabel = 'Refresh list' }) {
  return (
    <button
      type="button"
      className="seg"
      aria-label={ariaLabel}
      onClick={onClick}
      title="Refresh"
    >
      <Icon name="refresh" size={14} />
    </button>
  );
}

export function DataTableActions({ children }) {
  return <>{children}</>;
}

export function DataTableFilterButton({ onClick, ariaLabel = 'Filter' }) {
  return (
    <button
      type="button"
      className="seg"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Icon name="funnel" size={14} />
    </button>
  );
}

export function DataTableNewButton({ onClick, children, className = '' }) {
  return (
    <button type="button" className={`btn primary sm ${className}`.trim()} onClick={onClick}>
      {children}
    </button>
  );
}
