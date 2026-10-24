export default function StatCard({ label, value, icon, iconVariant = 'orange', sub, trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${iconVariant}`}>
        {icon}
      </div>
      <div className="stat-card__info">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value ?? '—'}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
        {trend && (
          <div
            className={`stat-card__trend ${trend.direction === 'down' ? 'stat-card__trend--down' : 'stat-card__trend--up'}`}
          >
            {trend.icon}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
