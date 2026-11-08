/**
 * PageHeader
 * Unified header component for dashboard, inventory, billing, customers, and settings pages.
 */
export default function PageHeader({ title, description, actions, className = '', children }) {
  return (
    <header className={`page-header-unified ${className}`} style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          {title && <h1 className="page-title">{title}</h1>}
          {description && <p className="page-sub">{description}</p>}
          {children}
        </div>
        {actions && <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{actions}</div>}
      </div>
    </header>
  );
}
