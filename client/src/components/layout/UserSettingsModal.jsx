import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '../../store/slices/themeSlice';
import Icon from '../ui/Icon';

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'user', sub: 'Manage your name, email and photo.' },
  { id: 'personal', label: 'Personalization', icon: 'spark', sub: 'Manage how Alturay looks and feels for you.' },
  { id: 'help', label: 'Help', icon: 'help', sub: 'Get support and learn how Alturay works.' },
];

const THEME_OPTIONS = [
  { id: 'dark', label: 'Dark', desc: 'Low-strain dark surfaces' },
  { id: 'light', label: 'Light', desc: 'Clean, bright interface' },
];

export default function UserSettingsModal({ isOpen, initialTab = 'profile', onClose }) {
  const { user } = useSelector((state) => state.auth);
  const { activeBusiness } = useSelector((state) => state.business);
  const { currentTheme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pendingTheme, setPendingTheme] = useState(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = search.trim().toLowerCase();
  const filteredTabs = TABS.filter((t) => t.label.toLowerCase().includes(q));
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirmTheme = () => {
    if (pendingTheme && pendingTheme !== currentTheme) {
      dispatch(setTheme(pendingTheme));
      setPendingTheme(null);
    }
  };

  return (
    <div className="us-backdrop" id="us" onClick={handleBackdropClick}>
      <div className="us" role="dialog" aria-modal="true" aria-labelledby="usTitle">
        <aside className="us__nav">
          <label className="us__search">
            <Icon name="search" size={16} />
            <input
              ref={searchInputRef}
              id="usSearch"
              type="search"
              placeholder="Search settings"
              aria-label="Search settings"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="us__label">Account</div>
          <div id="usList" role="tablist" aria-orientation="vertical" aria-label="Account settings">
            {filteredTabs.length > 0 ? (
              filteredTabs.map((t) => {
                const isSelected = t.id === currentTab.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    className="us__item"
                    data-t={t.id}
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <Icon name={t.icon} size={16} />
                    <span>{t.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="us__none">No results</div>
            )}
          </div>
        </aside>

        <div className="us__body" id="usPanel" role="tabpanel">
          <h2 className="us__title" id="usTitle">
            {currentTab.label}
          </h2>
          <p className="us__sub">{currentTab.sub}</p>

          {currentTab.id === 'profile' && (
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px 24px',
                }}
              >
                <span className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text)' }}>
                    {user?.name || 'Devyash Rasela'}
                  </div>
                  <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 2 }}>
                    {user?.email || 'Signed in'}
                  </div>
                </div>
                <span className="sc sc-issued" style={{ fontSize: 12 }}>
                  Active Account
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '16px 18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Workspace
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginTop: 6, color: 'var(--text)' }}>
                    {activeBusiness?.name || 'Alturay Studio'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    Primary organization
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '16px 18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Role & Permissions
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginTop: 6, color: 'var(--text)' }}>
                    Owner / Administrator
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    Full access to catalog and billing
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab.id === 'personal' && (
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '24px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
                  Appearance & Theme
                </div>
                <div
                  style={{
                    color: 'var(--text-2)',
                    fontSize: 14,
                    marginTop: 4,
                    lineHeight: 1.5,
                    maxWidth: 560,
                  }}
                >
                  Choose how Alturay looks for you. Select a theme and confirm to apply.
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  {THEME_OPTIONS.map((t) => {
                    const selected = (pendingTheme ?? currentTheme) === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPendingTheme(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 18px',
                          borderRadius: 10,
                          border: selected
                            ? '2px solid var(--accent)'
                            : '1px solid var(--border)',
                          background: selected ? 'var(--hover)' : 'transparent',
                          color: 'var(--text)',
                          fontWeight: 500,
                          fontSize: 14,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          minWidth: 170,
                          textAlign: 'left',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: selected ? 'var(--accent)' : 'var(--border)',
                            flexShrink: 0,
                            transition: 'background 0.15s',
                          }}
                        />
                        <span>
                          <span style={{ display: 'block', fontWeight: 600 }}>{t.label}</span>
                          <span
                            style={{
                              display: 'block',
                              fontSize: 12,
                              color: 'var(--muted)',
                              marginTop: 2,
                            }}
                          >
                            {t.desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {pendingTheme && pendingTheme !== currentTheme && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={handleConfirmTheme}
                      style={{
                        height: 34,
                        padding: '0 18px',
                        borderRadius: 8,
                        background: 'var(--accent)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 14,
                        border: 0,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingTheme(null)}
                      style={{
                        height: 34,
                        padding: '0 18px',
                        borderRadius: 8,
                        background: 'var(--hover)',
                        color: 'var(--text-2)',
                        fontWeight: 500,
                        fontSize: 14,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab.id === 'help' && (
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '24px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
                  Help & Documentation
                </div>
                <div
                  style={{
                    color: 'var(--text-2)',
                    fontSize: 14,
                    marginTop: 4,
                    lineHeight: 1.5,
                    maxWidth: 560,
                  }}
                >
                  Need assistance with invoices, inventories, or business accounts?
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                  <a
                    href="mailto:support@alturay.com"
                    className="dash-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <Icon name="help" size={16} />
                    <span>Contact Support</span>
                  </a>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: 'var(--text)',
                    marginBottom: 16,
                  }}
                >
                  Keyboard Shortcuts
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Close modal</span>
                    <kbd
                      style={{
                        padding: '2px 6px',
                        background: 'var(--chip)',
                        color: 'var(--text)',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      Esc
                    </kbd>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Inspect revenue chart</span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      <kbd
                        style={{
                          padding: '2px 6px',
                          background: 'var(--chip)',
                          color: 'var(--text)',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        ←
                      </kbd>
                      <kbd
                        style={{
                          padding: '2px 6px',
                          background: 'var(--chip)',
                          color: 'var(--text)',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        →
                      </kbd>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          className="us__close"
          id="usClose"
          type="button"
          aria-label="Close settings"
          onClick={onClose}
        >
          <Icon name="xmark" size={16} />
        </button>
      </div>
    </div>
  );
}
