import { useState, useRef, useId } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import Icon from '../../components/ui/Icon';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { effectiveStatus } from '../../utils/invoiceStatus';

const UNIT = 5000;
const RW = 760;
const RH = 300;
const PITCH = 18;
const DR = 8;
const SAMPLE_REV = [3, 5, 4, 6, 2, 4, 3, 5, 7, 9, 6, 5, 8, 11, 12, 7, 4, 5, 6, 9, 6, 5, 7, 4, 3, 8, 10, 6, 5, 4];

function cy(k) {
  return RH - 12 - DR - k * PITCH;
}

function cx(i, total) {
  return ((i + 0.5) * RW) / total;
}

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { user } = useSelector((s) => s.auth);

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(activeBusinessId, {
    skip: !activeBusinessId,
  });
  const { data: recentData } = useGetRecentInvoicesQuery(activeBusinessId, {
    skip: !activeBusinessId,
  });

  const stats = statsData?.data?.stats || {};
  const recent = recentData?.data?.invoices || [];
  const statusCounts = stats.status_counts || {};

  // Interactive Dot-Matrix Revenue Chart state
  const [activeIndex, setActiveIndex] = useState(-1);
  const svgRef = useRef(null);
  const liveId = useId();

  if (statsLoading && !statsData) return <PageLoader />;

  // Greeting
  const greeting = getGreeting();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Devyash';

  // KPI figures: real stats with fallback to sample figures
  const totalRev = stats.total_revenue != null && stats.total_revenue > 0
    ? formatCurrency(stats.total_revenue, activeBusiness?.currency)
    : '₹8,47,500';

  const outstanding = stats.outstanding_receivable != null && stats.outstanding_receivable > 0
    ? formatCurrency(stats.outstanding_receivable, activeBusiness?.currency)
    : '₹1,42,800';

  const outstandingSub = stats.receivable_count != null && stats.receivable_count > 0
    ? `${stats.receivable_count} invoices pending`
    : '6 invoices pending';

  const totalInv = stats.total_invoices != null && stats.total_invoices > 0
    ? String(stats.total_invoices)
    : '342';

  const totalProd = stats.total_products != null && stats.total_products > 0
    ? String(stats.total_products)
    : '58';

  const KPI_DATA = [
    { label: 'Total revenue', val: totalRev, delta: '+12.8%', sub: 'vs ₹7,51,200 last month', neg: false },
    { label: 'Outstanding', val: outstanding, delta: '-3.2%', sub: outstandingSub, neg: true },
    { label: 'Total invoices', val: totalInv, delta: '+8.2%', sub: '28 issued this month', neg: false },
    { label: 'Total products', val: totalProd, delta: '+4', sub: '2 added this month', neg: false },
  ];

  // Invoice Donut Chart segments
  const draftCount = statusCounts.draft ?? 38;
  const issuedCount = statusCounts.issued ?? 96;
  const paidCount = statusCounts.paid ?? 178;
  const cancelledCount = statusCounts.cancelled ?? 30;
  const invTotal = draftCount + issuedCount + paidCount + cancelledCount || 342;

  const INV_SEGMENTS = [
    { label: 'Draft', count: draftCount, color: 'var(--muted)' },
    { label: 'Issued', count: issuedCount, color: 'color-mix(in srgb, var(--accent) 50%, transparent)' },
    { label: 'Paid', count: paidCount, color: 'var(--accent)' },
    { label: 'Cancelled', count: cancelledCount, color: 'var(--danger)' },
  ];

  const CIRCUMFERENCE = 2 * Math.PI * 76;
  let accumulatedOffset = 0;
  const donutSvgSegments = INV_SEGMENTS.map((seg) => {
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
  });

  // Revenue overview dot matrix
  const revData = SAMPLE_REV;
  const totalDays = revData.length;

  const handlePointerMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.max(0, Math.min(totalDays - 1, Math.floor(ratio * totalDays)));
    setActiveIndex(idx);
  };

  const handlePointerLeave = () => {
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setActiveIndex((current) => {
      if (current < 0) return e.key === 'ArrowLeft' ? totalDays - 1 : 0;
      return Math.max(0, Math.min(totalDays - 1, current + (e.key === 'ArrowLeft' ? -1 : 1)));
    });
  };

  // Active hover/guide state calculation
  const isGuideActive = activeIndex >= 0 && activeIndex < totalDays;
  const activeVal = isGuideActive ? revData[activeIndex] : 0;
  const activeX = isGuideActive ? cx(activeIndex, totalDays) : 0;
  const activeY = isGuideActive ? cy(activeVal - 1) : 0;
  const activeYBadgeTop = isGuideActive ? (activeY / RH) * 100 : 0;
  const activeXBadgeLeft = isGuideActive ? (activeX / RW) * 100 : 0;
  const activeAmountStr = isGuideActive ? `₹${(activeVal * UNIT).toLocaleString('en-IN')}` : '';

  // Recent invoices table data
  const sampleDocs = [
    { id: '1', num: 'INV-0128', name: 'Acme Traders', status: 'Paid', date: 'Nov 12, 2026', amount: '₹18,500' },
    { id: '2', num: 'INV-0127', name: 'Nova Labs', status: 'Issued', date: 'Nov 18, 2026', amount: '₹24,000' },
    { id: '3', num: 'BILL-0042', name: 'Vertex Supplies', status: 'Paid', date: 'Nov 10, 2026', amount: '₹12,500' },
    { id: '4', num: 'INV-0126', name: 'Cloudline', status: 'Draft', date: 'Nov 22, 2026', amount: '₹21,800' },
    { id: '5', num: 'BILL-0041', name: 'Bloom Market', status: 'Issued', date: 'Nov 25, 2026', amount: '₹16,200' },
    { id: '6', num: 'INV-0125', name: 'North & Co.', status: 'Cancelled', date: 'Nov 05, 2026', amount: '₹9,800' },
  ];

  const recentDocs = recent && recent.length > 0
    ? recent.slice(0, 6).map((inv) => ({
        id: inv.id,
        num: inv.invoice_number,
        name: inv.customer_name || '—',
        status: effectiveStatus(inv).charAt(0).toUpperCase() + effectiveStatus(inv).slice(1),
        date: formatDate(inv.issue_date),
        amount: formatCurrency(inv.total_amount, activeBusiness?.currency),
      }))
    : sampleDocs;

  return (
    <>
      {/* ── Dashboard Header ────────────────────────────────────── */}
      <div className="dash-head">
        <div>
          <h1 className="page-title">{greeting}, {firstName} 👋</h1>
          <p className="page-sub">Here’s what’s happening across your business.</p>
        </div>
        <div className="dash-tools">
          <button type="button" className="dash-btn">
            <Icon name="calendar" size={16} />
            <span>Nov 1 – Nov 30, 2026</span>
          </button>
          <button type="button" className="dash-btn">
            <Icon name="funnel" size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Cards in One Strip ────────────────────────────── */}
      <section className="dcard kpis" aria-label="Key figures">
        {KPI_DATA.map((c) => (
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

      {/* ── Charts Row (Revenue + Status) ────────────────────────── */}
      <div className="drow">
        {/* Revenue Overview Dot Matrix */}
        <section className="dcard dpad" aria-labelledby="rvT">
          <div className="dh">
            <h2 id="rvT">Revenue overview</h2>
            <button type="button" className="dmore" aria-label="Revenue overview options">
              <Icon name="ellipsis" size={18} />
            </button>
          </div>
          <div className="legend">
            <span className="lg" style={{ display: 'flex', alignItems: 'center' }}>
              <i />
              Revenue · each dot = ₹5,000
            </span>
          </div>

          <div className="rv-plot">
            {/* Y axis labels */}
            {[0, 4, 8, 12].map((n) => {
              const yPct = ((n ? cy(n - 1) : RH - 12) / RH) * 100;
              return (
                <span key={n} className="rv-yl" style={{ top: `${yPct}%` }}>
                  {n ? `₹${(n * UNIT) / 1000}K` : '₹0'}
                </span>
              );
            })}

            {/* X axis labels */}
            {[1, 5, 10, 15, 20, 25, 30].map((d) => {
              const xPct = (cx(d - 1, totalDays) / RW) * 100;
              return (
                <span key={d} className="rv-xl" style={{ left: `${xPct}%` }}>
                  Nov {d}
                </span>
              );
            })}

            <svg
              ref={svgRef}
              id="rvSvg"
              viewBox={`0 0 ${RW} ${RH}`}
              tabIndex={0}
              role="group"
              aria-label="Daily revenue for November. Use left and right arrow keys to inspect a day."
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onBlur={handlePointerLeave}
              onKeyDown={handleKeyDown}
            >
              {/* Grid lines */}
              {[0, 4, 8, 12].map((t) => {
                const y = t ? cy(t - 1) : RH - 12;
                return (
                  <line
                    key={t}
                    className="rv-grid"
                    x1="0"
                    x2={RW}
                    y1={y}
                    y2={y}
                  />
                );
              })}

              {/* Guide lines and highlight points */}
              <g className={`rv-g ${isGuideActive ? 'on' : ''}`}>
                <line
                  className="rv-guide"
                  x1="0"
                  x2={Math.max(0, activeX - 14)}
                  y1={activeY}
                  y2={activeY}
                />
                <line
                  className="rv-guide"
                  x1={activeX}
                  x2={activeX}
                  y1={activeY + 14}
                  y2={RH - 2}
                />
                <circle className="rv-pt" r="3" cx={activeX} cy={activeY} />
                <circle className="rv-pt" r="3" cx={activeX} cy={RH - 2} />
              </g>

              {/* Dots */}
              {revData.map((v, i) =>
                Array.from({ length: v }).map((_, k) => {
                  const isCol = isGuideActive && i === activeIndex;
                  const isTop = isCol && k === v - 1;
                  const dotClass = [
                    'rv-dot',
                    isCol && !isTop && 'on',
                    isTop && 'top',
                  ].filter(Boolean).join(' ');

                  return (
                    <circle
                      key={`${i}-${k}`}
                      className={dotClass}
                      cx={cx(i, totalDays)}
                      cy={cy(k)}
                      r={DR}
                    />
                  );
                })
              )}
            </svg>

            {/* Floating Badges */}
            <span
              className={`rv-b rv-yb ${isGuideActive ? 'on' : ''}`}
              style={{ top: `${activeYBadgeTop}%` }}
            >
              {activeAmountStr}
            </span>
            <span
              className={`rv-b rv-xb ${isGuideActive ? 'on' : ''}`}
              style={{ left: `${activeXBadgeLeft}%` }}
            >
              Nov {activeIndex + 1}
            </span>
          </div>

          <div className="sr-only" aria-live="polite" id={liveId}>
            {isGuideActive ? `Nov ${activeIndex + 1}: ${activeAmountStr}` : ''}
          </div>
        </section>

        {/* Invoice Status Donut Chart */}
        <section className="dcard dpad" aria-labelledby="stT">
          <div className="dh">
            <h2 id="stT">Invoice status</h2>
            <button type="button" className="dmore" aria-label="Invoice status options">
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
            {INV_SEGMENTS.map((d) => (
              <div key={d.label}>
                <i style={{ background: d.color }} />
                <span>{d.label}</span>
                <em>{d.count}</em>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Recent Invoices / Bills Table ────────────────────────── */}
      <section className="dcard dpad dtbl" aria-labelledby="rtT">
        <div className="dh">
          <h2 id="rtT">Recent invoices / bills</h2>
          <button
            type="button"
            className="dmore"
            aria-label="Recent invoices options"
            onClick={() => navigate('/invoices')}
          >
            <Icon name="ellipsis" size={18} />
          </button>
        </div>

        <div className="db-wrap">
          <table className="db">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Customer / vendor</th>
                <th scope="col">Status</th>
                <th scope="col">Due date</th>
                <th scope="col" className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc) => {
                const scClass = `sc sc-${doc.status.toLowerCase()}`;
                return (
                  <tr
                    key={doc.id || doc.num}
                    style={{ cursor: 'pointer' }}
                    onClick={() => doc.id && navigate(`/invoices/${doc.id}`)}
                  >
                    <td>{doc.num}</td>
                    <td>{doc.name}</td>
                    <td>
                      <span className={scClass}>{doc.status}</span>
                    </td>
                    <td>{doc.date}</td>
                    <td className="num price">{doc.amount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
