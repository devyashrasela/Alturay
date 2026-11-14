import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { INDIAN_STATES } from '../../../../constants/indianStates';
import './SearchableStateDropdown.css';

export default function SearchableStateDropdown({
  id = 'state-select',
  value,
  onChange,
  error,
  placeholder = 'Select Indian State...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filter 28 states based on search query
  const filteredStates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return INDIAN_STATES;
    return INDIAN_STATES.filter((state) => state.toLowerCase().includes(q));
  }, [search]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (state) => {
    onChange(state);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredStates.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredStates.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredStates.length) {
        handleSelect(filteredStates[highlightedIndex]);
      } else if (filteredStates.length === 1) {
        handleSelect(filteredStates[0]);
      }
    }
  };

  return (
    <div className="searchable-select" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select State"
        className={`searchable-select__trigger ${
          isOpen ? 'searchable-select__trigger--open' : ''
        } ${error ? 'searchable-select__trigger--error' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {value ? (
          <span className="searchable-select__value">{value}</span>
        ) : (
          <span className="searchable-select__placeholder">{placeholder}</span>
        )}

        <div className="searchable-select__trigger-actions">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear state"
              className="searchable-select__clear-btn"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e);
              }}
            >
              <X size={14} />
            </span>
          ) : null}
          <ChevronDown
            size={16}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </div>
      </button>

      {/* Popover Menu with Search Input at the top */}
      {isOpen ? (
        <div className="searchable-select__menu" role="listbox">
          <div className="searchable-select__search-box">
            <Search size={15} className="searchable-select__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select__search-input"
              placeholder="Search Indian state..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <ul className="searchable-select__list" ref={listRef}>
            {filteredStates.length > 0 ? (
              filteredStates.map((state, idx) => {
                const isSelected = value === state;
                const isFocused = highlightedIndex === idx;
                return (
                  <li
                    key={state}
                    role="option"
                    aria-selected={isSelected}
                    className={`searchable-select__option ${
                      isSelected ? 'searchable-select__option--selected' : ''
                    } ${isFocused ? 'searchable-select__option--focused' : ''}`}
                    onClick={() => handleSelect(state)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <span>{state}</span>
                    {isSelected ? <Check size={14} /> : null}
                  </li>
                );
              })
            ) : (
              <li className="searchable-select__empty">
                No states matching "{search}"
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
