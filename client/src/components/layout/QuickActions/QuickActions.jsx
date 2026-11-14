import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../ui/Icon/Icon';
import { QUICK_ACTIONS } from '../navConfig';
import { usePermissions } from '../../../hooks/usePermissions';

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

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
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
    <div ref={containerRef}>
      <button
        className="fab"
        id="fab"
        type="button"
        aria-label="Quick actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="qa"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="plus" size={18} strokeWidth={2.2} />
      </button>

      {open && (
        <div className="pop qa" id="qa" role="menu" aria-label="Quick actions">
          <div className="pop__label">Create</div>
          {visibleActions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className="pop__item"
              disabled={action.soon}
              title={action.soon ? 'Available in a later update' : undefined}
              onClick={() => handleAction(action)}
            >
              <Icon name={action.icon} size={16} />
              <span>{action.label}</span>
              {action.soon && <span className="soon">Soon</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
