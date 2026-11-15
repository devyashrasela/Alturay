import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../ui/Icon/Icon';
import { QUICK_ACTIONS } from '../navConfig';
import { usePermissions } from '../../../hooks/usePermissions';
import './QuickActions.css';

export default function QuickActions() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const visibleActions = QUICK_ACTIONS.filter((action) => !action.perm || can(action.perm));

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

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (visibleActions.length === 0) {
    return null;
  }

  const handleAction = (action) => {
    if (action.soon) return;
    setOpen(false);
    navigate(action.path);
  };

  return (
    <div className="quick-actions" ref={containerRef}>
      <button
        className="quick-actions__trigger"
        id="quick-actions-trigger"
        type="button"
        aria-label="Quick actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="quick-actions-menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <Icon name="plus" size={18} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          className="quick-actions__menu"
          id="quick-actions-menu"
          role="menu"
          aria-label="Quick actions"
        >
          <div className="quick-actions__label">Create</div>
          {visibleActions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className="quick-actions__item"
              disabled={action.soon}
              title={action.soon ? 'Available in a later update' : undefined}
              onClick={(event) => {
                event.stopPropagation();
                handleAction(action);
              }}
            >
              <Icon name={action.icon} size={16} />
              <span>{action.label}</span>
              {action.soon && <span className="quick-actions__soon">Soon</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
