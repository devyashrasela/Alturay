import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NAV_SECTIONS, getActiveSection, isItemActive } from './navConfig';

function SidebarItem({ item, pathname, collapsed, onNavigate }) {
  const Icon = item.icon;

  if (item.soon) {
    return (
      <button
        type="button"
        className="sec-nav__item"
        disabled
        title="Available in a later update"
      >
        <Icon size={17} aria-hidden="true" />
        <span className="sec-nav__label">{item.label}</span>
        <span className="sec-nav__soon">Soon</span>
      </button>
    );
  }

  const active = isItemActive(item, pathname);
  return (
    <Link
      to={item.path}
      className={`sec-nav__item${active ? ' sec-nav__item--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
    >
      <Icon size={17} aria-hidden="true" />
      <span className="sec-nav__label">{item.label}</span>
    </Link>
  );
}

/*
 * Secondary navigation.
 *  - Desktop: shown only for sections that define a `sidebar`; collapsible
 *    to an icon rail.
 *  - Mobile (<1024px): becomes the slide-over drawer for the whole app, so it
 *    also lists the main sections.
 */
export default function SecondarySidebar({
  section,
  collapsed,
  onToggleCollapse,
  drawerOpen,
  onCloseDrawer,
}) {
  const { pathname } = useLocation();
  const sidebar = section?.sidebar;

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, onCloseDrawer]);

  const className = [
    'sec-nav',
    collapsed && 'sec-nav--collapsed',
    drawerOpen && 'sec-nav--open',
    !sidebar && 'sec-nav--drawer-only',
  ].filter(Boolean).join(' ');

  return (
    <>
      <button
        type="button"
        className={`shell__overlay${drawerOpen ? ' shell__overlay--visible' : ''}`}
        onClick={onCloseDrawer}
        aria-label="Close navigation"
        tabIndex={drawerOpen ? 0 : -1}
      />

      <aside
        id="secondary-navigation"
        className={className}
        aria-label={sidebar ? `${sidebar.title} navigation` : 'Navigation'}
      >
        <div className="sec-nav__head">
          <span className="sec-nav__title">{sidebar?.title ?? 'Menu'}</span>

          <button
            type="button"
            className="sidebar__collapse sec-nav__collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            type="button"
            className="sidebar__collapse sec-nav__close"
            onClick={onCloseDrawer}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sec-nav__scroll">
          {/* Main sections: drawer only. On desktop they live in the top bar. */}
          <div className="sec-nav__group sec-nav__group--main">
            <div className="sec-nav__group-label">Main</div>
            {NAV_SECTIONS.map((s) => {
              const active = getActiveSection(pathname)?.id === s.id;
              const Icon = s.icon;
              return (
                <Link
                  key={s.id}
                  to={s.path}
                  className={`sec-nav__item${active ? ' sec-nav__item--active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={onCloseDrawer}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className="sec-nav__label">{s.label}</span>
                </Link>
              );
            })}
          </div>

          {sidebar?.groups.map((group) => (
            <div className="sec-nav__group" key={group.label}>
              <div className="sec-nav__group-label">{group.label}</div>
              {group.items.map((item) => (
                <SidebarItem
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  onNavigate={onCloseDrawer}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
