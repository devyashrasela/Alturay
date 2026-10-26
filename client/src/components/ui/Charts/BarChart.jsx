import { formatCompactCurrency } from '../../../utils/formatCurrency';

// Lightweight, dependency-free bar chart (bars + light grid).
// data: [{ key, label, value }]
export default function BarChart({ data = [], currency = 'INR', height = 210 }) {
  const max = Math.max(...data.map((d) => d.value));
  const summary = data.map((d) => `${d.label}: ${formatCompactCurrency(d.value, currency)}`).join(', ');

  if (!data.length || max <= 0) {
    return (
      <div className="bar-chart" style={{ '--chart-h': `${height}px` }}>
        <div className="bar-chart__empty">
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <span>No revenue in this period yet</span>
        </div>
        <div className="bar-chart__labels">
          {data.map((d, i) => <span key={d.key ?? i}>{d.label}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bar-chart"
      style={{ '--chart-h': `${height}px` }}
      role="img"
      aria-label={`Revenue by month. ${summary}`}
    >
      <div className="bar-chart__plot">
        {data.map((d, i) => {
          const pct = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0);
          return (
            <div
              className="bar-chart__col"
              key={d.key ?? i}
              title={`${d.label}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(d.value)}`}
            >
              <span className="bar-chart__value" style={{ bottom: `calc(${pct}% + 8px)`, opacity: d.value > 0 ? 1 : 0 }}>
                {formatCompactCurrency(d.value, currency)}
              </span>
              <div
                className={`bar-chart__bar ${d.value > 0 ? '' : 'bar-chart__bar--zero'}`}
                style={{ height: `${d.value > 0 ? pct : 4}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="bar-chart__labels">
        {data.map((d, i) => <span key={d.key ?? i}>{d.label}</span>)}
      </div>
    </div>
  );
}
