import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import './SearchableProductDropdown.css';

export default function SearchableProductDropdown({
  id = 'product-select',
  products = [],
  currency = 'INR',
  productId = null,
  itemName = '',
  onChange,
  placeholder = 'Select or search item…',
  error = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Filter products by name or SKU
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  // Check if current search matches an existing product exactly
  const exactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return products.find((p) => p.name.toLowerCase() === q);
  }, [products, search]);

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

  const handleSelectProduct = (product) => {
    onChange(product);
    setIsOpen(false);
  };

  const handleSelectCustom = (customName) => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    onChange({ id: null, name: trimmed });
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalOptions = filteredProducts.length + (search.trim() && !exactMatch ? 1 : 0);

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        handleSelectProduct(filteredProducts[highlightedIndex]);
      } else if (search.trim()) {
        handleSelectCustom(search.trim());
      }
    }
  };

  const displayName = itemName || '';

  return (
    <div className="product-select" ref={containerRef}>
      <button
        id={id}
        type="button"
        className={`product-select__trigger ${isOpen ? 'product-select__trigger--open' : ''} ${error ? 'product-select__trigger--error' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {displayName ? (
          <span className="product-select__value" title={displayName}>
            {displayName}
          </span>
        ) : (
          <span className="product-select__placeholder">{placeholder}</span>
        )}

        <div className="product-select__trigger-actions">
          {displayName && (
            <button
              type="button"
              className="product-select__clear-btn"
              onClick={handleClear}
              aria-label="Clear selected item"
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={15} style={{ opacity: 0.7 }} />
        </div>
      </button>

      {isOpen && (
        <div className="product-select__menu" role="listbox">
          <div className="product-select__search-box">
            <Search size={14} className="product-select__search-icon" />
            <input
              ref={searchInputRef}
              type="search"
              className="product-select__search-input"
              placeholder="Search shop items or type custom…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Search items"
            />
          </div>

          <ul className="product-select__list" ref={listRef}>
            {filteredProducts.length === 0 && !search.trim() ? (
              <li className="product-select__empty">No items found in shop</li>
            ) : (
              filteredProducts.map((p, index) => {
                const isSelected = productId === p.id || (!productId && itemName === p.name);
                const isHighlighted = highlightedIndex === index;

                return (
                  <li
                    key={p.id}
                    className={`product-select__option ${isSelected ? 'product-select__option--selected' : ''} ${isHighlighted ? 'product-select__option--focused' : ''}`}
                    onClick={() => handleSelectProduct(p)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="product-select__option-main">
                      <span className="product-select__option-name">{p.name}</span>
                      {p.sku && (
                        <span className="product-select__option-sku">SKU: {p.sku}</span>
                      )}
                    </div>
                    <div className="product-select__option-side">
                      <span className="product-select__option-price">
                        {formatCurrency(p.unit_price, currency)}
                        {p.unit ? ` / ${p.unit}` : ''}
                      </span>
                      {isSelected && <Check size={14} style={{ color: 'var(--accent)' }} />}
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Custom Item Option when user enters custom search or wants custom entry */}
          {search.trim() && !exactMatch && (
            <div
              className={`product-select__custom-option ${highlightedIndex === filteredProducts.length ? 'product-select__option--focused' : ''}`}
              onClick={() => handleSelectCustom(search)}
            >
              <Plus size={14} />
              <span>Use &quot;{search.trim()}&quot; as custom item</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
