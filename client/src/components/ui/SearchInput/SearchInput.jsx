import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '', style, label = 'Search' }) {
  const [internal, setInternal] = useState(value || '');

  // Keep the latest callback in a ref so the debounce effect doesn't need it as a dependency
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => onChangeRef.current(internal), 300);
    return () => clearTimeout(t);
  }, [internal]);

  useEffect(() => { setInternal(value || ''); }, [value]);

  return (
    <div className={`search-input ${className}`} style={style}>
      <Search size={16} className="search-input__icon" aria-hidden="true" />
      <input
        type="search"
        name="search"
        className="search-input__input"
        placeholder={placeholder}
        aria-label={label}
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
      />
      {internal && (
        <button
          type="button"
          className="search-input__clear"
          aria-label="Clear search"
          onClick={() => { setInternal(''); onChangeRef.current(''); }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
