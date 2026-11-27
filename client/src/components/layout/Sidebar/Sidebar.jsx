import { useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import Icon from '../../ui/Icon/Icon';
import WorkspaceSwitcher from '../WorkspaceSwitcher/WorkspaceSwitcher';
import { usePermissions } from '../../../hooks/usePermissions';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggleCollapse, onQuickSearch }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const currentTheme = useSelector((state) => state.theme?.currentTheme) || (typeof document !== 'undefined' && document.documentElement?.getAttribute('data-theme')) || 'dark';
  const { can } = usePermissions();

  // Accordion state
  const [openGroups, setOpenGroups] = useState({
    inventory: pathname.startsWith('/products') || pathname.startsWith('/inventory'),
    billing: true, // open by default as in reference image
    settings: pathname.startsWith('/settings'),
  });

  // Floating flyout state for collapsed rail mode
  const [flyout, setFlyout] = useState(null);
  const flyoutTimerRef = useRef(null);

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showFlyout = (e, groupData) => {
    if (!collapsed) return;
    clearTimeout(flyoutTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setFlyout({
      ...groupData,
      top: Math.max(8, Math.min(rect.top, window.innerHeight - 300)),
      left: rect.right + 8,
    });
  };

  const hideFlyout = () => {
    flyoutTimerRef.current = setTimeout(() => {
      setFlyout(null);
    }, 120);
  };

  // Permission checks
  const canDashboard = can('dashboard.view');
  const canCustomers = can('customer.view');
  const canInvoices = can('invoice.view');
  const canInvoiceCreate = can('invoice.create');
  const canBillingConfig = can('billing.configure');
  const canProducts = can('product.view');
  const canBusinessProfile = can('business.update_profile');
  const canUsers = can('member.view');
  const hasSettingsPerms = canBusinessProfile || canUsers;

  return (
    <aside className="side" aria-label="Primary navigation">
      {/* ── Top Header with Brand Logo & Workspace Switcher ── */}
      <div className="side-top">
        <img
          className="side-logo lg"
          src={currentTheme === 'light' ? '/alturay_dark.png' : '/alturay_light.png'}
          alt="Alturay"
          width="32"
          height="32"
          draggable="false"
        />
        <WorkspaceSwitcher />
      </div>

      {/* ── Navigation Tree ── */}
      <div className="side-scroll">
        <button
          type="button"
          className="qs"
          aria-label="Quick search"
          onClick={() => onQuickSearch?.()}
          title={collapsed ? 'Quick search (⌘K)' : undefined}
        >
          <Icon name="search" size={15} />
          <span className="qt">Quick search…</span>
          <kbd>⌘K</kbd>
        </button>

        <nav id="nav" aria-label="Main menu">
          {/* Dashboard */}
          {canDashboard && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `item ${isActive ? 'active' : ''}`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <Icon name="home" size={16} />
              <span className="lbl">Dashboard</span>
            </NavLink>
          )}

          {/* Inventory Section (Expandable Group) */}
          {canProducts && (
            <div
              className={`grp ${openGroups.inventory ? 'open' : ''}`}
              onMouseEnter={(e) =>
                showFlyout(e, {
                  title: 'Inventory',
                  items: [
                    { label: 'Catalog', sub: 'All products', path: '/products' },
                    { label: 'Summary', sub: 'Overview', soon: true },
                    { label: 'Replenishment', sub: 'Add stock', soon: true },
                    { label: 'Logistics', sub: 'Shipments', soon: true },
                    { label: 'Stocktake', sub: 'Inventories', soon: true },
                    { label: 'Facilities', sub: 'Warehouses', soon: true },
                    { label: 'Analytics', sub: 'Inventory reports', soon: true },
                  ],
                })
              }
              onMouseLeave={hideFlyout}
            >
              <button
                type="button"
                className="item"
                aria-expanded={openGroups.inventory}
                onClick={() => toggleGroup('inventory')}
                title={collapsed ? 'Inventory' : undefined}
              >
                <Icon name="pkg" size={16} />
                <span className="lbl">Inventory</span>
                <Icon
                  name={openGroups.inventory ? 'chevd' : 'right'}
                  size={14}
                  className="chev"
                />
              </button>

              <div className="sublist">
                <NavLink
                  to="/products"
                  className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                >
                  <span>
                    Catalog
                    <small>All products</small>
                  </span>
                </NavLink>
                <button type="button" className="sub dis" disabled>
                  <span>
                    Replenishment
                    <small>Add stock</small>
                  </span>
                  <span className="soon">SOON</span>
                </button>
                <button type="button" className="sub dis" disabled>
                  <span>
                    Logistics
                    <small>Shipments</small>
                  </span>
                  <span className="soon">SOON</span>
                </button>
                <button type="button" className="sub dis" disabled>
                  <span>
                    Stocktake
                    <small>Inventories</small>
                  </span>
                  <span className="soon">SOON</span>
                </button>
                <button type="button" className="sub dis" disabled>
                  <span>
                    Facilities
                    <small>Warehouses</small>
                  </span>
                  <span className="soon">SOON</span>
                </button>
                <button type="button" className="sub dis" disabled>
                  <span>
                    Analytics
                    <small>Inventory reports</small>
                  </span>
                  <span className="soon">SOON</span>
                </button>
              </div>
            </div>
          )}

          {/* Billing Section (Expandable Group) */}
          {canInvoices && (
            <div
              className={`grp ${openGroups.billing ? 'open' : ''}`}
              onMouseEnter={(e) =>
                showFlyout(e, {
                  title: 'Billing',
                  items: [
                    { label: 'Overview', sub: 'Billing dashboard', soon: true },
                    { label: 'Invoices', sub: 'Invoices & bills', path: '/invoices' },
                    canInvoiceCreate && { label: 'Issuance', sub: 'Create new', path: '/invoices/new' },
                    canBillingConfig && { label: 'Layouts', sub: 'Invoice PDF templates', path: '/billing/templates/invoice' },
                    canBillingConfig && { label: 'Formats', sub: 'Bill PDF templates', path: '/billing/templates/bill' },
                    canBillingConfig && { label: 'Preferences', sub: 'Invoice settings', path: '/billing/settings' },
                  ].filter(Boolean),
                })
              }
              onMouseLeave={hideFlyout}
            >
              <button
                type="button"
                className="item"
                aria-expanded={openGroups.billing}
                onClick={() => toggleGroup('billing')}
                title={collapsed ? 'Billing' : undefined}
              >
                <Icon name="file" size={16} />
                <span className="lbl">Billing</span>
                <Icon
                  name={openGroups.billing ? 'chevd' : 'right'}
                  size={14}
                  className="chev"
                />
              </button>

              <div className="sublist">

                <NavLink
                  to="/invoices"
                  end
                  className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                >
                  <span>
                    Invoices
                    <small>Invoices &amp; bills</small>
                  </span>
                </NavLink>

                {canInvoiceCreate && (
                  <NavLink
                    to="/invoices/new"
                    className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                  >
                    <span>
                      Issuance
                      <small>Create new</small>
                    </span>
                  </NavLink>
                )}

                {canBillingConfig && (
                  <>
                    <NavLink
                      to="/billing/templates/invoice"
                      className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                    >
                      <span>
                        Layouts
                        <small>Invoice PDF templates</small>
                      </span>
                    </NavLink>
                    <NavLink
                      to="/billing/templates/bill"
                      className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                    >
                      <span>
                        Formats
                        <small>Bill PDF templates</small>
                      </span>
                    </NavLink>
                    <NavLink
                      to="/billing/settings"
                      className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                    >
                      <span>
                        Preferences
                        <small>Invoice settings</small>
                      </span>
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Customers */}
          {canCustomers && (
            <NavLink
              to="/customers"
              className={({ isActive }) => `item ${isActive ? 'active' : ''}`}
              title={collapsed ? 'Customers' : undefined}
            >
              <Icon name="users" size={16} />
              <span className="lbl">Customers</span>
            </NavLink>
          )}

          {/* Settings Section (Expandable Group) */}
          {hasSettingsPerms && (
            <div
              className={`grp ${openGroups.settings ? 'open' : ''}`}
              onMouseEnter={(e) =>
                showFlyout(e, {
                  title: 'Settings',
                  items: [
                    canBusinessProfile && { label: 'Organization', sub: 'Business profile', path: '/settings' },
                    canUsers && { label: 'Permissions', sub: 'Users & access', path: '/settings/users' },
                  ].filter(Boolean),
                })
              }
              onMouseLeave={hideFlyout}
            >
              <button
                type="button"
                className="item"
                aria-expanded={openGroups.settings}
                onClick={() => toggleGroup('settings')}
                title={collapsed ? 'Settings' : undefined}
              >
                <Icon name="sliders" size={16} />
                <span className="lbl">Settings</span>
                <Icon
                  name={openGroups.settings ? 'chevd' : 'right'}
                  size={14}
                  className="chev"
                />
              </button>

              <div className="sublist">
                {canBusinessProfile && (
                  <NavLink
                    to="/settings"
                    end
                    className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                  >
                    <span>
                      Organization
                      <small>Business profile</small>
                    </span>
                  </NavLink>
                )}
                {canUsers && (
                  <NavLink
                    to="/settings/users"
                    className={({ isActive }) => `sub ${isActive ? 'active' : ''}`}
                  >
                    <span>
                      Permissions
                      <small>Users &amp; access</small>
                    </span>
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* ── Footer with Sidebar Collapse Toggle ── */}
      <div className="side-foot">
        <button
          type="button"
          className="collapse"
          id="collapseBtn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapse}
        >
          <Icon name={collapsed ? 'dright' : 'panel'} size={18} />
        </button>
      </div>

      {/* ── Collapsed Flyout Portal ── */}
      {collapsed && flyout && createPortal(
        <div
          className="side-flyout"
          style={{ top: flyout.top, left: flyout.left }}
          onMouseEnter={() => clearTimeout(flyoutTimerRef.current)}
          onMouseLeave={hideFlyout}
        >
          <div className="side-flyout__head">{flyout.title}</div>
          {flyout.items.map((item) => (
            item.soon ? (
              <button key={item.label} type="button" className="sub dis" disabled>
                <span>
                  {item.label}
                  <small>{item.sub}</small>
                </span>
                <span className="soon">SOON</span>
              </button>
            ) : (
              <button
                key={item.label}
                type="button"
                className={`sub ${pathname === item.path ? 'active' : ''}`}
                onClick={() => {
                  setFlyout(null);
                  navigate(item.path);
                }}
              >
                <span>
                  {item.label}
                  <small>{item.sub}</small>
                </span>
              </button>
            )
          ))}
        </div>,
        document.body
      )}
    </aside>
  );
}
