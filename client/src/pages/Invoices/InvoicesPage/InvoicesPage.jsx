import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  useGetInvoicesQuery,
  useUpdateInvoiceStatusMutation,
} from '../../../store/api/invoiceApi';
import { addToast, openDock, closeDock } from '../../../store/slices/uiSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import Icon from '../../../components/ui/Icon/Icon';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { effectiveStatus } from '../../../utils/invoiceStatus';
import { openPdf } from '../../../utils/openPdf';
import './InvoicesPage.css';

const TABS = [
  { value: '', label: 'All' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'bill', label: 'Bills' },
];

export default function InvoicesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const currentUser = useSelector((s) => s.auth.user);
  const { dock } = useSelector((s) => s.ui);
  const { can } = usePermissions();

  const selectedInvoiceId = dock?.open && dock?.type === 'invoice' ? dock.data?.id : null;

  const canCreate = can('invoice.create');
  const canEditInvoice = (inv) => {
    if (!inv || inv.status !== 'draft') return false;
    return can('invoice.edit_any') || (can('invoice.edit_own') && inv.created_by === currentUser?.id);
  };

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Sync when search parameter changes in URL
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  // Invoices list
  const { data, isLoading, refetch } = useGetInvoicesQuery(
    { businessId: activeBusinessId, page, search, type: typeFilter },
    { skip: !activeBusinessId }
  );

  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();

  const invoices = data?.data?.invoices || [];
  const meta = data?.meta || {};
  const selectedInvoice = dock?.data;

  // Auto-open dock when redirected from edit/create with a selected invoice
  const handledTargetRef = useRef(null);
  useEffect(() => {
    const targetId = location.state?.selectedInvoiceId;
    if (targetId && activeBusiness && handledTargetRef.current !== targetId) {
      handledTargetRef.current = targetId;
      const summary = invoices.find((inv) => inv.id === targetId);
      dispatch(
        openDock({
          type: 'invoice',
          data: summary ? { ...summary, business: activeBusiness } : { id: targetId, business: activeBusiness },
        })
      );
    }
  }, [location.state?.selectedInvoiceId, activeBusiness, invoices, dispatch]);

  const handleRowClick = (inv) => {
    if (selectedInvoiceId === inv.id) {
      dispatch(closeDock());
    } else {
      dispatch(
        openDock({
          type: 'invoice',
          data: {
            ...inv,
            business: activeBusiness,
          },
        })
      );
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedInvoiceId) return;
    try {
      await updateStatus({
        businessId: activeBusinessId,
        invoiceId: selectedInvoiceId,
        status,
      }).unwrap();
      dispatch(addToast({ type: 'success', message: `Invoice marked as ${status}.` }));
      refetch?.();
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to update invoice status.',
        })
      );
    }
  };

  const handleDownloadPdf = async (inv) => {
    const target = inv || selectedInvoice;
    if (!target) return;
    try {
      await openPdf(`/businesses/${activeBusinessId}/invoices/${target.id}/pdf`);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err?.message || 'Failed to download PDF.' }));
    }
  };

  const columns = [
    {
      key: 'invoice_number',
      header: 'Document',
      width: '18%',
      render: (inv) => (
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
          {inv.invoice_number}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: '12%',
      render: (inv) => (
        <span style={{ textTransform: 'capitalize', color: 'var(--text-2)' }}>
          {inv.type}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      width: '26%',
      render: (inv) => inv.customer_name || 'Walk-in customer',
    },
    {
      key: 'issue_date',
      header: 'Issue date',
      width: '16%',
      render: (inv) => <span className="tax">{formatDate(inv.issue_date)}</span>,
    },
    {
      key: 'due_date',
      header: 'Due date',
      width: '16%',
      render: (inv) => <span className="tax">{formatDate(inv.due_date)}</span>,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      width: '16%',
      align: 'right',
      price: true,
      render: (inv) => (
        <span className="num price">
          {formatCurrency(inv.total_amount, activeBusiness?.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '14%',
      render: (inv) => {
        const status = effectiveStatus(inv);
        return <StatusBadge status={status} />;
      },
    },
  ];

  return (
    <div>
      {/* ── Page Header matching Alturay_UI_redesign.html .ph ── */}
      <div className="ph">
        <div>
          <h1>
            <Icon name="file" size={24} />
            <span>Invoices &amp; Bills</span>
          </h1>
          <p>Create, track and manage billing for {activeBusiness?.name || 'your business'}.</p>
        </div>
        <div className="actions">
          {canCreate && (
            <>
              <button
                type="button"
                className="btn"
                onClick={() => navigate('/invoices/new?type=bill')}
              >
                New bill
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate('/invoices/new?type=invoice')}
              >
                New invoice
              </button>
            </>
          )}
        </div>
      </div>

      <DataTable>
        <DataTable.Toolbar>
          <DataTable.Search
            placeholder="Search invoices"
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
        </DataTable.Toolbar>

        <DataTable.Content
          isLoading={isLoading}
          isEmpty={invoices.length === 0}
          emptyState={{
            icon: <Icon name="file" size={32} />,
            title: 'No invoices found',
            description: 'You have not created any invoices yet.',
            actionLabel: canCreate ? 'New invoice' : undefined,
            onAction: canCreate ? () => navigate('/invoices/new?type=invoice') : undefined,
          }}
          columns={columns}
          data={invoices}
          onRowClick={handleRowClick}
          selectedId={selectedInvoiceId}
          renderRow={(inv) => {
            const isSelected = selectedInvoiceId === inv.id;
            const status = effectiveStatus(inv);

            return (
              <DataTable.Row
                key={inv.id}
                onClick={() => handleRowClick(inv)}
                className={isSelected ? 'sel invoices-row--selected' : ''}
                data-id={inv.id}
              >
                <td>{inv.invoice_number}</td>
                <td style={{ textTransform: 'capitalize' }}>{inv.type}</td>
                <td>{inv.customer_name || 'Walk-in customer'}</td>
                <td className="tax">{formatDate(inv.issue_date)}</td>
                <td className="tax">{formatDate(inv.due_date)}</td>
                <td className="num price">
                  {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                </td>
                <td>
                  <StatusBadge status={status} />
                </td>
              </DataTable.Row>
            );
          }}
        />

        <DataTable.Pagination
          page={page}
          meta={meta}
          onPageChange={setPage}
          limit={20}
        />
      </DataTable>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          handleStatusChange('cancelled');
        }}
        loading={updatingStatus}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice ${selectedInvoice?.invoice_number}? Cancelled invoices cannot be reopened or paid.`}
      />
    </div>
  );
}
