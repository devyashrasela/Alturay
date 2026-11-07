import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetInvoicesQuery } from '../../store/api/invoiceApi';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import Pagination from '../../components/ui/Pagination/Pagination';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { effectiveStatus } from '../../utils/invoiceStatus';

const TABS = [
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

  // Sync when search parameter changes in URL
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
      <h1 className="page-title">Invoices & Bills</h1>
      <p className="page-sub">
        Track and manage all your billing for {activeBusiness?.name || 'your business'}
      </p>

      <div className="db-bar">
        <label className="db-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Search invoices…"
            aria-label="Search invoices"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>

        <div className="db-pills" role="tablist" aria-label="Filter documents by type">
          {TABS.map((tab) => {
            const isSelected = typeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                className="db-pill"
                aria-selected={isSelected}
                onClick={() => {
                  setTypeFilter(tab.value);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="db-end">
          <button type="button" className="db-icon" aria-label="Filter and sort">
            <Icon name="funnel" size={18} />
          </button>
          <button
            type="button"
            className="dash-btn"
            onClick={() => navigate('/invoices/new?type=bill')}
          >
            <Icon name="receipt" size={16} />
            <span>New bill</span>
          </button>
          <button
            type="button"
            className="db-new"
            onClick={() => navigate('/invoices/new?type=invoice')}
          >
            New invoice
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ marginTop: 24 }}>
          <PageLoader />
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ marginTop: 20 }}>
          <EmptyState
            icon={<Icon name="file" size={28} />}
            title="No invoices found"
            description="Create your first invoice or bill to get started."
            actionLabel="New Invoice"
            onAction={() => navigate('/invoices/new?type=invoice')}
          />
        </div>
      ) : (
        <>
          <div className="db-wrap">
            <table className="db">
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Type</th>
                  <th scope="col">Customer / Vendor</th>
                  <th scope="col">Issue Date</th>
                  <th scope="col">Due Date</th>
                  <th scope="col" className="num">Amount</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const status = effectiveStatus(inv);
                  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                  return (
                    <tr
                      key={inv.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td>{inv.invoice_number}</td>
                      <td style={{ textTransform: 'capitalize' }}>{inv.type}</td>
                      <td>{inv.customer_name || '—'}</td>
                      <td className="tax">{formatDate(inv.issue_date)}</td>
                      <td className="tax">{formatDate(inv.due_date)}</td>
                      <td className="num price">
                        {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                      </td>
                      <td>
                        <span className={`sc sc-${status.toLowerCase()}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div style={{ marginTop: 16 }}>
              <Pagination
                page={page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={20}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
