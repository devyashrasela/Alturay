import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useGetRecentInvoicesQuery } from '../../../store/api/dashboardApi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { isOverdue } from '../../../utils/invoiceStatus';
import Icon from '../../ui/Icon/Icon';
import './NotificationsMenu.css';

export default function NotificationsMenu({ onOpenDock }) {
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

  const handleNotificationClick = (inv) => {
    setOpen(false);
    const overdue = isOverdue(inv);
    onOpenDock?.('notification', {
      ...inv,
      overdue,
      business: activeBusiness,
    });
  };

  return (
    <div className="notif-anchor" ref={anchorRef}>
      <button
        type="button"
        className={`notif-btn ${notifications.length ? 'notif-btn--dot' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="help" size={17} style={{ display: 'none' }} />
        <svg
          className="ic"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      </button>

      {open && (
        <div className="notif-pop" role="dialog" aria-label="Notifications">
          <div className="notif-head">
            <span>Notifications</span>
            {overdueCount > 0 && (
              <span className="notif-head__badge">
                {overdueCount} overdue
              </span>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Icon name="check" size={20} />
                <span>You're all caught up</span>
                <span style={{ fontSize: 12 }}>No outstanding invoices</span>
              </div>
            ) : (
              notifications.map((inv) => {
                const overdue = isOverdue(inv);
                return (
                  <button
                    type="button"
                    key={inv.id}
                    className="notif-item"
                    onClick={() => handleNotificationClick(inv)}
                  >
                    <div className={`notif-tile ${overdue ? 'notif-tile--warn' : ''}`}>
                      <Icon name="file" size={16} />
                    </div>
                    <div className="notif-body">
                      <div className="notif-title">{inv.invoice_number}</div>
                      <div className="notif-sub">
                        {inv.customer_name || 'Customer'} &middot; {formatCurrency(inv.total_amount, activeBusiness?.currency)}
                      </div>
                    </div>
                    {overdue && (
                      <span className="soon" style={{ color: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}>
                        OVERDUE
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
