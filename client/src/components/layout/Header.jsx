import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Menu,
  CheckCircle2,
  Clock3,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { isOverdue } from '../../utils/invoiceStatus';
import WorkspaceSwitcher from './WorkspaceSwitcher';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/invoices': 'Invoices & Bills',
  '/invoices/new': 'Create Invoice',
  '/settings': 'Business Settings',
  '/businesses': 'Your Businesses',
};

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeBusinessId, activeBusiness } = useSelector((state) => state.business);

  const [openMenu, setOpenMenu] = useState(null); // 'notifications'
  const headerRef = useRef(null);

  const { data: recentData } = useGetRecentInvoicesQuery(activeBusinessId, { skip: !activeBusinessId });
  const recent = recentData?.data?.invoices || [];

  // Notifications: outstanding invoices (issued / overdue), most relevant first
  const outstanding = recent.filter((inv) => inv.type === 'invoice' && inv.status === 'issued');
  const sortedOutstanding = [...outstanding].sort((a, b) => {
    if (isOverdue(b) !== isOverdue(a)) return isOverdue(b) ? 1 : -1;
    return new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');
  });
  const notifications = sortedOutstanding.slice(0, 5);
  const overdueCount = outstanding.filter((inv) => isOverdue(inv)).length;

  const staticTitle = pageTitles[location.pathname];
  const pageTitle =
    staticTitle || (/^\/invoices\/[^/]+$/.test(location.pathname) ? 'Invoice Details' : 'Alturay');

  // Global menu behavior: outside click + Escape
  useEffect(() => {
    if (!openMenu) return undefined;
    const handlePointer = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpenMenu(null);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenu]);

  // Close menus on navigation (adjust state during render when the path changes)
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setOpenMenu(null);
  }

  const toggleMenu = (menu) => setOpenMenu((open) => (open === menu ? null : menu));

  return (
    <div className="app-layout__header">
      <header className="header" ref={headerRef}>
        <div className="header__left">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="header__icon-btn header__icon-btn--mobile"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="header__title">{pageTitle}</h1>
        </div>

        <div className="header__right">
          {/* Notifications */}
          <div className="header__menu-anchor">
            <button
              type="button"
              className={`header__icon-btn ${notifications.length ? 'header__icon-btn--dot' : ''}`}
              onClick={() => toggleMenu('notifications')}
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {openMenu === 'notifications' && (
              <div className="header__menu header__menu--wide" role="dialog">
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
                          onClick={() => { setOpenMenu(null); navigate(`/invoices/${inv.id}`); }}
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
                  onClick={() => { setOpenMenu(null); navigate('/invoices'); }}
                >
                  View all invoices
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <WorkspaceSwitcher onOpen={() => setOpenMenu(null)} />
        </div>
      </header>
    </div>
  );
}
