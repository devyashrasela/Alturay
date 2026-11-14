import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, CheckCircle, XCircle, Send, Pencil } from 'lucide-react';
import { useGetInvoiceQuery, useUpdateInvoiceStatusMutation } from '../../store/api/invoiceApi';
import { addToast } from '../../store/slices/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';
import Button from '../../components/ui/Button/Button';
import ConfirmDialog from '../../components/ui/Modal/ConfirmDialog';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import InvoicePreviewCard from '../../components/invoices/InvoicePreviewCard';
import { openPdf } from '../../utils/openPdf';
import './InvoiceDetail.css';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const currentUser = useSelector((s) => s.auth.user);
  const { can } = usePermissions();

  const canEditInvoice = (inv) => {
    if (!inv || inv.status !== 'draft') return false;
    return can('invoice.edit_any') || (can('invoice.edit_own') && inv.created_by === currentUser?.id);
  };

  const { data, isLoading } = useGetInvoiceQuery(
    { businessId: activeBusinessId, invoiceId: id },
    { skip: !activeBusinessId }
  );
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const invoice = data?.data?.invoice;

  const handleStatus = async (status) => {
    try {
      await updateStatus({ businessId: activeBusinessId, invoiceId: id, status }).unwrap();
      dispatch(addToast({ type: 'success', message: `Invoice marked as ${status}.` }));
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to update status.',
        })
      );
    }
  };

  const handleDownloadPdf = () => {
    openPdf(`/businesses/${activeBusinessId}/invoices/${id}/pdf`)
      .catch(() => dispatch(addToast({ type: 'error', message: 'Could not load PDF.' })));
  };

  const isReceipt = invoice?.type === 'bill' && activeBusiness?.bill_template_id === 'receipt';

  if (isLoading) return <PageLoader />;
  if (!invoice) return <div className="invoice-detail__not-found">Invoice not found.</div>;

  return (
    <div className="invoice-detail" style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 40 }}>
      {/* Back + Action Toolbar */}
      <div className="invoice-detail__toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Back
        </Button>

        <div className="invoice-detail__actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Edit button: ONLY available when draft and permitted */}
          {invoice.status === 'draft' && canEditInvoice(invoice) && (
            <Button
              variant="secondary"
              size="md"
              id="edit-invoice-btn"
              onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
            >
              <Pencil size={15} /> Edit
            </Button>
          )}

          {/* Issue button: ONLY available when draft and permitted */}
          {invoice.status === 'draft' && can('invoice.issue') && (
            <Button
              variant="secondary"
              size="md"
              id="issue-invoice-btn"
              onClick={() => handleStatus('issued')}
              loading={updatingStatus}
            >
              <Send size={15} /> Issue
            </Button>
          )}

          {/* Mark Paid button: ONLY available when issued and permitted */}
          {invoice.status === 'issued' && can('invoice.mark_paid') && (
            <Button
              variant="secondary"
              size="md"
              id="mark-paid-btn"
              onClick={() => handleStatus('paid')}
              loading={updatingStatus}
            >
              <CheckCircle size={15} /> Mark Paid
            </Button>
          )}

          {/* Cancel button: available for draft or issued & permitted, STRICTLY PROHIBITED when paid! */}
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && can('invoice.cancel') && (
            <Button
              variant="ghost"
              size="md"
              style={{ color: 'var(--color-danger)' }}
              id="cancel-invoice-btn"
              onClick={() => setConfirmCancel(true)}
              disabled={updatingStatus}
            >
              <XCircle size={15} /> Cancel
            </Button>
          )}

          {/* Download / Print PDF */}
          <Button variant="primary" size="md" id="download-pdf-btn" onClick={handleDownloadPdf}>
            <Download size={15} /> {isReceipt ? 'Print receipt' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Modern Invoice Card (matching Image 2) */}
      <InvoicePreviewCard invoice={invoice} business={activeBusiness} />

      {/* Cancel confirmation */}
      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          handleStatus('cancelled');
        }}
        loading={updatingStatus}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel ${invoice.invoice_number}? Cancelled invoices are excluded from revenue and cannot be issued or paid.`}
      />
    </div>
  );
}
