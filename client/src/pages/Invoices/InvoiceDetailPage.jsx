import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, CheckCircle, XCircle, Send } from 'lucide-react';
import { useGetInvoiceQuery, useUpdateInvoiceStatusMutation } from '../../store/api/invoiceApi';
import { addToast } from '../../store/slices/uiSlice';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import StatusBadge from '../../components/ui/Badge/StatusBadge';
import { PageLoader } from '../../components/ui/Loader/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { data, isLoading } = useGetInvoiceQuery({ businessId: activeBusinessId, invoiceId: id }, { skip: !activeBusinessId });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();

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
  if (!invoice) return <div style={{ padding: 32, color: 'var(--color-text-muted)' }}>Invoice not found.</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Back + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Back
        </Button>
        <div style={{ display: 'flex', gap: 10 }}>
          {invoice.status === 'draft' && (
            <Button variant="secondary" size="md" onClick={() => handleStatus('issued')} loading={updatingStatus}>
              <Send size={15} /> Issue
            </Button>
          )}
          {invoice.status === 'issued' && (
            <Button variant="secondary" size="md" onClick={() => handleStatus('paid')} loading={updatingStatus}>
              <CheckCircle size={15} /> Mark Paid
            </Button>
          )}
          {invoice.status !== 'cancelled' && (
            <Button variant="ghost" size="md" onClick={() => handleStatus('cancelled')} style={{ color: 'var(--color-danger)' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-primary)' }}>{invoice.invoice_number}</h2>
              <StatusBadge status={invoice.status} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {invoice.type === 'invoice' ? 'Invoice' : 'Bill'} for {activeBusiness?.name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Issue Date</div>
            <div style={{ fontWeight: 600 }}>{formatDate(invoice.issue_date)}</div>
            {invoice.due_date && (
              <>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>Due Date</div>
                <div style={{ fontWeight: 600 }}>{formatDate(invoice.due_date)}</div>
              </>
            )}
          </div>
        </div>

        {/* Bill To */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Bill To</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{invoice.customer_name}</div>
          {invoice.customer_phone && <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{invoice.customer_phone}</div>}
        </div>

        {/* Line Items Table */}
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
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
                  <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price, activeBusiness?.currency)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {parseFloat(item.item_discount_percent) > 0 ? `${item.item_discount_percent}%` : parseFloat(item.item_discount_amount) > 0 ? formatCurrency(item.item_discount_amount) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.tax_rate}%</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.line_total, activeBusiness?.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280 }}>
            {[
              { label: 'Subtotal', value: invoice.subtotal },
              { label: 'Tax', value: invoice.tax_total },
              { label: 'Discount', value: parseFloat(invoice.discount_amount) + parseFloat(invoice.subtotal) * parseFloat(invoice.discount_percent) / 100, negative: true },
            ].map(({ label, value, negative }) =>
              parseFloat(value) > 0 ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span>{label}</span>
                  <span style={{ color: negative ? 'var(--color-danger)' : undefined }}>
                    {negative ? '−' : ''}{formatCurrency(value, activeBusiness?.currency)}
                  </span>
                </div>
              ) : null
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 700, fontSize: 20 }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(invoice.total_amount, activeBusiness?.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Notes</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{invoice.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
