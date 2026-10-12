export default function StatCard({ label, value, icon, iconVariant = 'orange' }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${iconVariant}`}>
        {icon}
      </div>
      <div className="stat-card__info">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value ?? '—'}</div>
      </div>
    </div>
  );
}
