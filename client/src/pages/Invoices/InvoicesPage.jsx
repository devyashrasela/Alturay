import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { effectiveStatus } from '../../utils/invoiceStatus';

const tabs = [
  { value: '', label: 'All' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'bill', label: 'Bills' },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('');

  // Sync when the header search navigates here with ?search=
  const [lastParams, setLastParams] = useState(searchParams);
  if (searchParams !== lastParams) {
    setLastParams(searchParams);
    setSearch(searchParams.get('search') || '');
  }

  const { data, isLoading } = useGetInvoicesQuery(
    { businessId: activeBusinessId, page, search, type: typeFilter },
    { skip: !activeBusinessId }
  );

  const invoices = data?.data?.invoices || [];
  const meta = data?.meta || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-header__title">Invoices & Bills</h2>
          <p className="page-header__sub">
            Manage and track all your billing for {activeBusiness?.name}
          </p>
        </div>
        <div className="page-header__actions">
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
        <div className="card-toolbar">
          <Tabs
            tabs={tabs}
            activeTab={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
          />
          <div className="card-toolbar__end">
            <SearchInput
              className="invoice-search"
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search invoices..."
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
            <div className="table-flush-x table-scroll">
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
                      className="table-row-link"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="table-link">{inv.invoice_number}</td>
                      <td className="table-type">{inv.type}</td>
                      <td>{inv.customer_name}</td>
                      <td className="table-date">{formatDate(inv.issue_date)}</td>
                      <td className="table-date">{formatDate(inv.due_date)}</td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                      </td>
                      <td><StatusBadge status={effectiveStatus(inv)} /></td>
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
