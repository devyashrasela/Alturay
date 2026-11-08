import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetInvoicesQuery } from '../../store/api/invoiceApi';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader/PageHeader';
import DataTable from '../../components/ui/DataTable';
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

  const columns = [
    {
      key: 'invoice_number',
      header: 'Document',
      width: '15%',
      render: (inv) => inv.invoice_number,
    },
    {
      key: 'type',
      header: 'Type',
      width: '12%',
      render: (inv) => <span style={{ textTransform: 'capitalize' }}>{inv.type}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer / Vendor',
      width: '25%',
      render: (inv) => inv.customer_name || '—',
    },
    {
      key: 'issue_date',
      header: 'Issue Date',
      width: '14%',
      tax: true,
      render: (inv) => formatDate(inv.issue_date),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      width: '14%',
      tax: true,
      render: (inv) => formatDate(inv.due_date),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      width: '12%',
      align: 'right',
      price: true,
      render: (inv) => formatCurrency(inv.total_amount, activeBusiness?.currency),
    },
    {
      key: 'status',
      header: 'Status',
      width: '8%',
      render: (inv) => {
        const status = effectiveStatus(inv);
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        return <span className={`sc sc-${status.toLowerCase()}`}>{statusLabel}</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices & Bills"
        description={`Track and manage all your billing for ${activeBusiness?.name || 'your business'}`}
      />

      <DataTable>
        <DataTable.Toolbar>
          <DataTable.Search
            placeholder="Search invoices…"
            ariaLabel="Search invoices"
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
          />

          <DataTable.Tabs
            tabs={TABS}
            activeTab={typeFilter}
            onTabChange={(tabVal) => {
              setTypeFilter(tabVal);
              setPage(1);
            }}
          />

          <DataTable.Actions>
            <DataTable.FilterButton ariaLabel="Filter and sort documents" />
            <button
              type="button"
              className="dash-btn"
              onClick={() => navigate('/invoices/new?type=bill')}
            >
              <Icon name="receipt" size={16} />
              <span>New bill</span>
            </button>
            <DataTable.NewButton onClick={() => navigate('/invoices/new?type=invoice')}>
              New invoice
            </DataTable.NewButton>
          </DataTable.Actions>
        </DataTable.Toolbar>

        <DataTable.Content
          isLoading={isLoading}
          isEmpty={invoices.length === 0}
          emptyState={{
            icon: <Icon name="file" size={28} />,
            title: 'No invoices found',
            description: 'Create your first invoice or bill to get started.',
            actionLabel: 'New Invoice',
            onAction: () => navigate('/invoices/new?type=invoice'),
          }}
          columns={columns}
          data={invoices}
          onRowClick={(inv) => navigate(`/invoices/${inv.id}`)}
        />

        <DataTable.Pagination
          page={page}
          meta={meta}
          onPageChange={setPage}
          limit={20}
        />
      </DataTable>
    </div>
  );
}
