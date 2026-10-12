import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { useGetInvoicesQuery } from '../../store/api/invoiceApi';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import StatusBadge from '../../components/ui/Badge/StatusBadge';
import SearchInput from '../../components/ui/SearchInput/SearchInput';
import Tabs from '../../components/ui/Tabs/Tabs';
import Pagination from '../../components/ui/Pagination/Pagination';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const tabs = [
  { value: '', label: 'All' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'bill', label: 'Bills' },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useGetInvoicesQuery(
    { businessId: activeBusinessId, page, search, type: typeFilter },
    { skip: !activeBusinessId }
  );

  const invoices = data?.data?.invoices || [];
  const meta = data?.meta || {};

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Invoices & Bills</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Manage and track all your billing for {activeBusiness?.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" size="md" id="new-bill-btn" onClick={() => navigate('/invoices/new?type=bill')}>
            <Plus size={16} /> New Bill
          </Button>
          <Button variant="primary" size="md" id="new-invoice-btn" onClick={() => navigate('/invoices/new?type=invoice')}>
            <Plus size={16} /> New Invoice
          </Button>
        </div>
      </div>

      <Card>
        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <Tabs
            tabs={tabs}
            activeTab={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
          />
          <div style={{ marginLeft: 'auto' }}>
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search invoices..."
              className=""
              style={{ width: 240 }}
            />
          </div>
        </div>

        {isLoading ? <PageLoader /> : invoices.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title="No invoices found"
            description="Create your first invoice or bill to get started."
            actionLabel="New Invoice"
            onAction={() => navigate('/invoices/new?type=invoice')}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{inv.invoice_number}</td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>{inv.type}</td>
                      <td>{inv.customer_name}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(inv.issue_date)}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(inv.due_date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                      </td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={20} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
