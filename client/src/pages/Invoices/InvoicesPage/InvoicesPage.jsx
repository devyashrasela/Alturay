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
  const { dock } = useSelector((s) => s.ui);
  const currentUserId = useSelector((s) => s.auth.user?.id);
  const { can, role } = usePermissions();

  const selectedInvoiceId = dock?.open && dock?.type === 'invoice' ? dock.data?.id : null;

  const canCreate = can('invoice.create');
  const canSeeCreatedBy = ['owner', 'admin', 'manager'].includes(role);
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

  const hasInvoiceFilters = Boolean(search.trim()) || Boolean(typeFilter);
  const documentLabel =
    typeFilter === 'invoice'
      ? 'invoices'
      : typeFilter === 'bill'
        ? 'bills'
        : 'invoices or bills';
  const nextDocumentLabel =
    typeFilter === 'invoice' ? 'invoice' : typeFilter === 'bill' ? 'bill' : 'invoice or bill';

  const clearInvoiceFilters = () => {
    setSearch('');
    setTypeFilter('');
    setPage(1);
    navigate(location.pathname, { replace: true });
  };

  const emptyState = hasInvoiceFilters
    ? {
        icon: <Icon name="search" size={32} />,
        title: `No matching ${documentLabel}`,
        description: search.trim()
          ? `No ${documentLabel} match “${search.trim()}” in this view. Try another search or clear the filters.`
          : `No ${documentLabel} are available in this view. Try another tab or clear the filters.`,
        actionLabel: 'Clear filters',
        onAction: clearInvoiceFilters,
      }
    : {
        icon: <Icon name="file" size={32} />,
        title: `No ${documentLabel} yet`,
        description: `Create your first ${nextDocumentLabel} to see it here.`,
        actionLabel: canCreate ? 'New invoice' : undefined,
        onAction: canCreate ? () => navigate('/invoices/new?type=invoice') : undefined,
      };

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

  const columns = [
    {
      key: 'invoice_number',
      header: 'Document',
      width: canSeeCreatedBy ? '16%' : '19%',
      render: (inv) => (
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
          {inv.invoice_number}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      width: canSeeCreatedBy ? '20%' : '25%',
      render: (inv) => inv.customer_name || 'Walk-in customer',
    },
    {
      key: 'issue_date',
      header: 'Issue date',
      width: canSeeCreatedBy ? '12%' : '14%',
      render: (inv) => <span className="tax">{formatDate(inv.issue_date)}</span>,
    },
    {
      key: 'due_date',
      header: 'Due date',
      width: canSeeCreatedBy ? '12%' : '14%',
      render: (inv) => <span className="tax">{formatDate(inv.due_date)}</span>,
    },
    ...(canSeeCreatedBy
      ? [
          {
            key: 'creator',
            header: 'Created By',
            width: '16%',
            render: (inv) => {
              const name = inv.creator?.name || '—';
              const isYou = Boolean(inv.creator?.id && inv.creator.id === currentUserId);
              return isYou ? `${name} (you)` : name;
            },
          },
        ]
      : []),
    {
      key: 'total_amount',
      header: 'Amount',
      width: canSeeCreatedBy ? '12%' : '14%',
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
      width: canSeeCreatedBy ? '12%' : '14%',
      render: (inv) => {
        const status = effectiveStatus(inv);
        return <StatusBadge status={status} />;
      },
    },
  ];

  return (
    <div className="invoices-page">
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
          emptyState={emptyState}
          columns={columns}
          data={invoices}
          onRowClick={handleRowClick}
          selectedId={selectedInvoiceId}
          renderRow={(inv) => {
            const isSelected = selectedInvoiceId === inv.id;
            const status = effectiveStatus(inv);
            const creatorName = inv.creator?.name || '—';
            const isCreatorYou = Boolean(inv.creator?.id && inv.creator.id === currentUserId);

            return (
              <DataTable.Row
                key={inv.id}
                onClick={() => handleRowClick(inv)}
                className={isSelected ? 'sel invoices-row--selected' : ''}
                data-id={inv.id}
              >
                <td>{inv.invoice_number}</td>
                <td>{inv.customer_name || 'Walk-in customer'}</td>
                <td className="tax">{formatDate(inv.issue_date)}</td>
                <td className="tax">{formatDate(inv.due_date)}</td>
                <td className={`invoices-created-by${isCreatorYou ? ' is-you' : ''}`}>
                  <span className="invoices-created-by-content">
                    <span className="invoices-created-by-name">{creatorName}</span>
                    {isCreatorYou && <span className="invoices-created-by-you">(you)</span>}
                  </span>
                </td>
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
