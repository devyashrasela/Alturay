import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronRight, Clock3, FileText } from 'lucide-react';
import { useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { isOverdue } from '../../utils/invoiceStatus';

/* Outstanding-invoice notifications, moved out of the old Header unchanged
   in behaviour: overdue first, then by due date, max five. */
export default function NotificationsMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeBusinessId, activeBusiness } = useSelector((state) => state.business);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const { data } = useGetRecentInvoicesQuery(activeBusinessId, { skip: !activeBusinessId });
  const recent = data?.data?.invoices || [];

  const outstanding = recent.filter((inv) => inv.type === 'invoice' && inv.status === 'issued');
  const sorted = [...outstanding].sort((a, b) => {
    if (isOverdue(b) !== isOverdue(a)) return isOverdue(b) ? 1 : -1;
    return new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');
  });
  const notifications = sorted.slice(0, 5);
  const overdueCount = outstanding.filter((inv) => isOverdue(inv)).length;

  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="header__menu-anchor" ref={anchorRef}>
      <button
        type="button"
        className={`header__icon-btn ${notifications.length ? 'header__icon-btn--dot' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={18} />
      </button>

      {open && (
        <div className="header__menu header__menu--wide" role="dialog" aria-label="Notifications">
          <div className="header__menu-head">
            <span>Notifications</span>
            {overdueCount > 0 && (
              <span style={{ color: 'var(--color-warning-strong)', fontWeight: 600, fontSize: 12 }}>
                {overdueCount} overdue
              </span>
            )}
          </div>
          <div className="header__menu-list">
            {notifications.length === 0 ? (
              <div className="header__menu-empty">
                <CheckCircle2 size={22} color="var(--color-success)" />
                <span>You're all caught up</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  No outstanding invoices
                </span>
              </div>
            ) : (
              notifications.map((inv) => {
                const overdue = isOverdue(inv);
                return (
                  <button
                    type="button"
                    key={inv.id}
                    className="header__menu-item"
                    onClick={() => { setOpen(false); navigate(`/invoices/${inv.id}`); }}
                  >
                    <div className="icon-tile icon-tile--amber" style={{ width: 32, height: 32 }}>
                      {overdue ? <Clock3 size={16} /> : <FileText size={16} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{inv.invoice_number}</div>
                      <div className="header__menu-sub">
                        {inv.customer_name} · {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                      </div>
                    </div>
                    <span className={`badge badge--${overdue ? 'danger' : 'info'}`} style={{ flexShrink: 0 }}>
                      <span className="badge__dot" />
                      {overdue ? 'Overdue' : `Due ${formatDate(inv.due_date)}`}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <button
            type="button"
            className="card-footer-link"
            style={{ width: '100%', padding: '12px 20px' }}
            onClick={() => { setOpen(false); navigate('/invoices'); }}
          >
            View all invoices
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
