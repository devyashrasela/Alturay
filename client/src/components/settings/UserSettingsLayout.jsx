import { useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PanelLeft } from 'lucide-react';
import SettingsSidebar from './SettingsSidebar';

export default function UserSettingsLayout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Close the mobile drawer when the route changes without an extra render pass.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setNavOpen(false);
  }

  const closeNav = () => {
    setNavOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <div className="user-settings">
      <SettingsSidebar open={navOpen} onClose={closeNav} />

      <div className="user-settings__main">
        <div className="user-settings__mobile-bar">
          <button
            ref={menuButtonRef}
            type="button"
            className="user-settings__menu-btn"
            onClick={() => setNavOpen(true)}
            aria-label="Open settings navigation"
            aria-expanded={navOpen}
            aria-controls="settings-navigation"
          >
            <PanelLeft size={18} aria-hidden="true" />
          </button>
          <span className="user-settings__mobile-title">Settings</span>
        </div>

        <main className="user-settings__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
