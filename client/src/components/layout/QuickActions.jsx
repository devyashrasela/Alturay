import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Plus } from 'lucide-react';
import { QUICK_ACTIONS } from './navConfig';

export default function QuickActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const triggerRef = useRef(null);

  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="header__menu-anchor" ref={anchorRef}>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn--primary btn--md topnav__new"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Quick actions"
      >
        <Plus size={16} aria-hidden="true" />
        <span className="topnav__new-label">New</span>
        <ChevronDown size={14} aria-hidden="true" className="topnav__new-chev" />
      </button>

      {open && (
        <div className="header__menu topnav__quick" role="menu" aria-label="Quick actions">
          <div className="header__menu-list">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  className="header__menu-item"
                  disabled={action.soon}
                  title={action.soon ? 'Available in a later update' : undefined}
                  onClick={() => { setOpen(false); navigate(action.path); }}
                >
                  <span className="icon-tile icon-tile--blue" style={{ width: 28, height: 28 }}>
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 13.5 }}>{action.label}</span>
                  {action.soon && <span className="user-menu__soon">Soon</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
