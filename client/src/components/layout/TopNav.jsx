import { Link, useLocation } from 'react-router-dom';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import UserMenu from './UserMenu';
import { NAV_SECTIONS, getActiveSection, filterNavForPermissions, getHomePath } from './navConfig';
import { usePermissions } from '../../hooks/usePermissions';

export default function TopNav({ onOpenUserSettings }) {
  const { pathname } = useLocation();
  const { can } = usePermissions();
  const activeId = getActiveSection(pathname)?.id;
  const filteredSections = filterNavForPermissions(NAV_SECTIONS, can);
  const homePath = getHomePath(can);

  return (
    <header className="topbar">
      <Link className="topbar__brand" to={homePath} aria-label="Alturay home">
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
        {filteredSections.map((section) => {
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
