import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  FileText,
  Receipt,
  IndianRupee,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock3,
  AlertTriangle,
} from 'lucide-react';
import { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import StatCard from '../../components/ui/Card/StatCard';
import Card from '../../components/ui/Card/Card';
import BarChart from '../../components/ui/Charts/BarChart';
import StatusBadge from '../../components/ui/Badge/StatusBadge';
import Button from '../../components/ui/Button/Button';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { effectiveStatus } from '../../utils/invoiceStatus';

const STATUS_META = [
  { key: 'draft', label: 'Draft', color: 'gray' },
  { key: 'issued', label: 'Issued', color: 'blue' },
  { key: 'paid', label: 'Paid', color: 'green' },
  { key: 'cancelled', label: 'Cancelled', color: 'gray' },
];

const DOT_COLORS = {
  orange: 'var(--color-primary)',
  green: 'var(--color-success)',
  blue: 'var(--color-info)',
  amber: 'var(--color-warning)',
  gray: 'var(--color-border-strong)',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { user } = useSelector((s) => s.auth);

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(activeBusinessId, { skip: !activeBusinessId });
  const { data: recentData, isLoading: recentLoading } = useGetRecentInvoicesQuery(activeBusinessId, { skip: !activeBusinessId });

  const stats = statsData?.data?.stats || {};
  const recent = recentData?.data?.invoices || [];
  const statusCounts = stats.status_counts || {};
  const series = stats.monthly_series || [];
  const topProducts = stats.top_products || [];

  if (statsLoading) return <PageLoader />;

  // Month-over-month revenue trend (only shown when it's meaningful)
  const currentMonth = series.at(-1)?.revenue ?? 0;
  const previousMonth = series.at(-2)?.revenue ?? 0;
  let revenueTrend = null;
  if (previousMonth > 0 && currentMonth > 0) {
    const pct = Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
    if (pct !== 0) {
      revenueTrend = {
        direction: pct > 0 ? 'up' : 'down',
        label: `${pct > 0 ? '+' : ''}${pct}% vs last month`,
        icon: pct > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />,
      };
    }
  }

  return (
    <div>
      {/* Welcome */}
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__welcome">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}
          </h2>
          <p className="dashboard__welcome-sub">
            Here’s what’s happening with <strong>{activeBusiness?.name}</strong> today.
          </p>
        </div>
        <div className="dashboard__actions">
          <Button
            variant="secondary"
            size="md"
            id="create-bill-btn"
            onClick={() => navigate('/invoices/new?type=bill')}
          >
            <Plus size={16} />
            Create Bill
          </Button>
          <Button
            variant="primary"
            size="md"
            id="create-invoice-btn"
            onClick={() => navigate('/invoices/new?type=invoice')}
          >
            <Plus size={16} />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="dashboard__stats">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue, activeBusiness?.currency)}
          icon={<IndianRupee size={22} />}
          iconVariant="orange"
          sub={previousMonth >= 0 && series.length ? `This month: ${formatCurrency(currentMonth, activeBusiness?.currency)}` : null}
          trend={revenueTrend}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding_receivable ?? 0, activeBusiness?.currency)}
          icon={<Clock3 size={22} />}
          iconVariant="amber"
          sub={`${stats.receivable_count ?? 0} invoices awaiting payment`}
        />
        <StatCard
          label="Total Invoices"
          value={stats.total_invoices ?? 0}
          icon={<FileText size={22} />}
          iconVariant="blue"
          sub={`${statusCounts.paid ?? 0} paid · ${statusCounts.draft ?? 0} drafts`}
        />
        <StatCard
          label="Total Products"
          value={stats.total_products ?? 0}
          icon={<Package size={22} />}
          iconVariant="purple"
          sub={topProducts[0] ? `Top item: ${truncateName(topProducts[0].item_name)}` : 'In your catalog'}
        />
      </div>

      {/* Chart + invoice status */}
      <div className="dash-grid">
        <Card>
          <div className="dash-card__head">
            <div>
              <h3 className="dash-card__title">Revenue Overview</h3>
              <p className="dash-card__sub">Invoiced amount, last 6 months</p>
            </div>
          </div>
          <BarChart
            data={series.map((m) => ({ key: m.month, label: m.label, value: m.revenue }))}
            currency={activeBusiness?.currency}
          />
        </Card>

        <Card>
          <div className="dash-card__head">
            <div>
              <h3 className="dash-card__title">Invoice Status</h3>
              <p className="dash-card__sub">Where every invoice stands</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
              View all <ArrowRight size={14} />
            </Button>
          </div>

          {stats.overdue_invoices > 0 && (
            <button
              type="button"
              className="overdue-alert"
              style={{ width: '100%', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => navigate('/invoices')}
            >
              <AlertTriangle size={18} color="var(--color-warning)" style={{ flexShrink: 0 }} />
              <span className="overdue-alert__text">
                <span className="overdue-alert__title">
                  {stats.overdue_invoices} {stats.overdue_invoices === 1 ? 'invoice is' : 'invoices are'} overdue
                </span>
                <div className="overdue-alert__sub">Follow up to get paid faster</div>
              </span>
              <ArrowRight size={14} color="var(--color-warning-strong)" style={{ flexShrink: 0 }} />
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {STATUS_META.map((meta) => {
              const count = statusCounts[meta.key] ?? 0;
              const total = statusCounts.draft + statusCounts.issued + statusCounts.paid + statusCounts.cancelled || 0;
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div className="status-row" key={meta.key}>
                  <div className="status-row__top">
                    <span className="status-row__dot" style={{ background: DOT_COLORS[meta.color] }} />
                    <span className="status-row__label">{meta.label}</span>
                    <span className="status-row__count">{count}</span>
                  </div>
                  <div className="status-row__track">
                    <div className={`status-row__bar status-row__bar--${meta.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginTop: 12 }} />
          <div>
            <div className="balance-row">
              <span className="balance-row__label">
                <TrendingUp size={14} color="var(--color-success)" />
                Receivables
              </span>
              <span className="balance-row__value">{formatCurrency(stats.outstanding_receivable ?? 0, activeBusiness?.currency)}</span>
            </div>
            <div className="balance-row">
              <span className="balance-row__label">
                <Receipt size={14} color="var(--color-danger)" />
                Payables
              </span>
              <span className="balance-row__value">{formatCurrency(stats.outstanding_payable ?? 0, activeBusiness?.currency)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activity + inventory */}
      <div className="dash-grid dash-grid--wide-right">
        <Card>
          <div className="dash-card__head">
            <div>
              <h3 className="dash-card__title">Recent Activity</h3>
              <p className="dash-card__sub">Your latest invoices and bills</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
              View all <ArrowRight size={14} />
            </Button>
          </div>

          {recentLoading ? (
            <PageLoader />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<FileText size={26} />}
              title="No invoices yet"
              description="Create your first invoice or bill to see it here."
              actionLabel="Create Invoice"
              onAction={() => navigate('/invoices/new?type=invoice')}
            />
          ) : (
            <div className="table-flush">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Type</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((inv) => (
                      <tr
                        key={inv.id}
                        className="table-row-link"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >
                        <td><Link to={`/invoices/${inv.id}`} className="table-link">{inv.invoice_number}</Link></td>
                        <td className="table-type">{inv.type}</td>
                        <td>{inv.customer_name}</td>
                        <td className="table-date">{formatDate(inv.issue_date)}</td>
                        <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                        </td>
                        <td><StatusBadge status={effectiveStatus(inv)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        <Card className="card--compact">
          <div className="dash-card__head" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="dash-card__title">Top Products</h3>
              <p className="dash-card__sub">Best sellers by revenue</p>
            </div>
            <Button variant="ghost" size="sm" aria-label="View products" onClick={() => navigate('/products')}>
              <Package size={15} />
            </Button>
          </div>

          {topProducts.length === 0 ? (
            <EmptyState
              icon={<Package size={24} />}
              title="No products yet"
              description="Add products to your catalog to start billing them."
              actionLabel="Add Product"
              onAction={() => navigate('/products')}
            />
          ) : (
            <div className="mini-list mini-list--flush">
              {topProducts.map((p, i) => (
                <div className="mini-list__item" style={{ cursor: 'default' }} key={`${p.item_name}-${i}`}>
                  <div className="icon-tile icon-tile--blue" style={{ width: 34, height: 34 }}>
                    <Package size={16} />
                  </div>
                  <div className="mini-list__body">
                    <div className="mini-list__name">{p.item_name}</div>
                    <div className="mini-list__meta">{p.units} units sold</div>
                  </div>
                  <span className="mini-list__value">{formatCurrency(p.revenue, activeBusiness?.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function truncateName(name) {
  if (!name) return '';
  return name.length > 22 ? `${name.slice(0, 22)}…` : name;
}
