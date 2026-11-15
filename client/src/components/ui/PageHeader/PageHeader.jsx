/**
 * PageHeader
 * Unified header component for dashboard, inventory, billing, customers, and settings pages.
 */
export default function PageHeader({ title, description, actions, className = '', children }) {
  return (
    <header
      className={`page-header page-header-unified ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
      }}
    >
      <div>
        {title && <h1 className="page-header__title page-title">{title}</h1>}
        {description && <p className="page-header__sub page-sub">{description}</p>}
        {children}
      </div>
      {actions && (
        <div
          className="page-header__actions page-header-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginLeft: 'auto',
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
