import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Pencil,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Maximize2,
  X,
} from 'lucide-react';
import {
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useUpdateInvoiceStatusMutation,
} from '../../../store/api/invoiceApi';
import { addToast } from '../../../store/slices/uiSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import Icon from '../../../components/ui/Icon/Icon';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import { PageLoader } from '../../../components/ui/Loader/Spinner';
import InvoicePreviewCard from '../../../components/invoices/InvoicePreviewCard/InvoicePreviewCard';
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
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const currentUser = useSelector((s) => s.auth.user);
  const { can } = usePermissions();

  const canCreate = can('invoice.create');
  const canEditInvoice = (inv) => {
    if (!inv || inv.status !== 'draft') return false;
    return can('invoice.edit_any') || (can('invoice.edit_own') && inv.created_by === currentUser?.id);
  };

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Sync when search parameter changes in URL
  const [lastParams, setLastParams] = useState(searchParams);
  if (searchParams !== lastParams) {
    setLastParams(searchParams);
    setSearch(searchParams.get('search') || '');
  }

  // Invoices list
  const { data, isLoading } = useGetInvoicesQuery(
    { businessId: activeBusinessId, page, search, type: typeFilter },
    { skip: !activeBusinessId }
  );

  // Selected invoice for side preview panel
  const { data: selectedData, isLoading: loadingSelected } = useGetInvoiceQuery(
    { businessId: activeBusinessId, invoiceId: selectedInvoiceId },
    { skip: !activeBusinessId || !selectedInvoiceId }
  );

  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();

  const invoices = data?.data?.invoices || [];
  const meta = data?.meta || {};
  const selectedInvoice = selectedData?.data?.invoice;

  const handleRowClick = (inv) => {
    setSelectedInvoiceId((prev) => (prev === inv.id ? null : inv.id));
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
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to update invoice status.',
        })
      );
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedInvoiceId) return;
    openPdf(`/businesses/${activeBusinessId}/invoices/${selectedInvoiceId}/pdf`)
      .catch(() => dispatch(addToast({ type: 'error', message: 'Could not load PDF.' })));
  };

  const columns = [
    {
      key: 'invoice_number',
      header: 'Document',
      width: selectedInvoiceId ? '22%' : '15%',
      render: (inv) => inv.invoice_number,
    },
    {
      key: 'type',
      header: 'Type',
      width: selectedInvoiceId ? '16%' : '12%',
      render: (inv) => <span style={{ textTransform: 'capitalize' }}>{inv.type}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer / Vendor',
      width: selectedInvoiceId ? '28%' : '25%',
      render: (inv) => inv.customer_name || '—',
    },
    {
      key: 'issue_date',
      header: 'Issue Date',
      width: '14%',
      tax: true,
      render: (inv) => formatDate(inv.issue_date),
    },
    ...(!selectedInvoiceId
      ? [
          {
            key: 'due_date',
            header: 'Due Date',
            width: '14%',
            tax: true,
            render: (inv) => formatDate(inv.due_date),
          },
        ]
      : []),
    {
      key: 'total_amount',
      header: 'Amount',
      width: selectedInvoiceId ? '18%' : '12%',
      align: 'right',
      price: true,
      render: (inv) => formatCurrency(inv.total_amount, activeBusiness?.currency),
    },
    {
      key: 'status',
      header: 'Status',
      width: selectedInvoiceId ? '16%' : '8%',
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

      <div className="invoices-layout">
        {/* Left Side: Table (Shrinks when an invoice is clicked) */}
        <div className={`invoices-layout__table ${selectedInvoiceId ? 'invoices-layout__table--split' : ''}`}>
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
                {canCreate && (
                  <>
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
                  </>
                )}
              </DataTable.Actions>
            </DataTable.Toolbar>

            <DataTable.Content
              isLoading={isLoading}
              isEmpty={invoices.length === 0}
              emptyState={{
                icon: <Icon name="file" size={28} />,
                title: 'No invoices found',
                description: 'Create your first invoice or bill to get started.',
                actionLabel: canCreate ? 'New Invoice' : undefined,
                onAction: canCreate ? () => navigate('/invoices/new?type=invoice') : undefined,
              }}
              columns={columns}
              data={invoices}
              renderRow={(inv) => {
                const isSelected = selectedInvoiceId === inv.id;
                const status = effectiveStatus(inv);
                const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                return (
                  <DataTable.Row
                    key={inv.id}
                    onClick={() => handleRowClick(inv)}
                    className={isSelected ? 'invoices-row--selected' : ''}
                  >
                    <td>{inv.invoice_number}</td>
                    <td style={{ textTransform: 'capitalize' }}>{inv.type}</td>
                    <td>{inv.customer_name || '—'}</td>
                    <td className="tax">{formatDate(inv.issue_date)}</td>
                    {!selectedInvoiceId && <td className="tax">{formatDate(inv.due_date)}</td>}
                    <td className="num price">
                      {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                    </td>
                    <td>
                      <span className={`sc sc-${status.toLowerCase()}`}>{statusLabel}</span>
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
        </div>

        {/* Right Side: Preview Panel (Slides in when an invoice is clicked) */}
        {selectedInvoiceId && (
          <aside className="invoices-layout__panel" aria-label="Invoice Details Preview">
            <div className="invoices-panel__topbar">
              <div className="invoices-panel__actions">
                {/* 1. Edit button: ONLY available for draft invoices & permitted user */}
                {selectedInvoice?.status === 'draft' && canEditInvoice(selectedInvoice) && (
                  <button
                    type="button"
                    className="dash-btn"
                    onClick={() => navigate(`/invoices/${selectedInvoice.id}/edit`)}
                    title="Edit draft invoice"
                  >
                    <Pencil size={14} />
                    <span>Edit</span>
                  </button>
                )}

                {/* 2. Lifecycle action: Issue if draft & permitted */}
                {selectedInvoice?.status === 'draft' && can('invoice.issue') && (
                  <button
                    type="button"
                    className="dash-btn"
                    onClick={() => handleStatusChange('issued')}
                    disabled={updatingStatus}
                    title="Confirm & Issue invoice"
                  >
                    <Send size={14} />
                    <span>Issue</span>
                  </button>
                )}

                {/* 3. Lifecycle action: Mark Paid if issued & permitted */}
                {selectedInvoice?.status === 'issued' && can('invoice.mark_paid') && (
                  <button
                    type="button"
                    className="dash-btn"
                    onClick={() => handleStatusChange('paid')}
                    disabled={updatingStatus}
                    title="Mark as paid"
                  >
                    <CheckCircle size={14} />
                    <span>Mark Paid</span>
                  </button>
                )}

                {/* 4. Cancel action: available for draft or issued & permitted. PROHIBITED when paid! */}
                {selectedInvoice &&
                  selectedInvoice.status !== 'cancelled' &&
                  selectedInvoice.status !== 'paid' &&
                  can('invoice.cancel') && (
                    <button
                      type="button"
                      className="dash-btn"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => setConfirmCancel(true)}
                      disabled={updatingStatus}
                      title="Cancel invoice"
                    >
                      <XCircle size={14} />
                      <span>Cancel</span>
                    </button>
                  )}

                {/* 5. Download PDF */}
                <button
                  type="button"
                  className="dash-btn"
                  onClick={handleDownloadPdf}
                  title="Download PDF"
                >
                  <Download size={14} />
                  <span>PDF</span>
                </button>
              </div>

              {/* Navigation icons (Maximize & Close) */}
              <div className="invoices-panel__navs">
                <button
                  type="button"
                  className="invoices-panel__icon-btn"
                  title="Open full page"
                  onClick={() => navigate(`/invoices/${selectedInvoiceId}`)}
                  aria-label="Maximize preview"
                >
                  <Maximize2 size={15} />
                </button>
                <button
                  type="button"
                  className="invoices-panel__icon-btn"
                  title="Close preview"
                  onClick={() => setSelectedInvoiceId(null)}
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {loadingSelected ? (
              <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
                <PageLoader />
              </div>
            ) : selectedInvoice ? (
              <InvoicePreviewCard invoice={selectedInvoice} business={activeBusiness} />
            ) : null}
          </aside>
        )}
      </div>

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
