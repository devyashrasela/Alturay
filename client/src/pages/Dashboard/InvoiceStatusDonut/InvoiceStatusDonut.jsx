import Icon from '../../../components/ui/Icon/Icon';

const CIRCUMFERENCE = 2 * Math.PI * 76;

export default function InvoiceStatusDonut({ statusCounts = {} }) {
  const draftCount = statusCounts.draft ?? 0;
  const issuedCount = statusCounts.issued ?? 0;
  const paidCount = statusCounts.paid ?? 0;
  const cancelledCount = statusCounts.cancelled ?? 0;
  const invTotal = draftCount + issuedCount + paidCount + cancelledCount;

  const segments = [
    { label: 'Draft', count: draftCount, color: 'var(--muted)' },
    { label: 'Issued', count: issuedCount, color: 'color-mix(in srgb, var(--accent) 50%, transparent)' },
    { label: 'Paid', count: paidCount, color: 'var(--accent)' },
    { label: 'Cancelled', count: cancelledCount, color: 'var(--danger)' },
  ];

  let accumulatedOffset = 0;
  const donutSvgSegments = invTotal === 0 ? (
    <circle
      className="dn-seg"
      r="76"
      cx="100"
      cy="100"
      stroke="var(--border)"
      strokeDasharray={`${CIRCUMFERENCE} 0`}
      strokeDashoffset="0"
    />
  ) : (
    segments.map((seg) => {
      const len = Math.max((seg.count / invTotal) * CIRCUMFERENCE - 22, 1);
      const strokeDashoffset = -(accumulatedOffset + 11);
      accumulatedOffset += (seg.count / invTotal) * CIRCUMFERENCE;
      return (
        <circle
          key={seg.label}
          className="dn-seg"
          r="76"
          cx="100"
          cy="100"
          stroke={seg.color}
          strokeDasharray={`${len} ${CIRCUMFERENCE - len}`}
          strokeDashoffset={strokeDashoffset}
        >
          <title>{`${seg.label}: ${seg.count}`}</title>
        </circle>
      );
    })
  );

  return (
    <section className="dcard dpad" aria-labelledby="stT">
      <div className="dh">
        <h2 id="stT">Invoice status</h2>
        <button
          type="button"
          className="dmore"
          aria-label="Invoice status options"
        >
          <Icon name="ellipsis" size={18} />
        </button>
      </div>

      <div className="dn">
        <svg viewBox="0 0 200 200" role="img" aria-label="Invoices by status">
          <g transform="rotate(-90 100 100)">{donutSvgSegments}</g>
        </svg>
        <div className="dn-c">
          <b>{invTotal}</b>
          <span>Invoices</span>
        </div>
      </div>

      <div className="lg">
        {segments.map((d) => (
          <div key={d.label}>
            <i style={{ background: d.color }} />
            <span>{d.label}</span>
            <em>{d.count}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
