import { useState, useRef, useId } from 'react';
import Icon from '../../../components/ui/Icon/Icon';
import { formatCurrency } from '../../../utils/formatCurrency';

const RW = 760;
const RH = 190;
const PITCH = 13;
const DR = 6;

function cy(k) {
  return RH - 12 - DR - k * PITCH;
}

function cx(i, total) {
  return ((i + 0.5) * RW) / total;
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

export default function RevenueOverviewChart({
  dailySeries = [],
  monthMeta,
  totalDays,
  currency,
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const svgRef = useRef(null);
  const liveId = useId();

  const maxDayRevenue = Math.max(0, ...dailySeries.map((d) => d.revenue));
  const unit = calculateUnit(maxDayRevenue);
  const effectiveDR = Math.max(1.5, Math.min(6, (RW / totalDays) * 0.42));

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

  const isGuideActive = activeIndex >= 0 && activeIndex < totalDays;
  const activeDay = isGuideActive
    ? dailySeries[activeIndex] || { day: activeIndex + 1, revenue: 0, invoices: 0 }
    : { day: 0, revenue: 0, invoices: 0 };

  let activeDayDateStr = `${monthMeta.shortName} ${activeDay.day}`;
  if (activeDay?.date) {
    const parts = activeDay.date.split('-');
    if (parts.length === 3) {
      const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      activeDayDateStr = `${dObj.toLocaleString('en-US', { month: 'short' })} ${dObj.getDate()}`;
    }
  }

  const activeDots = activeDay.revenue > 0 ? Math.max(1, Math.min(13, Math.round(activeDay.revenue / unit))) : 0;
  const activeX = isGuideActive ? cx(activeIndex, totalDays) : 0;
  const activeY = isGuideActive && activeDots > 0 ? cy(activeDots - 1) : RH - 12;
  const activeYBadgeTop = isGuideActive ? (activeY / RH) * 100 : 0;
  const activeXBadgeLeft = isGuideActive ? (activeX / RW) * 100 : 0;
  const activeAmountStr = isGuideActive ? formatCurrency(activeDay.revenue, currency) : '';

  let xTickIndices = [];
  if (totalDays <= 7) {
    xTickIndices = Array.from({ length: totalDays }, (_, i) => i);
  } else {
    const count = Math.min(7, totalDays);
    const step = (totalDays - 1) / (count - 1);
    const indices = [];
    for (let i = 0; i < count; i += 1) {
      indices.push(Math.round(i * step));
    }
    xTickIndices = [...new Set(indices)];
  }

  return (
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
          Revenue · each dot = {formatCurrency(unit, currency)}
        </span>
      </div>

      <div className="rv-plot">
        {[0, 4, 8, 12].map((n) => {
          const yPct = ((n ? cy(n - 1) : RH - 12) / RH) * 100;
          return (
            <span key={n} className="rv-yl" style={{ top: `${yPct}%` }}>
              {formatAxisVal(n * unit, currency)}
            </span>
          );
        })}

        {xTickIndices.map((idx) => {
          const dayItem = dailySeries[idx];
          if (!dayItem) return null;
          const xPct = (cx(idx, totalDays) / RW) * 100;
          let label = `${monthMeta.shortName} ${idx + 1}`;
          if (dayItem.date) {
            const parts = dayItem.date.split('-');
            if (parts.length === 3) {
              const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
              label = `${dObj.toLocaleString('en-US', { month: 'short' })} ${dObj.getDate()}`;
            }
          }
          return (
            <span key={dayItem.date || idx} className="rv-xl" style={{ left: `${xPct}%` }}>
              {label}
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

          {Array.from({ length: totalDays }).map((_, i) => {
            const dayItem = dailySeries[i] || { revenue: 0 };
            const dotCount = dayItem.revenue > 0 ? Math.max(1, Math.min(13, Math.round(dayItem.revenue / unit))) : 0;
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
                  r={effectiveDR}
                />
              );
            });
          })}
        </svg>

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
          {activeDayDateStr}
        </span>
      </div>

      <div className="sr-only" aria-live="polite" id={liveId}>
        {isGuideActive ? `${activeDayDateStr}: ${activeAmountStr}` : ''}
      </div>
    </section>
  );
}
