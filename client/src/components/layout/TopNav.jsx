import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import UserMenu from './UserMenu';
import QuickActions from './QuickActions';
import NotificationsMenu from './NotificationsMenu';
import { NAV_SECTIONS, getActiveSection } from './navConfig';

/*
 * Main application bar. Same anatomy as the landing navbar: brand at the
 * start, a boxed link group in the centre, account controls at the end.
 * Below 1024px the link group moves into the navigation drawer.
 */
export default function TopNav({ drawerOpen, onOpenDrawer }) {
  const { pathname } = useLocation();
  const activeId = getActiveSection(pathname)?.id;

  return (
    <header className="topnav">
      <div className="topnav__inner">
        <div className="topnav__start">
          <button
            type="button"
            className="header__icon-btn topnav__menu-btn"
            onClick={onOpenDrawer}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls="secondary-navigation"
          >
            <Menu size={20} />
          </button>
          <Link className="topnav__brand" to="/dashboard" aria-label="Alturay dashboard">
            <img
              className="topnav__mark"
              src="/alturay_light.png"
              alt=""
              width="28"
              height="28"
              draggable="false"
            />
            <span className="topnav__wordmark">Alturay</span>
          </Link>
        </div>

        <nav className="topnav__links" aria-label="Main">
          {NAV_SECTIONS.map((section) => {
            const active = section.id === activeId;
            return (
              <Link
                key={section.id}
                to={section.path}
                className={`topnav__link${active ? ' topnav__link--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>

        <div className="topnav__end">
          <WorkspaceSwitcher />
          <QuickActions />
          <NotificationsMenu />
          <UserMenu placement="topbar" />
        </div>
      </div>
    </header>
  );
}
