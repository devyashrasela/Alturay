import Icon from '../Icon';

export function DataTableToolbar({ children, className = '' }) {
  return <div className={`db-bar ${className}`}>{children}</div>;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search…',
  ariaLabel = 'Search',
  className = '',
}) {
  return (
    <label className={`db-search ${className}`}>
      <Icon name="search" size={16} />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function DataTableTabs({
  tabs = [],
  activeTab = '',
  onTabChange,
  ariaLabel = 'Filter documents',
}) {
  return (
    <div className="db-pills" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            className="db-pill"
            aria-selected={isSelected}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function DataTableActions({ children, className = '' }) {
  return <div className={`db-end ${className}`}>{children}</div>;
}

export function DataTableFilterButton({ onClick, ariaLabel = 'Filter and sort', className = '' }) {
  return (
    <button
      type="button"
      className={`db-icon ${className}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Icon name="funnel" size={18} />
    </button>
  );
}

export function DataTableNewButton({ onClick, children, className = '' }) {
  return (
    <button type="button" className={`db-new ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
