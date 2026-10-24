import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Plus,
  CheckCircle2,
  Clock3,
  FileText,
  Building2,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { useGetRecentInvoicesQuery } from '../../store/api/dashboardApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { isOverdue } from '../../utils/invoiceStatus';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/invoices': 'Invoices & Bills',
  '/invoices/new': 'Create Invoice',
  '/settings': 'Business Settings',
  '/businesses': 'Your Businesses',
};

// Route-specific primary action surfaced in the header
const CONTEXT_ACTIONS = {
  '/dashboard': { id: 'create-invoice-btn', label: 'New Invoice', path: '/invoices/new?type=invoice' },
  '/invoices': { id: 'create-invoice-btn', label: 'New Invoice', path: '/invoices/new?type=invoice' },
};

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { activeBusinessId, activeBusiness } = useSelector((state) => state.business);

  const [openMenu, setOpenMenu] = useState(null); // 'search' | 'notifications' | 'profile'
  const [searchValue, setSearchValue] = useState('');
  const headerRef = useRef(null);

  const { data: recentData } = useGetRecentInvoicesQuery(activeBusinessId, { skip: !activeBusinessId });
  const recent = recentData?.data?.invoices || [];

  const action = CONTEXT_ACTIONS[location.pathname];

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

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/invoices?search=${encodeURIComponent(q)}`);
    setOpenMenu(null);
    setSearchValue('');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

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
          {action && (
            <button
              type="button"
              className="btn btn--primary btn--sm header__icon-btn--desktop"
              id={action.id}
              onClick={() => navigate(action.path)}
            >
              <Plus size={16} />
              {action.label}
            </button>
          )}

          {/* Expanding search */}
          {openMenu === 'search' ? (
            <form className="header__search-field" onSubmit={handleSearchSubmit}>
              <Search size={16} color="var(--color-text-muted)" />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Search invoices...`}
                onKeyDown={(e) => { if (e.key === 'Escape') setOpenMenu(null); }}
              />
            </form>
          ) : (
            <button
              type="button"
              className="header__icon-btn header__icon-btn--desktop"
              onClick={() => toggleMenu('search')}
              aria-label="Search invoices"
            >
              <Search size={18} />
            </button>
          )}

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

          {/* Profile */}
          <div className="header__menu-anchor">
            <button
              type="button"
              className="header__avatar"
              onClick={() => toggleMenu('profile')}
              aria-label="Open profile menu"
            >
              {initials}
            </button>

            {openMenu === 'profile' && (
              <div className="header__menu header__menu--sm" role="dialog">
                <div className="header__profile-head">
                  <div className="header__profile-avatar">{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="header__profile-name">{user?.name}</div>
                    <div className="header__profile-email">{user?.email}</div>
                  </div>
                </div>
                <div className="header__menu-list">
                  <button
                    type="button"
                    className="header__menu-item"
                    onClick={() => { setOpenMenu(null); navigate('/businesses'); }}
                  >
                    <div className="icon-tile icon-tile--orange" style={{ width: 32, height: 32 }}>
                      <Building2 size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>Your businesses</div>
                      <div className="header__menu-sub">Switch or add a business</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="header__menu-item"
                    onClick={() => { setOpenMenu(null); navigate('/settings'); }}
                  >
                    <div className="icon-tile icon-tile--blue" style={{ width: 32, height: 32 }}>
                      <SettingsIcon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>Business settings</div>
                      <div className="header__menu-sub">Profile, tax and currency</div>
                    </div>
                  </button>
                  <div className="header__menu-divider" />
                  <button
                    type="button"
                    className="header__menu-item header__menu-item--danger"
                    onClick={handleLogout}
                    id="header-logout-btn"
                  >
                    <LogOut size={16} />
                    <span style={{ fontWeight: 500 }}>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
