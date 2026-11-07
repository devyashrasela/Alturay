import { Link, useLocation } from 'react-router-dom';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import UserMenu from './UserMenu';
import { NAV_SECTIONS, getActiveSection } from './navConfig';

export default function TopNav({ onOpenUserSettings }) {
  const { pathname } = useLocation();
  const activeId = getActiveSection(pathname)?.id;

  return (
    <header className="topbar">
      <Link className="topbar__brand" to="/dashboard" aria-label="Alturay home">
        <img
          className="topbar__logo"
          src="/alturay_light.png"
          width="22"
          height="22"
          alt=""
          draggable="false"
        />
        <span>Alturay</span>
      </Link>

      <nav className="topbar__links" id="navLinks" aria-label="Main">
        {NAV_SECTIONS.map((section) => {
          const active = section.id === activeId;
          return (
            <Link
              key={section.id}
              to={section.path}
              className="topbar__link"
              aria-current={active ? 'page' : undefined}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>

      <div className="topbar__end">
        <WorkspaceSwitcher />
        <UserMenu onOpenUserSettings={onOpenUserSettings} />
      </div>
    </header>
  );
}
