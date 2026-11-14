import Icon from '../../../components/ui/Icon/Icon';
import { formatDate } from '../../../utils/formatDate';
import { formatCurrency } from '../../../utils/formatCurrency';
import { effectiveStatus } from '../../../utils/invoiceStatus';

export default function DashboardRecentTable({
  title = 'Recent invoices / bills',
  invoices = [],
  currency,
  isStaff = false,
  onRowClick,
  onEdit,
  onIssue,
  onPdf,
  onViewAll,
  updatingStatus = false,
}) {
  return (
    <section className="dcard dpad dtbl" aria-labelledby="dashRecentHeading">
      <div className="dh">
        <h2 id="dashRecentHeading">{title}</h2>
        <button
          type="button"
          className="dmore"
          aria-label="View all invoices"
          onClick={onViewAll}
          title="View all invoices"
        >
          <Icon name="ellipsis" size={18} />
        </button>
      </div>

      <div className="db-wrap">
        <table className="db">
          <thead>
            <tr>
              <th scope="col">Document</th>
              <th scope="col">{isStaff ? 'Customer' : 'Customer / vendor'}</th>
              <th scope="col">Status</th>
              <th scope="col">Due date</th>
              <th scope="col" className="num">Amount</th>
              {isStaff && <th scope="col" style={{ width: 110, textAlign: 'right', paddingRight: 14 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              invoices.map((inv) => {
                const statusKey = effectiveStatus(inv);
                const scClass = `sc sc-${statusKey.toLowerCase()}`;
                const isDraft = inv.status === 'draft';
                const dateStr = inv.due_date ? formatDate(inv.due_date) : (inv.issue_date ? formatDate(inv.issue_date) : '—');
                const customerName = inv.customer_name || inv.customer?.name || '—';
                const formattedAmount = formatCurrency(inv.total_amount, currency);

                return (
                  <tr
                    key={inv.id || inv.invoice_number}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onRowClick?.(inv.id)}
                  >
                    <td>{inv.invoice_number}</td>
                    <td>{customerName}</td>
                    <td>
                      <span className={scClass}>{statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}</span>
                    </td>
                    <td>{dateStr}</td>
                    <td className="num price">{formattedAmount}</td>
                    {isStaff && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <div className="act">
                          {isDraft && onEdit && (
                            <button
                              type="button"
                              title="Edit draft"
                              onClick={() => onEdit(inv.id)}
                            >
                              <Icon name="edit" size={14} />
                            </button>
                          )}
                          {isDraft && onIssue && (
                            <button
                              type="button"
                              title="Issue invoice"
                              disabled={updatingStatus}
                              onClick={() => onIssue(inv.id)}
                            >
                              <Icon name="check" size={14} />
                            </button>
                          )}
                          {onPdf && (
                            <button
                              type="button"
                              title="View / Print PDF"
                              onClick={() => onPdf(inv.id)}
                            >
                              <Icon name="filep" size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={isStaff ? 6 : 5}
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    color: 'var(--muted)',
                  }}
                >
                  {isStaff ? 'No bills or invoices generated yet' : 'No recent invoices or bills'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
