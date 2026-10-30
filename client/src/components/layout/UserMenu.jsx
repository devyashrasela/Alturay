import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CircleHelp,
  LogOut,
  MoreHorizontal,
  Palette,
  Settings,
  UserRound,
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const MENU_WIDTH = 264;

const getInitials = (name) => (
  name
    ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
);

/*
 * placement="sidebar" (default): full account row, menu opens upward.
 * placement="topbar":            avatar only, menu opens downward, right-aligned.
 */
export default function UserMenu({ collapsed = false, placement = 'sidebar' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const topbar = placement === 'topbar';

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  const [lastCollapsed, setLastCollapsed] = useState(collapsed);
  if (collapsed !== lastCollapsed) {
    setLastCollapsed(collapsed);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const closeOnViewportChange = () => setOpen(false);

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('scroll', closeOnViewportChange, true);
    window.addEventListener('resize', closeOnViewportChange);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', closeOnViewportChange, true);
      window.removeEventListener('resize', closeOnViewportChange);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      menuRef.current?.querySelector('button:not(:disabled)')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const name = user?.name || 'Account';
  const email = user?.email || 'Signed in';
  const initials = getInitials(user?.name);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(MENU_WIDTH, window.innerWidth - 16);

    if (topbar) {
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
      setPosition({
        left,
        top: rect.bottom + 8,
        width,
        maxHeight: Math.max(200, window.innerHeight - rect.bottom - 16),
      });
    } else {
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      setPosition({
        left,
        bottom: window.innerHeight - rect.top + 8,
        width,
        maxHeight: Math.max(200, rect.top - 16),
      });
    }
    setOpen(true);
  };

  const toggle = () => {
    if (open) setOpen(false);
    else openMenu();
  };

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const handleMenuKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = [...(menuRef.current?.querySelectorAll('button:not(:disabled)') || [])];
    if (!items.length) return;

    e.preventDefault();
    const current = items.indexOf(document.activeElement);
    let next = 0;

    if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length;
    else if (e.key === 'ArrowUp') next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;

    items[next].focus();
  };

  const menuStyle = position && {
    left: position.left,
    width: position.width,
    maxHeight: position.maxHeight,
    ...(position.top !== undefined ? { top: position.top } : { bottom: position.bottom }),
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={
          topbar
            ? 'topnav__avatar-btn'
            : `sidebar__account ${collapsed ? 'sidebar__account--collapsed' : ''}`
        }
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`Account menu for ${name}`}
        title={topbar || collapsed ? name : undefined}
      >
        <span className="sidebar__account-avatar">{initials}</span>
        {!topbar && !collapsed && (
          <>
            <span className="sidebar__account-info">
              <span className="sidebar__account-name">{name}</span>
              <span className="sidebar__account-meta">{email}</span>
            </span>
            <MoreHorizontal size={16} className="sidebar__account-more" aria-hidden="true" />
          </>
        )}
      </button>

      {open && position && createPortal(
        <div
          ref={menuRef}
          id="account-menu"
          className="user-menu"
          role="menu"
          aria-label="Account menu"
          style={menuStyle}
          onKeyDown={handleMenuKeyDown}
        >
          <div className="user-menu__identity">
            <span className="user-menu__avatar">{initials}</span>
            <span className="user-menu__identity-info">
              <span className="user-menu__name">{name}</span>
              <span className="user-menu__email">{email}</span>
            </span>
          </div>

          <div className="user-menu__divider" />

          <div className="user-menu__group">
            <button type="button" role="menuitem" className="user-menu__item" onClick={() => goTo('/settings/personalization')}>
              <Palette size={16} aria-hidden="true" />
              <span>Personalization</span>
            </button>
            <button type="button" role="menuitem" className="user-menu__item" disabled title="Available in a later update">
              <UserRound size={16} aria-hidden="true" />
              <span>Profile</span>
              <span className="user-menu__soon">Soon</span>
            </button>
            <button type="button" role="menuitem" className="user-menu__item" onClick={() => goTo('/settings')}>
              <Settings size={16} aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>

          <div className="user-menu__divider" />

          <div className="user-menu__group">
            <button type="button" role="menuitem" className="user-menu__item" disabled title="Available in a later update">
              <CircleHelp size={16} aria-hidden="true" />
              <span>Help</span>
              <span className="user-menu__soon">Soon</span>
            </button>
            <button type="button" role="menuitem" className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}