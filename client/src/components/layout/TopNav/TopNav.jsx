import UserMenu from '../UserMenu/UserMenu';
import NotificationsMenu from '../NotificationsMenu/NotificationsMenu';
import Icon from '../../ui/Icon/Icon';
import './TopNav.css';

export default function TopNav({ onOpenUserSettings, onOpenHelp, onOpenDock, onToggleMobileNav }) {
  return (
    <header className="topbar">
      {onToggleMobileNav && (
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation"
        >
          <Icon name="panel" size={18} />
        </button>
      )}

      <div className="topbar__right">
        <NotificationsMenu onOpenDock={onOpenDock} />
        <UserMenu
          onOpenUserSettings={onOpenUserSettings}
          onOpenHelp={onOpenHelp}
        />
      </div>
    </header>
  );
}
