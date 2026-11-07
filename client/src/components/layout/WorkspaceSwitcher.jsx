import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveBusiness } from '../../store/slices/businessSlice';
import Icon from '../ui/Icon';

export default function WorkspaceSwitcher() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusiness, businesses } = useSelector((state) => state.business);
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

  if (!activeBusiness) return null;

  const activeInitial = activeBusiness.name?.charAt(0)?.toUpperCase() || 'A';

  const handleSwitch = (biz) => {
    setOpen(false);
    dispatch(setActiveBusiness(biz));
    navigate('/dashboard');
  };

  const handleAddBusiness = () => {
    setOpen(false);
    navigate('/businesses');
  };

  return (
    <div className="ws" ref={containerRef}>
      <button
        className="ws__btn"
        id="wsBtn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="wsMenu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="tile">{activeInitial}</span>
        <span>{activeBusiness.name}</span>
        <Icon name="chev" size={14} />
      </button>

      {open && (
        <div className="pop" id="wsMenu" role="menu" aria-label="Workspaces">
          <div className="pop__label">Workspaces</div>
          {businesses?.map((b) => {
            const isCurrent = b.id === activeBusiness.id;
            const initial = b.name?.charAt(0)?.toUpperCase() || 'B';
            return (
              <button
                key={b.id}
                className="pop__item"
                role="menuitemradio"
                aria-checked={isCurrent}
                type="button"
                onClick={() => handleSwitch(b)}
              >
                <span className="tile">{initial}</span>
                <span>{b.name}</span>
                {isCurrent && (
                  <Icon name="check" size={14} style={{ marginLeft: 'auto' }} />
                )}
              </button>
            );
          })}
          <div className="pop__sep" />
          <button
            className="pop__item"
            role="menuitem"
            type="button"
            onClick={handleAddBusiness}
          >
            <Icon name="plus" size={16} />
            <span>Add business</span>
          </button>
        </div>
      )}
    </div>
  );
}
