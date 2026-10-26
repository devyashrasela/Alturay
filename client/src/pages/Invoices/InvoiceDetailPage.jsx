import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, CheckCircle, XCircle, Send } from 'lucide-react';
import { useGetInvoiceQuery, useUpdateInvoiceStatusMutation } from '../../store/api/invoiceApi';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import ConfirmDialog from '../../components/ui/Modal/ConfirmDialog';
import StatusBadge from '../../components/ui/Badge/StatusBadge';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { effectiveStatus } from '../../utils/invoiceStatus';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { data, isLoading } = useGetInvoiceQuery({ businessId: activeBusinessId, invoiceId: id }, { skip: !activeBusinessId });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const invoice = data?.data?.invoice;

  const handleStatus = async (status) => {
    try {
      await updateStatus({ businessId: activeBusinessId, invoiceId: id, status }).unwrap();
      dispatch(addToast({ type: 'success', message: `Invoice marked as ${status}.` }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update status.' }));
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/businesses/${activeBusinessId}/invoices/${id}/pdf`, '_blank');
  };

  if (isLoading) return <PageLoader />;
  if (!invoice) return <div className="invoice-detail__not-found">Invoice not found.</div>;

  return (
    <div className="invoice-detail">
      {/* Back + Actions */}
      <div className="invoice-detail__toolbar">
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="invoice-detail__actions">
          {invoice.status === 'draft' && (
            <Button variant="secondary" size="md" id="issue-invoice-btn" onClick={() => handleStatus('issued')} loading={updatingStatus}>
              <Send size={15} /> Issue
            </Button>
          )}
          {invoice.status === 'issued' && (
            <Button variant="secondary" size="md" id="mark-paid-btn" onClick={() => handleStatus('paid')} loading={updatingStatus}>
              <CheckCircle size={15} /> Mark Paid
            </Button>
          )}
          {invoice.status !== 'cancelled' && (
            <Button variant="ghost" size="md" style={{ color: 'var(--color-danger)' }} id="cancel-invoice-btn" onClick={() => setConfirmCancel(true)}>
              <XCircle size={15} /> Cancel
            </Button>
          )}
          <Button variant="primary" size="md" id="download-pdf-btn" onClick={handleDownloadPdf}>
            <Download size={15} /> Download PDF
          </Button>
        </div>
      </div>

      <Card>
        {/* Header */}
        <div className="invoice-hero">
          <div className="invoice-hero__top">
            <div>
              <div className="invoice-hero__number-row">
                <h2 className="invoice-hero__number">{invoice.invoice_number}</h2>
                <StatusBadge status={effectiveStatus(invoice)} />
              </div>
              <p className="invoice-hero__meta">
                {invoice.type === 'invoice' ? 'Invoice' : 'Bill'} · {activeBusiness?.name}
              </p>
            </div>
            <div className="invoice-hero__dates">
              <div>
                <div className="invoice-hero__date-label">Issue Date</div>
                <div className="invoice-hero__date-value">{formatDate(invoice.issue_date)}</div>
              </div>
              {invoice.due_date && (
                <div>
                  <div className="invoice-hero__date-label">Due Date</div>
                  <div className="invoice-hero__date-value">{formatDate(invoice.due_date)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="invoice-detail__bill-to">
          <div className="invoice-detail__label">Bill To</div>
          <div className="invoice-detail__customer">{invoice.customer_name}</div>
          {invoice.customer_phone && <div className="invoice-detail__customer-sub">{invoice.customer_phone}</div>}
        </div>

        {/* Line Items Table */}
        <div className="invoice-detail__items table-flush-x table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Disc</th>
                <th style={{ textAlign: 'right' }}>Tax</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                  <td className="num" style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.quantity}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price, activeBusiness?.currency)}</td>
                  <td className="num" style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {parseFloat(item.item_discount_percent) > 0 ? `${item.item_discount_percent}%` : parseFloat(item.item_discount_amount) > 0 ? formatCurrency(item.item_discount_amount) : '—'}
                  </td>
                  <td className="num" style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.tax_rate}%</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.line_total, activeBusiness?.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-detail__totals">
          <div className="invoice-detail__totals-inner">
            {[
              { label: 'Subtotal', value: invoice.subtotal },
              { label: 'Tax', value: invoice.tax_total },
              { label: 'Discount', value: parseFloat(invoice.discount_amount) + parseFloat(invoice.subtotal) * parseFloat(invoice.discount_percent) / 100, negative: true },
            ].map(({ label, value, negative }) =>
              parseFloat(value) > 0 ? (
                <div className="summary-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }} key={label}>
                  <span>{label}</span>
                  <span className={`summary-row__value ${negative ? 'summary-row__value--neg' : ''}`}>
                    {negative ? '−' : ''}{formatCurrency(value, activeBusiness?.currency)}
                  </span>
                </div>
              ) : null
            )}
            <div className="invoice-detail__total-row">
              <span className="invoice-detail__total-label">Total</span>
              <span className="invoice-detail__total-value num">
                {formatCurrency(invoice.total_amount, activeBusiness?.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="invoice-detail__notes">
            <div className="invoice-detail__label">Notes</div>
            <p className="invoice-detail__notes-text">{invoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Cancel confirmation — cancelling is destructive and must not be immediate */}
      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => { setConfirmCancel(false); handleStatus('cancelled'); }}
        loading={updatingStatus}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel ${invoice.invoice_number}? Cancelled invoices are excluded from revenue and can't be issued again.`}
      />
    </div>
  );
}
