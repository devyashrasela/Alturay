import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, Receipt, IndianRupee, Plus, ArrowRight } from 'lucide-react';
import { useGetDashboardStatsQuery, useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import StatCard from '../../components/ui/Card/StatCard';
import Card from '../../components/ui/Card/Card';
import StatusBadge from '../../components/ui/Badge/StatusBadge';
import Button from '../../components/ui/Button/Button';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { user } = useSelector((s) => s.auth);

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(activeBusinessId, { skip: !activeBusinessId });
  const { data: recentData, isLoading: recentLoading } = useGetRecentInvoicesQuery(activeBusinessId, { skip: !activeBusinessId });

  const stats = statsData?.data?.stats || {};
  const recent = recentData?.data?.invoices || [];

  if (statsLoading) return <PageLoader />;

  return (
    <div>
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__welcome">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="dashboard__welcome-sub">
            Here's what's happening with <strong>{activeBusiness?.name}</strong> today.
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

      {/* Stat Cards */}
      <div className="dashboard__stats">
        <StatCard
          label="Total Products"
          value={stats.total_products ?? 0}
          icon={<Package size={22} />}
          iconVariant="orange"
        />
        <StatCard
          label="Total Invoices"
          value={stats.total_invoices ?? 0}
          icon={<FileText size={22} />}
          iconVariant="blue"
        />
        <StatCard
          label="Total Bills"
          value={stats.total_bills ?? 0}
          icon={<Receipt size={22} />}
          iconVariant="purple"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue, activeBusiness?.currency)}
          icon={<IndianRupee size={22} />}
          iconVariant="green"
        />
      </div>

      {/* Recent Invoices */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 className="dashboard__section-title" style={{ marginBottom: 0 }}>Recent Activity</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            View all <ArrowRight size={14} />
          </Button>
        </div>

        {recentLoading ? (
          <PageLoader />
        ) : recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No invoices yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
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
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{inv.invoice_number}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>{inv.type}</td>
                    <td>{inv.customer_name}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(inv.issue_date)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
