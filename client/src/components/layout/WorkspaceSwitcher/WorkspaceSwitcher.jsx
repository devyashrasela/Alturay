import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setActiveBusiness } from '../../../store/slices/businessSlice';
import Icon from '../../ui/Icon/Icon';
import './WorkspaceSwitcher.css';

export default function WorkspaceSwitcher({ onOpen }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusiness, businesses } = useSelector((state) => state.business);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [open]);

  if (!activeBusiness) return null;

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) onOpen?.();
      return next;
    });
  };

  const handleSwitch = (biz) => {
    setOpen(false);
    dispatch(setActiveBusiness(biz));
    navigate('/dashboard');
  };

  const handleAddBusiness = () => {
    setOpen(false);
    navigate('/businesses');
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredBusinesses = (businesses || []).filter((b) =>
    b.name?.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="wswrap" ref={containerRef}>
      <button
        className="wsw"
        id="wsBtn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch workspace"
        onClick={handleToggle}
      >
        <span>{activeBusiness.name}</span>
        <Icon name="updown" size={14} className="ws__chev" />
      </button>

      {open && (
        <div className="wspop" id="wsPop" role="dialog" aria-label="Workspaces">
          <div className="wss">
            <Icon name="search" size={14} />
            <input
              ref={searchInputRef}
              id="wsQ"
              type="search"
              placeholder="Search workspaces…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="wslist" id="wsList" role="listbox">
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((b) => {
                const isSelected = b.id === activeBusiness.id;
                const initial = b.name?.charAt(0)?.toUpperCase() || 'B';
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`wsi ${isSelected ? 'sel' : ''}`}
                    onClick={() => handleSwitch(b)}
                  >
                    <span className="wt">
                      {b.logo_url ? (
                        <img
                          src={b.logo_url}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.textContent = initial;
                            }
                          }}
                        />
                      ) : (
                        initial
                      )}
                    </span>
                    <span className="wtx">
                      <span className="wn">{b.name}</span>
                      <span className="role">{b.role || 'Member'}</span>
                    </span>
                    {isSelected && (
                      <Icon name="check" size={14} className="ck" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="dd-empty">No workspaces found</div>
            )}
          </div>

          <div className="wsadd">
            <button
              className="wsa"
              id="wsAddBtn"
              type="button"
              onClick={handleAddBusiness}
            >
              <Icon name="plus" size={14} />
              <span>Add business</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
