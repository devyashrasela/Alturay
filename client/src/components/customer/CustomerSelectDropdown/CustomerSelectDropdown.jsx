import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Plus, User, MapPin, Phone, Mail } from 'lucide-react';
import { useGetCustomersQuery } from '../../../store/api/customerApi';
import CustomerModal from '../CustomerModal/CustomerModal';
import Button from '../../ui/Button/Button';
import './CustomerSelectDropdown.css';

export default function CustomerSelectDropdown({
  businessId,
  value,
  onChange,
  error,
  placeholder = 'Select or search customer…',
  required = false,
  showCard = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch customers for active business
  const { data, isLoading } = useGetCustomersQuery(
    { businessId, all: true, search },
    { skip: !businessId }
  );

  const customers = data?.data?.customers || [];

  // Find currently selected customer
  const selectedCustomer = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'object' && value.id) return value;
    return customers.find((c) => c.id === value) || null;
  }, [value, customers]);

  // Click outside to close
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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (customer) => {
    onChange(customer);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleCreatedCustomer = (newCustomer) => {
    onChange(newCustomer);
    setIsOpen(false);
  };

  const formatAddress = (c) => {
    if (!c) return '';
    if (c.formatted_address) return c.formatted_address;
    return [c.address_line1, c.address_line2, c.city, c.state, c.pincode]
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="customer-select" ref={containerRef}>
      {selectedCustomer && showCard ? (
        <div className="customer-selected-card">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="customer-selected-card__name">
              {selectedCustomer.name}
            </div>
            {(selectedCustomer.phone || selectedCustomer.email) && (
              <div className="customer-selected-card__details">
                {selectedCustomer.phone && <span>📞 {selectedCustomer.phone} </span>}
                {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
              </div>
            )}
            {formatAddress(selectedCustomer) && (
              <div className="customer-selected-card__details" style={{ color: 'var(--muted)' }}>
                📍 {formatAddress(selectedCustomer)}
              </div>
            )}
          </div>
          <div className="customer-selected-card__actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              Change
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              type="button"
              aria-label="Clear customer"
            >
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`customer-select__trigger ${isOpen ? 'customer-select__trigger--open' : ''} ${error ? 'customer-select__trigger--error' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={selectedCustomer ? '' : 'customer-select__placeholder'}>
            {selectedCustomer ? selectedCustomer.name : placeholder}
          </span>
          <ChevronDown size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        </button>
      )}

      {isOpen && (
        <div className="customer-select__menu" role="listbox">
          <div className="customer-select__search">
            <Search size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Type customer name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search customers"
            />
          </div>

          <ul className="customer-select__list">
            {isLoading ? (
              <li style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                Loading customers…
              </li>
            ) : customers.length === 0 ? (
              <li style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                No customers found matching &quot;{search}&quot;
              </li>
            ) : (
              customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                const addr = formatAddress(c);
                return (
                  <li
                    key={c.id}
                    className={`customer-select__item ${isSelected ? 'customer-select__item--selected' : ''}`}
                    onClick={() => handleSelect(c)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div>
                      <div className="customer-select__item-name">{c.name}</div>
                      <div className="customer-select__item-meta">
                        {[c.phone, c.email, c.city].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--accent)' }} />}
                  </li>
                );
              })
            )}
          </ul>

          <div className="customer-select__footer">
            <button
              type="button"
              className="customer-select__add-btn"
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
            >
              <Plus size={15} />
              <span>Add New Customer</span>
            </button>
          </div>
        </div>
      )}

      {error && <span className="field-error" style={{ marginTop: 4, display: 'block' }}>{error}</span>}

      {/* Customer Modal for adding on the fly */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreatedCustomer}
      />
    </div>
  );
}
