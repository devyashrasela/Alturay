import {
  Calendar,
  ChevronDown,
  ArrowLeft,
  CalendarRange,
  Check,
} from 'lucide-react';
import Icon from '../../../components/ui/Icon/Icon';
import { formatCurrency } from '../../../utils/formatCurrency';
import './DashboardHeader.css';

export default function DashboardHeader({
  greeting,
  firstName,
  isStaff,
  dateRangeLabel,
  monthMenuOpen,
  setMonthMenuOpen,
  menuView,
  setMenuView,
  monthMenuRef,
  series = [],
  isCustomActive,
  activeMonthKey,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  todayISOStr,
  handleSelectMonth,
  handleQuickPreset,
  handleThisYearPreset,
  handleApplyCustomRange,
  onAddCustomer,
  onCreateInvoice,
  onNavigateInvoices,
  currency,
}) {
  return (
    <div className="dash-head">
      <div>
        <h1 className="page-title">
          {greeting}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="page-sub">
          {isStaff
            ? 'Overview of your personal billing activity and drafts.'
            : 'Here’s what’s happening across your business.'}
        </p>
      </div>

      <div className="dash-tools">
        {isStaff ? (
          <>
            <button
              type="button"
              className="dash-btn"
              onClick={onAddCustomer}
            >
              <Icon name="userp" size={15} />
              <span>Add Customer</span>
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={onCreateInvoice}
            >
              <Icon name="plus" size={15} />
              <span>Create Invoice</span>
            </button>
            <button
              type="button"
              className="dash-btn"
              onClick={onNavigateInvoices}
              title="View all invoices"
            >
              <Icon name="funnel" size={15} />
              <span>Invoices</span>
            </button>
          </>
        ) : (
          <>
            <div style={{ position: 'relative' }} ref={monthMenuRef}>
              <button
                type="button"
                className="dash-btn"
                onClick={() => {
                  setMonthMenuOpen((prev) => !prev);
                  setMenuView('months');
                }}
                aria-expanded={monthMenuOpen}
                aria-haspopup="true"
              >
                <Calendar size={15} style={{ color: 'var(--icon)' }} />
                <span>{dateRangeLabel}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: monthMenuOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.18s ease',
                    color: 'var(--icon)',
                  }}
                />
              </button>
              {monthMenuOpen && (
                <div
                  className="pop dash-month-pop"
                  style={{
                    minWidth: menuView === 'custom' ? 280 : 250,
                  }}
                >
                  {menuView === 'months' ? (
                    <>
                      <div className="pop__label">Select Month</div>
                      <div className="dash-month-list">
                        {series.map((m) => {
                          const isSelected = !isCustomActive && (activeMonthKey || series.at(-1)?.month) === m.month;
                          return (
                            <button
                              key={m.month}
                              type="button"
                              className={`pop__item dash-month-item ${isSelected ? 'dash-month-item--selected' : ''}`}
                              onClick={() => handleSelectMonth(m.month)}
                            >
                              <span className="dash-month-item__left">
                                <span className="dash-month-item__check">
                                  {isSelected && <Check size={13} />}
                                </span>
                                <span>{m.label} {m.month.split('-')[0]}</span>
                              </span>
                              {m.revenue > 0 && (
                                <span className="dash-month-item__rev">
                                  {formatCurrency(m.revenue, currency)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pop__sep" />

                      <button
                        type="button"
                        className={`pop__item dash-month-item ${isCustomActive ? 'dash-month-item--selected' : ''}`}
                        onClick={() => setMenuView('custom')}
                      >
                        <span className="dash-month-item__left">
                          <span className="dash-month-item__check">
                            <CalendarRange size={14} className="dash-month-item__icon" />
                          </span>
                          <span>Custom range...</span>
                        </span>
                        {isCustomActive && (
                          <span className="dash-month-item__badge">
                            Active
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="dash-custom-box">
                      <div className="dash-custom-head">
                        <button
                          type="button"
                          className="dash-back-btn"
                          onClick={() => setMenuView('months')}
                        >
                          <ArrowLeft size={13} />
                          <span>Back</span>
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                          Custom Date Range
                        </span>
                        <div style={{ width: 36 }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              marginBottom: 4,
                            }}
                          >
                            From Date
                          </label>
                          <input
                            type="date"
                            className="dash-custom-date"
                            value={customStart}
                            max={customEnd || todayISOStr}
                            onChange={(e) => setCustomStart(e.target.value)}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              marginBottom: 4,
                            }}
                          >
                            To Date
                          </label>
                          <input
                            type="date"
                            className="dash-custom-date"
                            value={customEnd}
                            min={customStart}
                            max={todayISOStr}
                            onChange={(e) => setCustomEnd(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0 14px' }}>
                        <button type="button" className="dash-range-preset" onClick={() => handleQuickPreset(7)}>
                          Last 7 days
                        </button>
                        <button type="button" className="dash-range-preset" onClick={() => handleQuickPreset(30)}>
                          Last 30 days
                        </button>
                        <button type="button" className="dash-range-preset" onClick={handleThisYearPreset}>
                          This Year
                        </button>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="dash-btn"
                          style={{ flex: 1, justifyContent: 'center', height: 32, fontSize: 12 }}
                          onClick={() => setMenuView('months')}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="dash-btn dash-btn--primary"
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            height: 32,
                            fontSize: 12,
                          }}
                          disabled={!customStart || !customEnd || customStart > customEnd}
                          onClick={handleApplyCustomRange}
                        >
                          Apply Range
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="dash-btn"
              onClick={onNavigateInvoices}
              title="View all invoices and bills"
            >
              <Icon name="funnel" size={16} />
              <span>Invoices</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
