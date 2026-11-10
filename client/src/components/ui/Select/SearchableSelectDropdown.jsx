import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import './SearchableStateDropdown.css';

export default function SearchableSelectDropdown({
  id = 'select-dropdown',
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  error,
  searchable = true,
  clearable = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to { value, label }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null && 'value' in opt) {
        return { value: opt.value, label: opt.label ?? String(opt.value) };
      }
      return { value: opt, label: String(opt) };
    });
  }, [options]);

  // Find currently selected option object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, search]);

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
      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, searchable]);

  const handleSelect = (val) => {
    onChange(val);
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
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    }
  };

  const displayLabel = selectedOption ? selectedOption.label : '';

  return (
    <div
      className={`searchable-select ${isOpen ? 'searchable-select--open' : ''} ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ zIndex: isOpen ? 50 : undefined }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={displayLabel || placeholder}
        className={`searchable-select__trigger ${
          isOpen ? 'searchable-select__trigger--open' : ''
        } ${error ? 'searchable-select__trigger--error' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {displayLabel ? (
          <span className="searchable-select__value">{displayLabel}</span>
        ) : (
          <span className="searchable-select__placeholder">{placeholder}</span>
        )}

        <div className="searchable-select__trigger-actions">
          {clearable && value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
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

      {/* Popover Menu with optional Search Input */}
      {isOpen ? (
        <div className="searchable-select__menu" role="listbox">
          {searchable && (
            <div className="searchable-select__search-box">
              <Search size={15} className="searchable-select__search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="searchable-select__search-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <ul className="searchable-select__list" ref={listRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(value) === String(opt.value);
                const isFocused = highlightedIndex === idx;
                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    className={`searchable-select__option ${
                      isSelected ? 'searchable-select__option--selected' : ''
                    } ${isFocused ? 'searchable-select__option--focused' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <span>{opt.label}</span>
                    {isSelected ? <Check size={14} /> : null}
                  </li>
                );
              })
            ) : (
              <li className="searchable-select__empty">
                No options matching &quot;{search}&quot;
              </li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
