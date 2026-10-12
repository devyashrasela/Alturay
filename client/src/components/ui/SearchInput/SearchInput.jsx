import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  const [internal, setInternal] = useState(value || '');

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => onChange(internal), 300);
    return () => clearTimeout(t);
  }, [internal]);

  useEffect(() => { setInternal(value || ''); }, [value]);

  return (
    <div className={`search-input ${className}`}>
      <Search size={16} className="search-input__icon" />
      <input
        className="search-input__input"
        placeholder={placeholder}
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
      />
      {internal && (
        <button className="search-input__clear" onClick={() => { setInternal(''); onChange(''); }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
