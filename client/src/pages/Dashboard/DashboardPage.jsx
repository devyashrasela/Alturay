import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import { useUpdateInvoiceStatusMutation } from '../../store/api/invoiceApi';
import { usePermissions } from '../../hooks/usePermissions';
import { addToast } from '../../store/slices/uiSlice';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import CustomerModal from '../../components/customer/CustomerModal';
import { openPdf } from '../../utils/openPdf';
import { formatCurrency } from '../../utils/formatCurrency';

import DashboardHeader from './DashboardHeader';
import DashboardKpiStrip from './DashboardKpiStrip';
import DashboardRecentTable from './DashboardRecentTable';
import RevenueOverviewChart from './RevenueOverviewChart';
import InvoiceStatusDonut from './InvoiceStatusDonut';
import './Dashboard.css';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { user } = useSelector((s) => s.auth);
  const { role, isLoading: permissionsLoading } = usePermissions();

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [customRange, setCustomRange] = useState(null);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState('months');

  const todayISOStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [customStart, setCustomStart] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customEnd, setCustomEnd] = useState(todayISOStr);
  const monthMenuRef = useRef(null);

  // Reset selected month & custom range when switching businesses
  useEffect(() => {
    setSelectedMonth(null);
    setCustomRange(null);
    setMenuView('months');
  }, [activeBusinessId]);

  const queryArg = useMemo(() => {
    if (!activeBusinessId) return null;
    if (customRange?.startDate && customRange?.endDate) {
      return {
        businessId: activeBusinessId,
        startDate: customRange.startDate,
        endDate: customRange.endDate,
      };
    }
    if (selectedMonth) {
      return {
        businessId: activeBusinessId,
        month: selectedMonth,
      };
    }
    return activeBusinessId;
  }, [activeBusinessId, selectedMonth, customRange]);

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(queryArg, {
    skip: !activeBusinessId,
    refetchOnMountOrArgChange: true,
  });
  const { data: recentData } = useGetRecentInvoicesQuery(activeBusinessId, {
    skip: !activeBusinessId,
    refetchOnMountOrArgChange: true,
  });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();

  const isScoped = Boolean(statsData?.data?.isScoped);
  const isStaff = role === 'staff' || isScoped;

  const handleIssueInvoice = async (invoiceId) => {
    try {
      await updateStatus({
        businessId: activeBusinessId,
        invoiceId,
        status: 'issued',
      }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Invoice issued successfully.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.data?.error?.message || 'Failed to issue invoice.' }));
    }
  };

  const handleOpenPdf = async (invoiceId) => {
    try {
      await openPdf(`/businesses/${activeBusinessId}/invoices/${invoiceId}/pdf`);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.message || 'Failed to download PDF.' }));
    }
  };

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
        setMenuView('months');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [monthMenuOpen]);

  if ((statsLoading && !statsData) || (permissionsLoading && !role)) return <PageLoader />;

  const greeting = getGreeting();
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  const isCustomActive = Boolean(customRange?.startDate && customRange?.endDate);
  const activeMonthKey = stats.selected_month || selectedMonth;
  const monthMeta = getMonthMeta(activeMonthKey);
  const totalDays = dailySeries.length > 0 ? dailySeries.length : monthMeta.daysInMonth;

  let dateRangeLabel = `${monthMeta.shortName} 1 – ${monthMeta.shortName} ${monthMeta.daysInMonth}, ${monthMeta.year}`;
  if (isCustomActive && customRange) {
    const parts1 = customRange.startDate.split('-');
    const parts2 = customRange.endDate.split('-');
    const d1 = new Date(parseInt(parts1[0], 10), parseInt(parts1[1], 10) - 1, parseInt(parts1[2], 10));
    const d2 = new Date(parseInt(parts2[0], 10), parseInt(parts2[1], 10) - 1, parseInt(parts2[2], 10));
    const m1 = d1.toLocaleString('en-US', { month: 'short' });
    const m2 = d2.toLocaleString('en-US', { month: 'short' });
    const y1 = d1.getFullYear();
    const y2 = d2.getFullYear();
    const day1 = d1.getDate();
    const day2 = d2.getDate();

    if (y1 === y2) {
      dateRangeLabel = m1 === m2
        ? `${m1} ${day1} – ${day2}, ${y1}`
        : `${m1} ${day1} – ${m2} ${day2}, ${y1}`;
    } else {
      dateRangeLabel = `${m1} ${day1}, ${y1} – ${m2} ${day2}, ${y2}`;
    }
  }

  const handleQuickPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const formatD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    setCustomStart(formatD(start));
    setCustomEnd(formatD(end));
  };

  const handleThisYearPreset = () => {
    const now = new Date();
    const formatD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    setCustomStart(`${now.getFullYear()}-01-01`);
    setCustomEnd(formatD(now));
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) return;
    const s = customStart <= customEnd ? customStart : customEnd;
    const e = customStart <= customEnd ? customEnd : customStart;
    setSelectedMonth(null);
    setCustomRange({ startDate: s, endDate: e });
    setMonthMenuOpen(false);
    setMenuView('months');
  };

  const handleSelectMonth = (monthKey) => {
    setCustomRange(null);
    setSelectedMonth(monthKey);
    setMonthMenuOpen(false);
  };

  // KPI Items definition
  let kpiItems = [];
  if (isStaff) {
    kpiItems = [
      {
        label: 'Invoices created',
        val: String(stats.totalInvoices ?? 0),
        delta: `${stats.paidCount ?? 0} paid`,
        sub: 'All time',
        neg: false,
      },
      {
        label: 'Pending drafts',
        val: String(stats.draftsCount ?? 0),
        delta: stats.draftsCount > 0 ? `${stats.draftsCount} pending` : 'All clear',
        sub: 'Awaiting completion',
        neg: false,
      },
      {
        label: 'Issued bills',
        val: String(stats.issuedCount ?? 0),
        delta: stats.issuedCount > 0 ? `${stats.issuedCount} active` : 'None active',
        sub: 'Awaiting payment',
        neg: false,
      },
      {
        label: 'Billed volume',
        val: formatCurrency(stats.billedAmount ?? 0, activeBusiness?.currency),
        delta: 'Total volume',
        sub: 'Excludes cancelled',
        neg: false,
      },
    ];
  } else {
    const totalRev = formatCurrency(stats.total_revenue ?? 0, activeBusiness?.currency);
    const outstanding = formatCurrency(stats.outstanding_receivable ?? 0, activeBusiness?.currency);
    const totalDocsCount = stats.total_documents ?? ((stats.total_invoices ?? 0) + (stats.total_bills ?? 0));
    const totalInv = String(totalDocsCount);
    const totalProd = String(stats.total_products ?? 0);

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

    const recCount = stats.receivable_count ?? 0;
    const overdueCount = stats.overdue_invoices ?? 0;
    const outDelta = overdueCount > 0 ? `${overdueCount} overdue` : (recCount > 0 ? `${recCount} pending` : 'All settled');
    const outSub = recCount > 0
      ? `${recCount} invoice${recCount > 1 ? 's' : ''} awaiting payment`
      : 'No unpaid receivables';
    const outNeg = overdueCount > 0;

    const currentMonthInvoices = series.at(-1)?.invoices ?? 0;
    const paidCount = statusCounts.paid ?? 0;
    const draftCount = statusCounts.draft ?? 0;
    const issuedCount = statusCounts.issued ?? 0;
    const invDelta = currentMonthInvoices > 0 ? `+${currentMonthInvoices}` : `${paidCount} paid`;
    const invSub = currentMonthInvoices > 0
      ? `issued this month (${paidCount} paid)`
      : (stats.total_bills > 0
          ? `${stats.total_invoices ?? 0} invoices · ${stats.total_bills ?? 0} bills`
          : `${draftCount} draft${draftCount !== 1 ? 's' : ''} · ${issuedCount} issued`);

    const topProductsCount = stats.top_products?.length ?? 0;
    const prodDelta = `${stats.total_products ?? 0} active`;
    const prodSub = topProductsCount > 0
      ? `top sellers: ${stats.top_products.map((p) => p.item_name).slice(0, 2).join(', ')}`
      : 'In catalog';

    kpiItems = [
      { label: 'Total revenue', val: totalRev, delta: revDelta, sub: revSub, neg: revNeg },
      { label: 'Outstanding', val: outstanding, delta: outDelta, sub: outSub, neg: outNeg },
      { label: 'Total invoices', val: totalInv, delta: invDelta, sub: invSub, neg: false },
      { label: 'Total products', val: totalProd, delta: prodDelta, sub: prodSub, neg: false },
    ];
  }

  const recentList = isStaff ? recent.slice(0, 5) : recent.slice(0, 6);

  return (
    <>
      <DashboardHeader
        greeting={greeting}
        firstName={firstName}
        isStaff={isStaff}
        dateRangeLabel={dateRangeLabel}
        monthMenuOpen={monthMenuOpen}
        setMonthMenuOpen={setMonthMenuOpen}
        menuView={menuView}
        setMenuView={setMenuView}
        monthMenuRef={monthMenuRef}
        series={series}
        isCustomActive={isCustomActive}
        activeMonthKey={activeMonthKey}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        todayISOStr={todayISOStr}
        handleSelectMonth={handleSelectMonth}
        handleQuickPreset={handleQuickPreset}
        handleThisYearPreset={handleThisYearPreset}
        handleApplyCustomRange={handleApplyCustomRange}
        onAddCustomer={() => setShowCustomerModal(true)}
        onCreateInvoice={() => navigate('/invoices/new')}
        onNavigateInvoices={() => navigate('/invoices')}
        currency={activeBusiness?.currency}
      />

      <DashboardKpiStrip items={kpiItems} />

      {!isStaff && (
        <div className="drow">
          <RevenueOverviewChart
            dailySeries={dailySeries}
            monthMeta={monthMeta}
            totalDays={totalDays}
            currency={activeBusiness?.currency}
          />
          <InvoiceStatusDonut statusCounts={statusCounts} />
        </div>
      )}

      <DashboardRecentTable
        title={isStaff ? 'My recent bills & invoices' : 'Recent invoices / bills'}
        invoices={recentList}
        currency={activeBusiness?.currency}
        isStaff={isStaff}
        onRowClick={(id) => navigate(`/invoices/${id}`)}
        onEdit={(id) => navigate(`/invoices/${id}/edit`)}
        onIssue={handleIssueInvoice}
        onPdf={handleOpenPdf}
        onViewAll={() => navigate('/invoices')}
        updatingStatus={updatingStatus}
      />

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
      />
    </>
  );
}
