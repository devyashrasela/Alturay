import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CircleHelp,
  CircleUserRound,
  Database,
  Palette,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

// Only Personalization is implemented today. The remaining entries keep the
// information architecture ready without pretending to be working pages.
const SETTINGS_ITEMS = [
  { label: 'General', icon: SlidersHorizontal },
  { label: 'Appearance', icon: Palette },
  { label: 'Notifications', icon: Bell },
  { label: 'Profile', icon: UserRound },
  { label: 'Security and login', icon: ShieldCheck },
  { label: 'Account', icon: CircleUserRound },
  { label: 'Personalization', icon: Sparkles, path: '/settings/personalization' },
  { label: 'Data controls', icon: Database },
  { label: 'Help', icon: CircleHelp },
];

export default function SettingsSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Move focus into the drawer when it opens so keyboard users are not left
  // behind the overlay.
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = SETTINGS_ITEMS.filter((item) => (
    item.label.toLowerCase().includes(normalizedQuery)
  ));

  return (
    <>
      <button
        type="button"
        className={`user-settings__overlay ${open ? 'user-settings__overlay--visible' : ''}`}
        onClick={onClose}
        aria-label="Close settings navigation"
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="settings-navigation"
        className={`settings-sidebar ${open ? 'settings-sidebar--open' : ''}`}
        aria-label="User settings"
      >
        <div className="settings-sidebar__top">
          <button
            type="button"
            className="settings-sidebar__back"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to app</span>
          </button>
          <button
            type="button"
            className="settings-sidebar__close"
            onClick={onClose}
            aria-label="Close settings navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="settings-sidebar__search">
          <Search size={15} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search settings"
            autoComplete="off"
          />
        </div>

        <div className="settings-sidebar__section-label">Settings</div>

        <nav className="settings-sidebar__nav" aria-label="Settings">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            if (!item.path) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className="settings-sidebar__item"
                  disabled
                  title="Available in a later update"
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                  <span className="settings-sidebar__soon">Soon</span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) => (
                  `settings-sidebar__item ${isActive ? 'settings-sidebar__item--active' : ''}`
                )}
              >
                <Icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {!visibleItems.length && (
            <p className="settings-sidebar__empty">No settings found.</p>
          )}
        </nav>
      </aside>
    </>
  );
}
