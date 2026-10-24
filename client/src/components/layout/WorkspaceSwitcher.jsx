import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { setActiveBusiness } from '../../store/slices/businessSlice';
import { businessAccent } from '../../utils/businessAccent';

export default function WorkspaceSwitcher({ onOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeBusiness, businesses } = useSelector((state) => state.business);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Close when the route changes. Adjusting state during render mirrors the
  // existing header menu pattern and avoids an extra effect pass.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
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

  if (!activeBusiness) return null;

  const toggle = (event) => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    onOpen?.();

    // Keyboard activation (detail === 0) moves focus into the menu.
    if (event.detail === 0) {
      requestAnimationFrame(() => {
        menuRef.current?.querySelector('button')?.focus();
      });
    }
  };

  const handleSwitch = (biz) => {
    setOpen(false);
    dispatch(setActiveBusiness(biz));
    navigate('/dashboard');
  };

  const handleMenuKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = [...(menuRef.current?.querySelectorAll('button') || [])];
    if (!items.length) return;

    e.preventDefault();
    const current = items.indexOf(document.activeElement);
    let next = 0;

    if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length;
    else if (e.key === 'ArrowUp') next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;

    items[next].focus();
  };

  const activeInitial = activeBusiness.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="biz-switcher biz-switcher--header">
      <button
        ref={triggerRef}
        type="button"
        className="biz-switcher__trigger"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="workspace-menu"
        aria-label={`Switch workspace. Current workspace: ${activeBusiness.name}`}
      >
        <span className={`biz-switcher__icon ${businessAccent(activeBusiness.name)}`}>
          {activeInitial}
        </span>
        <span className="biz-switcher__info">
          <span className="biz-switcher__name">{activeBusiness.name}</span>
          <span className="biz-switcher__role">{activeBusiness.role || 'Owner'}</span>
        </span>
        <ChevronDown size={15} className="biz-switcher__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id="workspace-menu"
          className="biz-switcher__dropdown"
          role="menu"
          aria-label="Workspaces"
          onKeyDown={handleMenuKeyDown}
        >
          {businesses.map((biz) => {
            const isActive = biz.id === activeBusiness.id;
            return (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                key={biz.id}
                className={`biz-switcher__option ${isActive ? 'biz-switcher__option--active' : ''}`}
                onClick={() => handleSwitch(biz)}
              >
                <span className={`biz-switcher__icon ${businessAccent(biz.name)}`}>
                  {biz.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
                <span className="biz-switcher__info">
                  <span className="biz-switcher__name">{biz.name}</span>
                  <span className="biz-switcher__role">{biz.role || 'Owner'}</span>
                </span>
                {isActive && <Check size={16} className="biz-switcher__check" aria-hidden="true" />}
              </button>
            );
          })}

          <button
            type="button"
            role="menuitem"
            className="biz-switcher__add"
            onClick={() => {
              setOpen(false);
              navigate('/businesses');
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add Business</span>
          </button>
        </div>
      )}
    </div>
  );
}
