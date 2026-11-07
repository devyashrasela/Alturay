import { useState, useRef, useId, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import Icon from '../../components/ui/Icon';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { effectiveStatus } from '../../utils/invoiceStatus';

const RW = 760;
const RH = 300;
const PITCH = 18;
const DR = 8;

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

function getMonthMeta(monthKey) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      shortName: d.toLocaleString('en-US', { month: 'short' }),
      fullName: d.toLocaleString('en-US', { month: 'long' }),
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    };
  }
  const [yStr, mStr] = monthKey.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const d = new Date(year, month - 1, 1);
  return {
    year,
    month,
    shortName: d.toLocaleString('en-US', { month: 'short' }),
    fullName: d.toLocaleString('en-US', { month: 'long' }),
    daysInMonth: new Date(year, month, 0).getDate(),
  };
}

function calculateUnit(maxVal) {
  if (!maxVal || maxVal <= 0) return 1000;
  const targetDots = 10;
  const raw = maxVal / targetDots;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  let factor = 1;
  if (normalized > 5) factor = 10;
  else if (normalized > 2) factor = 5;
  else if (normalized > 1) factor = 2;
  return factor * magnitude;
}

function formatAxisVal(val, currency) {
  if (val === 0) return formatCurrency(0, currency);
  if (val >= 1000000) {
    const m = (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1);
    return `${currency === 'INR' ? '₹' : ''}${m}M`;
  }
  if (val >= 1000) {
    const k = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1);
    return `${currency === 'INR' ? '₹' : ''}${k}K`;
  }
  return formatCurrency(val, currency);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { user } = useSelector((s) => s.auth);

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef(null);

  const queryArg = selectedMonth
    ? { businessId: activeBusinessId, month: selectedMonth }
    : activeBusinessId;

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(queryArg, {
    skip: !activeBusinessId,
  });
  const { data: recentData } = useGetRecentInvoicesQuery(activeBusinessId, {
    skip: !activeBusinessId,
  });

  const stats = statsData?.data?.stats || {};
  const recent = recentData?.data?.invoices || [];
  const statusCounts = stats.status_counts || {};
  const series = stats.monthly_series || [];
  const dailySeries = stats.daily_series || [];

  // Close month menu when clicking outside
  useEffect(() => {
    if (!monthMenuOpen) return undefined;
    const handleClickOutside = (e) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target)) {
        setMonthMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [monthMenuOpen]);

  // Dot-Matrix Revenue Chart state
  const [activeIndex, setActiveIndex] = useState(-1);
  const svgRef = useRef(null);
  const liveId = useId();

  if (statsLoading && !statsData) return <PageLoader />;

  // Greeting
  const greeting = getGreeting();
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  // Month metadata
  const activeMonthKey = stats.selected_month || selectedMonth;
  const monthMeta = getMonthMeta(activeMonthKey);
  const totalDays = dailySeries.length > 0 ? dailySeries.length : monthMeta.daysInMonth;
  const dateRangeLabel = `${monthMeta.shortName} 1 – ${monthMeta.shortName} ${monthMeta.daysInMonth}, ${monthMeta.year}`;

  // KPI figures
  const totalRev = formatCurrency(stats.total_revenue ?? 0, activeBusiness?.currency);
  const outstanding = formatCurrency(stats.outstanding_receivable ?? 0, activeBusiness?.currency);
  const totalInv = String(stats.total_invoices ?? 0);
  const totalProd = String(stats.total_products ?? 0);

  // Revenue comparison between current month and previous month in 6-month series
  const currentMonthRevenue = series.at(-1)?.revenue ?? 0;
  const previousMonthRevenue = series.at(-2)?.revenue ?? 0;
  let revDelta = '0%';
  let revSub = 'No revenue recorded yet';
  let revNeg = false;
  if (previousMonthRevenue > 0) {
    const pct = Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100);
    revDelta = `${pct >= 0 ? '+' : ''}${pct}%`;
    revSub = `vs ${formatCurrency(previousMonthRevenue, activeBusiness?.currency)} last month`;
    revNeg = pct < 0;
  } else if (currentMonthRevenue > 0) {
    revDelta = '+100%';
    revSub = `This month: ${formatCurrency(currentMonthRevenue, activeBusiness?.currency)}`;
  } else if (series.some((s) => s.revenue > 0)) {
    revSub = `This month: ${formatCurrency(0, activeBusiness?.currency)}`;
  }

  // Outstanding delta / sub
  const recCount = stats.receivable_count ?? 0;
  const overdueCount = stats.overdue_invoices ?? 0;
  const outDelta = overdueCount > 0 ? `${overdueCount} overdue` : (recCount > 0 ? `${recCount} pending` : 'All settled');
  const outSub = recCount > 0
    ? `${recCount} invoice${recCount > 1 ? 's' : ''} awaiting payment`
    : 'No unpaid receivables';
  const outNeg = overdueCount > 0;

  // Invoice count delta / sub
  const currentMonthInvoices = series.at(-1)?.invoices ?? 0;
  const paidCount = statusCounts.paid ?? 0;
  const draftCount = statusCounts.draft ?? 0;
  const issuedCount = statusCounts.issued ?? 0;
  const invDelta = currentMonthInvoices > 0 ? `+${currentMonthInvoices}` : `${paidCount} paid`;
  const invSub = currentMonthInvoices > 0
    ? `issued this month (${paidCount} paid)`
    : `${draftCount} draft${draftCount !== 1 ? 's' : ''} · ${issuedCount} issued`;

  // Product delta / sub
  const topProductsCount = stats.top_products?.length ?? 0;
  const prodDelta = `${stats.total_products ?? 0} active`;
  const prodSub = topProductsCount > 0
    ? `top sellers: ${stats.top_products.map((p) => p.item_name).slice(0, 2).join(', ')}`
    : 'In catalog';

  const KPI_DATA = [
    { label: 'Total revenue', val: totalRev, delta: revDelta, sub: revSub, neg: revNeg },
    { label: 'Outstanding', val: outstanding, delta: outDelta, sub: outSub, neg: outNeg },
    { label: 'Total invoices', val: totalInv, delta: invDelta, sub: invSub, neg: false },
    { label: 'Total products', val: totalProd, delta: prodDelta, sub: prodSub, neg: false },
  ];

  // Invoice Donut Chart segments
  const cancelledCount = statusCounts.cancelled ?? 0;
  const invTotal = draftCount + issuedCount + paidCount + cancelledCount;

  const INV_SEGMENTS = [
    { label: 'Draft', count: draftCount, color: 'var(--muted)' },
    { label: 'Issued', count: issuedCount, color: 'color-mix(in srgb, var(--accent) 50%, transparent)' },
    { label: 'Paid', count: paidCount, color: 'var(--accent)' },
    { label: 'Cancelled', count: cancelledCount, color: 'var(--danger)' },
  ];

  const CIRCUMFERENCE = 2 * Math.PI * 76;
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
    INV_SEGMENTS.map((seg) => {
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

  // Revenue overview dot matrix calculation
  const maxDayRevenue = Math.max(0, ...dailySeries.map((d) => d.revenue));
  const UNIT = calculateUnit(maxDayRevenue);

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
  const activeDay = isGuideActive
    ? dailySeries[activeIndex] || { day: activeIndex + 1, revenue: 0, invoices: 0 }
    : { day: 0, revenue: 0, invoices: 0 };

  const activeDots = activeDay.revenue > 0 ? Math.max(1, Math.min(13, Math.round(activeDay.revenue / UNIT))) : 0;
  const activeX = isGuideActive ? cx(activeIndex, totalDays) : 0;
  const activeY = isGuideActive && activeDots > 0 ? cy(activeDots - 1) : RH - 12;
  const activeYBadgeTop = isGuideActive ? (activeY / RH) * 100 : 0;
  const activeXBadgeLeft = isGuideActive ? (activeX / RW) * 100 : 0;
  const activeAmountStr = isGuideActive ? formatCurrency(activeDay.revenue, activeBusiness?.currency) : '';

  // Recent invoices table data
  const recentDocs = recent.slice(0, 6).map((inv) => ({
    id: inv.id,
    num: inv.invoice_number,
    name: inv.customer_name || '—',
    status: effectiveStatus(inv).charAt(0).toUpperCase() + effectiveStatus(inv).slice(1),
    date: inv.due_date ? formatDate(inv.due_date) : (inv.issue_date ? formatDate(inv.issue_date) : '—'),
    amount: formatCurrency(inv.total_amount, activeBusiness?.currency),
  }));

  // X-axis ticks
  const xTicks = [1, 5, 10, 15, 20, 25, totalDays].filter(
    (d, idx, arr) => d <= totalDays && arr.indexOf(d) === idx
  );

  return (
    <>
      {/* ── Dashboard Header ────────────────────────────────────── */}
      <div className="dash-head">
        <div>
          <h1 className="page-title">
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="page-sub">Here’s what’s happening across your business.</p>
        </div>
        <div className="dash-tools">
          <div style={{ position: 'relative' }} ref={monthMenuRef}>
            <button
              type="button"
              className="dash-btn"
              onClick={() => setMonthMenuOpen((prev) => !prev)}
              aria-expanded={monthMenuOpen}
              aria-haspopup="true"
            >
              <Icon name="calendar" size={16} />
              <span>{dateRangeLabel}</span>
              <Icon name="dchev" size={14} />
            </button>
            {monthMenuOpen && (
              <div
                className="pop"
                style={{
                  position: 'absolute',
                  top: 38,
                  right: 0,
                  minWidth: 220,
                  zIndex: 70,
                }}
              >
                <div className="pop__label">Select Month</div>
                {series.map((m) => {
                  const isSelected = (activeMonthKey || series.at(-1)?.month) === m.month;
                  return (
                    <button
                      key={m.month}
                      type="button"
                      className="pop__item"
                      style={{
                        justifyContent: 'space-between',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--text)' : 'var(--text-2)',
                        background: isSelected ? 'var(--hover)' : 'transparent',
                      }}
                      onClick={() => {
                        setSelectedMonth(m.month);
                        setMonthMenuOpen(false);
                      }}
                    >
                      <span>{m.label} {m.month.split('-')[0]}</span>
                      {m.revenue > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                          {formatCurrency(m.revenue, activeBusiness?.currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            className="dash-btn"
            onClick={() => navigate('/invoices')}
            title="View all invoices and bills"
          >
            <Icon name="funnel" size={16} />
            <span>Invoices</span>
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
            <button
              type="button"
              className="dmore"
              aria-label="Revenue overview options"
            >
              <Icon name="ellipsis" size={18} />
            </button>
          </div>
          <div className="legend">
            <span className="lg" style={{ display: 'flex', alignItems: 'center' }}>
              <i />
              Revenue · each dot = {formatCurrency(UNIT, activeBusiness?.currency)}
            </span>
          </div>

          <div className="rv-plot">
            {/* Y axis labels */}
            {[0, 4, 8, 12].map((n) => {
              const yPct = ((n ? cy(n - 1) : RH - 12) / RH) * 100;
              return (
                <span key={n} className="rv-yl" style={{ top: `${yPct}%` }}>
                  {formatAxisVal(n * UNIT, activeBusiness?.currency)}
                </span>
              );
            })}

            {/* X axis labels */}
            {xTicks.map((d) => {
              const xPct = (cx(d - 1, totalDays) / RW) * 100;
              return (
                <span key={d} className="rv-xl" style={{ left: `${xPct}%` }}>
                  {monthMeta.shortName} {d}
                </span>
              );
            })}

            <svg
              ref={svgRef}
              id="rvSvg"
              viewBox={`0 0 ${RW} ${RH}`}
              tabIndex={0}
              role="group"
              aria-label={`Daily revenue for ${monthMeta.fullName}. Use left and right arrow keys to inspect a day.`}
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

              {/* Dots for each day */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dayItem = dailySeries[i] || { revenue: 0 };
                const dotCount = dayItem.revenue > 0 ? Math.max(1, Math.min(13, Math.round(dayItem.revenue / UNIT))) : 0;
                const isCol = isGuideActive && i === activeIndex;

                return Array.from({ length: dotCount }).map((__, k) => {
                  const isTop = isCol && k === dotCount - 1;
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
                });
              })}
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
              {monthMeta.shortName} {activeDay.day}
            </span>
          </div>

          <div className="sr-only" aria-live="polite" id={liveId}>
            {isGuideActive ? `${monthMeta.shortName} ${activeDay.day}: ${activeAmountStr}` : ''}
          </div>
        </section>

        {/* Invoice Status Donut Chart */}
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
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => {
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
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: 'center',
                      padding: '36px 16px',
                      color: 'var(--muted)',
                    }}
                  >
                    No recent invoices or bills
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
