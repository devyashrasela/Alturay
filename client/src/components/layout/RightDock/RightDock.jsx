import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Icon from '../../ui/Icon/Icon';
import StatusBadge from '../../ui/StatusBadge/StatusBadge';
import { useGetInvoiceQuery } from '../../../store/api/invoiceApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import './RightDock.css';

/** Lightweight shimmer rows shown while line items are loading */
function ItemsSkeleton() {
  return (
    <div className="dock-invoice__skeleton" aria-busy="true" aria-label="Loading invoice details">
      {[1, 2, 3].map((i) => (
        <div key={i} className="dock-invoice__skeleton-row">
          <span className="dock-invoice__skeleton-bar" style={{ width: '38%' }} />
          <span className="dock-invoice__skeleton-bar" style={{ width: '10%' }} />
          <span className="dock-invoice__skeleton-bar" style={{ width: '18%' }} />
          <span className="dock-invoice__skeleton-bar" style={{ width: '10%' }} />
          <span className="dock-invoice__skeleton-bar" style={{ width: '20%' }} />
        </div>
      ))}
    </div>
  );
}

export default function RightDock({
  open,
  wide,
  type,
  data,
  onToggleWide,
  onClose,
  onEdit,
  onIssue,
  onCancel,
  onDownloadPdf,
  onEditProduct,
  onDeleteProduct,
}) {
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const currentTheme =
    useSelector((s) => s.theme?.currentTheme || s.theme?.current) ||
    (typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme')) ||
    'dark';

  const invoiceId = type === 'invoice' ? data?.id : null;
  const { data: detailData, isFetching: isInvoiceFetching } = useGetInvoiceQuery(
    { businessId: activeBusinessId, invoiceId },
    { skip: !activeBusinessId || !invoiceId }
  );

  const fullInvoice = detailData?.data?.invoice;

  // Determine whether the fetched detail matches the currently selected row.
  // If still fetching for a *different* invoice, use the summary row data
  // from the table click so the header updates instantly.
  const detailMatchesCurrent = fullInvoice && fullInvoice.id === invoiceId;
  const invoiceData = detailMatchesCurrent
    ? {
        ...fullInvoice,
        business: fullInvoice.business || data?.business || activeBusiness,
      }
    : data
      ? { ...data, business: data.business || activeBusiness }
      : null;

  // Line items are only available once the full detail response arrives for this invoice
  const hasLineItems = detailMatchesCurrent && Array.isArray(fullInvoice.items) && fullInvoice.items.length > 0;
  const isLoadingItems = type === 'invoice' && invoiceId && !detailMatchesCurrent;

  const handleEditProduct = onEditProduct || data?.onEdit;
  const handleDeleteProduct = onDeleteProduct || data?.onDelete;

  const getTitle = () => {
    if (type === 'help') return 'Invoices & Bills guide';
    if (type === 'invoice') return invoiceData?.invoice_number || 'Document details';
    if (type === 'notification') return 'Notification details';
    if (type === 'product') return data?.name || 'Product details';
    return 'Details';
  };

  return (
    <aside className="dock" aria-label="Details panel" aria-hidden={!open}>
      {open && (
        <div className="dock-in">
          {/* Dock Header */}
          <div className="dock-h">
            <span className="dock-t" id="dockT">{getTitle()}</span>

            <div className="dock-a" id="dockA">
              {type === 'invoice' && invoiceData && (
                <>
                  {/* Draft: Edit, Issue, Cancel (danger red), PDF */}
                  {invoiceData.status === 'draft' && (
                    <>
                      {onEdit && (
                        <button
                          type="button"
                          className="ib"
                          title={invoiceData.type === 'bill' ? 'Edit bill' : 'Edit invoice'}
                          aria-label={invoiceData.type === 'bill' ? 'Edit bill' : 'Edit invoice'}
                          onClick={() => onEdit(invoiceData)}
                        >
                          <Icon name="pencil" size={15} />
                        </button>
                      )}
                      {onIssue && (
                        <button
                          type="button"
                          className="ib"
                          title={invoiceData.type === 'bill' ? 'Issue bill' : 'Issue invoice'}
                          aria-label={invoiceData.type === 'bill' ? 'Issue bill' : 'Issue invoice'}
                          onClick={() => onIssue(invoiceData)}
                        >
                          <Icon name="send" size={15} />
                        </button>
                      )}
                      {onCancel && (
                        <button
                          type="button"
                          className="ib danger"
                          title={invoiceData.type === 'bill' ? 'Cancel bill' : 'Cancel invoice'}
                          aria-label={invoiceData.type === 'bill' ? 'Cancel bill' : 'Cancel invoice'}
                          onClick={() => onCancel(invoiceData)}
                        >
                          <Icon name="cancel" size={15} />
                        </button>
                      )}
                      {onDownloadPdf && (
                        <button
                          type="button"
                          className="ib"
                          title="Download PDF"
                          aria-label="Download PDF"
                          onClick={() => onDownloadPdf(invoiceData)}
                        >
                          <Icon name="download" size={15} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Issued / Pending / Overdue: Cancel (danger red), PDF */}
                  {(invoiceData.status === 'issued' || invoiceData.status === 'pending' || invoiceData.status === 'overdue') && (
                    <>
                      {onCancel && (
                        <button
                          type="button"
                          className="ib danger"
                          title={invoiceData.type === 'bill' ? 'Cancel bill' : 'Cancel invoice'}
                          aria-label={invoiceData.type === 'bill' ? 'Cancel bill' : 'Cancel invoice'}
                          onClick={() => onCancel(invoiceData)}
                        >
                          <Icon name="cancel" size={15} />
                        </button>
                      )}
                      {onDownloadPdf && (
                        <button
                          type="button"
                          className="ib"
                          title="Download PDF"
                          aria-label="Download PDF"
                          onClick={() => onDownloadPdf(invoiceData)}
                        >
                          <Icon name="download" size={15} />
                        </button>
                      )}
                    </>
                  )}

                  {/* Paid / Cancelled: PDF only */}
                  {(invoiceData.status === 'paid' || invoiceData.status === 'cancelled') && onDownloadPdf && (
                    <button
                      type="button"
                      className="ib"
                      title="Download PDF"
                      aria-label="Download PDF"
                      onClick={() => onDownloadPdf(invoiceData)}
                    >
                      <Icon name="download" size={15} />
                    </button>
                  )}
                </>
              )}

            {type === 'notification' && data && (
              <>
                <button
                  type="button"
                  className="btn sm primary"
                  onClick={() => {
                    onClose();
                    navigate(`/invoices/${data.id}`);
                  }}
                >
                  <Icon name="file" size={14} />
                  <span>View invoice</span>
                </button>
                {onDownloadPdf && (
                  <button
                    type="button"
                    className="ib"
                    title="Download PDF"
                    aria-label="Download PDF"
                    onClick={() => onDownloadPdf(data)}
                  >
                    <Icon name="download" size={15} />
                  </button>
                )}
              </>
            )}

            {type === 'product' && data && (
              <>
                {handleEditProduct && (
                  <button
                    type="button"
                    className="ib"
                    title="Edit product"
                    aria-label="Edit product"
                    onClick={() => handleEditProduct(data)}
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                )}
                {handleDeleteProduct && (
                  <button
                    type="button"
                    className="ib danger"
                    title="Delete product"
                    aria-label="Delete product"
                    onClick={() => handleDeleteProduct(data)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </>
            )}

            <div className="vr" />

            <button
              type="button"
              className="ib"
              id="dockX"
              aria-label={wide ? 'Collapse panel' : 'Expand panel'}
              title={wide ? 'Collapse panel' : 'Expand panel'}
              onClick={onToggleWide}
            >
              <Icon name={wide ? 'shrink' : 'expand'} size={15} />
            </button>

            <button
              type="button"
              className="ib"
              id="dockC"
              aria-label="Close panel"
              title="Close panel"
              onClick={onClose}
            >
              <Icon name="xmark" size={16} />
            </button>
          </div>
        </div>

        {/* Dock Body */}
        <div className="dock-b">
          {/* Help Guide */}
          {type === 'help' && (
            <div className="hb">
              <h2>Invoices &amp; Bills guide</h2>
              <p>
                This page lists every invoice (sent to customers) and bill (received from vendors)
                for the active business. Click any row in the table to inspect full details in this panel.
              </p>

              <div className="st">
                <StatusBadge status="paid" />
                <div>
                  <b>Paid</b>
                  <p>Payment has been recorded in full. The document is finalized and archived.</p>
                </div>
              </div>

              <div className="st">
                <StatusBadge status="issued" />
                <div>
                  <b>Issued</b>
                  <p>Sent to the customer with an active due date. Ready to record payments or send reminders.</p>
                </div>
              </div>

              <div className="st">
                <StatusBadge status="pending" />
                <div>
                  <b>Pending</b>
                  <p>Awaiting customer approval or verification before formal issuance.</p>
                </div>
              </div>

              <div className="st">
                <StatusBadge status="overdue" />
                <div>
                  <b>Overdue</b>
                  <p>Due date has passed without full payment. Requires immediate follow-up.</p>
                </div>
              </div>

              <div className="st">
                <StatusBadge status="draft" />
                <div>
                  <b>Draft</b>
                  <p>Editable draft document. Not yet issued or visible to external customers.</p>
                </div>
              </div>

              <div className="st">
                <StatusBadge status="cancelled" />
                <div>
                  <b>Cancelled</b>
                  <p>Voided document with zero financial liability.</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Details */}
          {type === 'notification' && data && (
            <div className="dock-notif">
              <div className={`dock-notif__banner ${data.overdue ? 'dock-notif__banner--warn' : ''}`}>
                <div className="dock-notif__icon">
                  <Icon name="file" size={20} />
                </div>
                <div>
                  <div className="dock-notif__heading">
                    {data.overdue ? 'Payment Overdue Alert' : 'Invoice Payment Awaiting'}
                  </div>
                  <div className="dock-notif__desc">
                    {data.overdue
                      ? `Invoice ${data.invoice_number} is overdue. The payment was due on ${formatDate(data.due_date)}.`
                      : `Invoice ${data.invoice_number} is currently issued and payment is expected by ${formatDate(data.due_date)}.`}
                  </div>
                </div>
              </div>

              <div className="mini">
                <h4>Invoice Summary</h4>
                <div className="kv">
                  <span>Document</span>
                  <span style={{ fontWeight: 600 }}>{data.invoice_number}</span>
                </div>
                <div className="kv">
                  <span>Customer</span>
                  <span>{data.customer_name || 'Walk-in customer'}</span>
                </div>
                <div className="kv">
                  <span>Total amount</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {formatCurrency(data.total_amount, data.business?.currency)}
                  </span>
                </div>
                <div className="kv">
                  <span>Issue date</span>
                  <span>{formatDate(data.issue_date)}</span>
                </div>
                <div className="kv">
                  <span>Due date</span>
                  <span style={{ color: data.overdue ? 'var(--danger)' : 'var(--text)' }}>
                    {formatDate(data.due_date)}
                  </span>
                </div>
                <div className="kv">
                  <span>Status</span>
                  <StatusBadge status={data.overdue ? 'overdue' : (data.status || 'issued')} />
                </div>
              </div>

              <div className="mini">
                <h4>Recommended Actions</h4>
                <p>
                  Review the document to reconcile payments, download a PDF receipt, or send a reminder notice.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn primary full"
                    onClick={() => {
                      onClose();
                      navigate(`/invoices/${data.id}`);
                    }}
                  >
                    Open invoice details
                  </button>
                  {onDownloadPdf && (
                    <button
                      type="button"
                      className="btn full"
                      onClick={() => onDownloadPdf(data)}
                    >
                      Download PDF copy
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Details */}
          {type === 'product' && data && (
            <div className="dock-product">
              <div className="mini">
                <h4>{data.name}</h4>
                <div className="kv">
                  <span>Unit price</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {formatCurrency(data.unit_price, data.business?.currency)}
                  </span>
                </div>
                <div className="kv">
                  <span>Tax rate</span>
                  <span>{data.tax_rate}%</span>
                </div>
                <div className="kv">
                  <span>SKU</span>
                  <span>{data.sku || '—'}</span>
                </div>
                <div className="kv">
                  <span>Unit</span>
                  <span>{data.unit || 'pcs'}</span>
                </div>
              </div>

              {data.description && (
                <div className="mini">
                  <h4>Description</h4>
                  <p>{data.description}</p>
                </div>
              )}

              <div className="mini">
                <h4>Actions</h4>
                <p>Modify product pricing, tax configuration, or inventory details.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {handleEditProduct && (
                    <button
                      type="button"
                      className="btn primary full"
                      onClick={() => handleEditProduct(data)}
                    >
                      Edit product
                    </button>
                  )}
                  {handleDeleteProduct && (
                    <button
                      type="button"
                      className="btn full"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDeleteProduct(data)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Full Invoice Document (Flat, clean, unboxed) */}
          {type === 'invoice' && invoiceData && (
            <div className="dock-invoice">
              <div className="dock-invoice__header">
                <div className="dock-invoice__top">
                  <div className="dock-invoice__brand">
                    <img
                      className="dock-brand-logo"
                      src={invoiceData.business?.logo_url || (currentTheme === 'light' ? '/alturay_dark.png' : '/alturay_light.png')}
                      alt={invoiceData.business?.name || 'Alturay'}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="dock-invoice__identity">
                      <div className="dock-invoice__title-row">
                        <h2>{invoiceData.invoice_number}</h2>
                        <StatusBadge status={invoiceData.status} />
                      </div>
                      <div className="dock-invoice__sub">
                        {invoiceData.type === 'bill' ? 'Vendor Bill' : 'Customer Invoice'} · {invoiceData.business?.name || 'Alturay'}
                      </div>
                    </div>
                  </div>

                  <div className="dock-invoice__dates">
                    <div className="dock-invoice__date-row">
                      <span className="dock-invoice__date-label">Issue date:</span>
                      <b className="dock-invoice__date-value">{formatDate(invoiceData.issue_date)}</b>
                    </div>
                    {invoiceData.due_date && (
                      <div className="dock-invoice__date-row">
                        <span className="dock-invoice__date-label">Due date:</span>
                        <b className="dock-invoice__date-value">{formatDate(invoiceData.due_date)}</b>
                      </div>
                    )}
                  </div>
                </div>

                <div className="dock-invoice__parties">
                  <div className="dock-invoice__party">
                    <h5>FROM</h5>
                    <b>{invoiceData.business?.name || 'Alturay Studio'}</b>
                    {invoiceData.business?.email && <p>{invoiceData.business.email}</p>}
                    {invoiceData.business?.phone && <p>Phone: {invoiceData.business.phone}</p>}
                    {(invoiceData.business?.address_line1 || invoiceData.business?.city) && (
                      <p>
                        {[
                          invoiceData.business.address_line1,
                          invoiceData.business.address_line2,
                          invoiceData.business.city,
                          invoiceData.business.state,
                          invoiceData.business.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {(invoiceData.business?.tax_id || invoiceData.business?.gstin) && (
                      <p>GSTIN / Tax ID: {invoiceData.business.tax_id || invoiceData.business.gstin}</p>
                    )}
                  </div>

                  <div className="dock-invoice__party">
                    <h5>{invoiceData.type === 'bill' ? 'VENDOR' : 'BILLED TO'}</h5>
                    <b>{invoiceData.customer_name || invoiceData.customer?.name || (invoiceData.type === 'bill' ? 'Vendor' : 'Walk-in customer')}</b>
                    {(invoiceData.customer_phone || invoiceData.customer?.phone) && (
                      <p>Phone: {invoiceData.customer_phone || invoiceData.customer?.phone}</p>
                    )}
                    {(invoiceData.customer_email || invoiceData.customer?.email) && (
                      <p>{invoiceData.customer_email || invoiceData.customer?.email}</p>
                    )}
                    {(invoiceData.customer_address || invoiceData.customer?.address || invoiceData.customer?.address_line1 || invoiceData.customer?.city) && (
                      <p>
                        {invoiceData.customer_address ||
                          invoiceData.customer?.address ||
                          [
                            invoiceData.customer?.address_line1,
                            invoiceData.customer?.address_line2,
                            invoiceData.customer?.city,
                            invoiceData.customer?.state,
                            invoiceData.customer?.pincode || invoiceData.customer?.postal_code,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                      </p>
                    )}
                    {(invoiceData.customer?.tax_id || invoiceData.customer?.gstin) && (
                      <p>GSTIN: {invoiceData.customer.tax_id || invoiceData.customer.gstin}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Full-Width Line-Items Table */}
              <div className="dock-invoice__body">
                {isLoadingItems ? (
                  <ItemsSkeleton />
                ) : (
                  <>
                    <table className="dock-invoice__table">
                      <colgroup>
                        <col style={{ width: '36%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '22%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Billing items</th>
                          <th className="num">Qty</th>
                          <th className="num">Rate</th>
                          <th className="num">Tax</th>
                          <th className="num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoiceData.items || []).map((it, idx) => {
                          const qty = Number(it.quantity || 0);
                          const rate = Number(it.unit_price || 0);
                          const taxRate = Number(it.tax_rate || 0);
                          const base = qty * rate;
                          const tax = (base * taxRate) / 100;
                          const lineTotal = it.line_total != null ? Number(it.line_total) : it.total != null ? Number(it.total) : base + tax;
                          return (
                            <tr key={it.id || idx}>
                              <td>{it.item_name || it.product_name || it.name || it.description || 'Billing item'}</td>
                              <td className="num">{qty}</td>
                              <td className="num">{formatCurrency(rate, invoiceData.business?.currency || activeBusiness?.currency)}</td>
                              <td className="num">{taxRate}%</td>
                              <td className="num">{formatCurrency(lineTotal, invoiceData.business?.currency || activeBusiness?.currency)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Totals Summary */}
                    <div className="dock-invoice__totals">
                      <div>
                        <span>Subtotal</span>
                        <span>{formatCurrency(invoiceData.subtotal ?? (Number(invoiceData.total_amount || 0) - Number(invoiceData.tax_total || 0)), invoiceData.business?.currency || activeBusiness?.currency)}</span>
                      </div>
                      {invoiceData.discount_amount > 0 && (
                        <div>
                          <span>Discount</span>
                          <span>-{formatCurrency(invoiceData.discount_amount, invoiceData.business?.currency || activeBusiness?.currency)}</span>
                        </div>
                      )}
                      {invoiceData.tax_total !== undefined && (
                        <div>
                          <span>Tax</span>
                          <span>{formatCurrency(invoiceData.tax_total, invoiceData.business?.currency || activeBusiness?.currency)}</span>
                        </div>
                      )}
                      <div className="dock-invoice__total-row">
                        <span>Total</span>
                        <span>{formatCurrency(invoiceData.total_amount, invoiceData.business?.currency || activeBusiness?.currency)}</span>
                      </div>
                    </div>
                  </>
                )}

                {invoiceData.notes && (
                  <div className="dock-invoice__notes">
                    <div className="dock-invoice__notes-title">
                      Notes / Payment Terms
                    </div>
                    <p>{invoiceData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </aside>
  );
}
