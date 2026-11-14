import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../store/slices/authSlice';
import Icon from '../../ui/Icon/Icon';
import { usePermissions } from '../../../hooks/usePermissions';

export default function UserMenu({ onOpenUserSettings }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { roleLabel } = usePermissions();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    setOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const handleOpenSettings = (tab) => {
    setOpen(false);
    onOpenUserSettings?.(tab);
  };

  return (
    <div className="um" ref={containerRef}>
      <button
        className="avatar"
        id="umBtn"
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="umMenu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {initial}
      </button>

      {open && (
        <div className="pop" id="umMenu" role="menu" aria-label="Account">
          <div className="pop__label">Account</div>
          <div className="pop__user">
            <span className="avatar" aria-hidden="true">
              {initial}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>{name}</span>
              {roleLabel && (
                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{roleLabel}</span>
              )}
            </div>
          </div>
          <div className="pop__sep" />
          <button
            className="pop__item"
            role="menuitem"
            type="button"
            onClick={() => handleOpenSettings('profile')}
          >
            <Icon name="sliders" size={16} />
            <span>Settings</span>
          </button>
          <button
            className="pop__item"
            role="menuitem"
            type="button"
            onClick={() => handleOpenSettings('help')}
          >
            <Icon name="help" size={16} />
            <span>Help</span>
          </button>
          <div className="pop__sep" />
          <button
            className="pop__item"
            role="menuitem"
            type="button"
            onClick={handleLogout}
          >
            <Icon name="logout" size={16} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
