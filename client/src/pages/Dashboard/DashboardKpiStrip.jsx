import Icon from '../../components/ui/Icon';

export default function DashboardKpiStrip({ items = [] }) {
  return (
    <section className="dcard kpis" aria-label="Key figures">
      {items.map((c) => (
        <div className="kpi" key={c.label}>
          <div className="kpi__top">
            <span className="kpi__label">{c.label}</span>
            <button
              type="button"
              className="dmore"
              aria-label={`${c.label} options`}
            >
              <Icon name="ellipsis" size={18} />
            </button>
          </div>
          <div className="kpi__val">{c.val}</div>
          <div className="kpi__delta">
            <b className={c.neg ? 'neg' : ''}>{c.delta}</b>
            {c.sub}
          </div>
        </div>
      ))}
    </section>
  );
}
