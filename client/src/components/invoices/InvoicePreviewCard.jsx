import StatusBadge from '../ui/Badge/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { effectiveStatus } from '../../utils/invoiceStatus';
import './InvoicePreviewCard.css';

export default function InvoicePreviewCard({
  invoice,
  business,
  className = '',
}) {
  if (!invoice) return null;

  const status = effectiveStatus(invoice);
  const currency = business?.currency || 'INR';

  // Format business address
  const businessAddress = [
    business?.address_line1,
    business?.address_line2,
    business?.city,
    business?.state,
    business?.pincode,
  ].filter(Boolean).join(', ') || business?.address || '';

  // Format customer address
  const customer = invoice.customer;
  const customerAddress = customer?.formatted_address || [
    customer?.address_line1,
    customer?.address_line2,
    customer?.city,
    customer?.state,
    customer?.pincode,
  ].filter(Boolean).join(', ') || '';

  const isBill = invoice.type === 'bill';

  return (
    <article className={`inv-card ${className}`.trim()} aria-label={`${isBill ? 'Bill' : 'Invoice'} ${invoice.invoice_number}`}>
      {/* Mesh Gradient Banner (Image 2) */}
      <div className="inv-card__banner">
        <div className="inv-card__banner-top">
          {business?.logo_url ? (
            <img
              src={business.logo_url}
              alt={business?.name || 'Business Logo'}
              className="inv-card__business-logo"
            />
          ) : (
            <div className="inv-card__logo-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          )}

          <div className="inv-card__dates">
            <div className="inv-card__date-row">
              Issue Date: <span>{formatDate(invoice.issue_date)}</span>
            </div>
            {invoice.due_date && (
              <div className="inv-card__date-row">
                Due Date: <span>{formatDate(invoice.due_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Number + Status Badge */}
        <div className="inv-card__number-wrap">
          <div className="inv-card__number-row">
            <h2 className="inv-card__number">{invoice.invoice_number}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="inv-card__subtitle">
            {isBill ? 'Vendor Bill' : 'Customer Invoice'} · {business?.name}
          </p>
        </div>

        {/* Parties (From & Billed to) */}
        <div className="inv-card__parties">
          <div>
            <div className="inv-card__party-label">From</div>
            <div className="inv-card__party-name">{business?.name}</div>
            {business?.email && (
              <div className="inv-card__party-meta">{business.email}</div>
            )}
            {businessAddress && (
              <div className="inv-card__party-meta">{businessAddress}</div>
            )}
            {business?.tax_id && (
              <div className="inv-card__party-meta" style={{ fontSize: 11, opacity: 0.85 }}>
                GSTIN / Tax ID: {business.tax_id}
              </div>
            )}
          </div>

          <div>
            <div className="inv-card__party-label">{isBill ? 'Vendor' : 'Billed to'}</div>
            <div className="inv-card__party-name">{invoice.customer_name || 'Walk-in Customer'}</div>
            {invoice.customer_phone && (
              <div className="inv-card__party-meta">{invoice.customer_phone}</div>
            )}
            {customer?.email && (
              <div className="inv-card__party-meta">{customer.email}</div>
            )}
            {customerAddress && (
              <div className="inv-card__party-meta">{customerAddress}</div>
            )}
          </div>
        </div>
      </div>

      {/* Body / Line Items Table (Image 2) */}
      <div className="inv-card__body">
        <div className="inv-card__table-wrap">
          <table className="inv-card__table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Billing Items</th>
                <th className="num" style={{ width: '12%' }}>Qty</th>
                <th className="num" style={{ width: '15%' }}>Rate</th>
                <th className="num" style={{ width: '12%' }}>Tax</th>
                <th className="num" style={{ width: '16%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="inv-card__item-name">{item.item_name}</div>
                    {item.product?.sku && (
                      <div className="inv-card__item-desc">SKU: {item.product.sku}</div>
                    )}
                  </td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{formatCurrency(item.unit_price, currency)}</td>
                  <td className="num">{parseFloat(item.tax_rate) > 0 ? `${item.tax_rate}%` : '0%'}</td>
                  <td className="num" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {formatCurrency(item.line_total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Highlighted Total Pill (Image 2) */}
        <div className="inv-card__highlight-total">
          <span className="inv-card__highlight-label">Sub Total (inc tax)</span>
          <span className="inv-card__highlight-value">
            {formatCurrency(invoice.total_amount, currency)}
          </span>
        </div>

        {/* Terms & Conditions / Notes (Image 2) */}
        {(invoice.notes || invoice.due_date) && (
          <div className="inv-card__footer">
            <div className="inv-card__terms-title">Terms &amp; Conditions</div>
            <p className="inv-card__terms-text">
              {invoice.notes ||
                `Please complete payment within 15 days of receiving this ${isBill ? 'bill' : 'invoice'}.`}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
