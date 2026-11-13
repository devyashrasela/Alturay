import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import { useSearchUsersQuery } from '../../../store/api/membersApi';
import InputField from '../../../components/ui/Input/InputField';
import './UserEmailSelect.css';

export default function UserEmailSelect({
  id = 'member-email',
  businessId,
  value = '',
  onChange,
  onSelectUser,
  error = false,
  placeholder = 'name@company.com or search by name…',
  autoFocus = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [debouncedQuery, setDebouncedQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedUser, setSelectedUser] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Synchronize internal input value if external value changes (e.g. on modal reset)
  useEffect(() => {
    setInputValue(value || '');
    if (!value) {
      setSelectedUser(null);
    }
  }, [value]);

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 220);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Fetch registered users matching the query from the users model in Alturay database
  const trimmedQuery = debouncedQuery.trim();
  const { data, isFetching, isLoading } = useSearchUsersQuery(
    {
      businessId,
      q: trimmedQuery,
    },
    {
      skip: !businessId || !isOpen || !trimmedQuery,
    }
  );

  const users = useMemo(() => (trimmedQuery ? data?.data?.users || [] : []), [data, trimmedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setHighlightedIndex(-1);

    if (val.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }

    if (selectedUser && selectedUser.email.toLowerCase() !== val.trim().toLowerCase()) {
      setSelectedUser(null);
      if (onSelectUser) onSelectUser(null);
    }
    onChange?.(val);
  };

  const handleSelect = (user) => {
    if (user.is_already_member) return;
    setInputValue(user.email);
    setSelectedUser(user);
    setIsOpen(false);
    onChange?.(user.email);
    if (onSelectUser) onSelectUser(user);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    setSelectedUser(null);
    setDebouncedQuery('');
    setIsOpen(false);
    onChange?.('');
    if (onSelectUser) onSelectUser(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'Enter') && inputValue.trim()) {
        setIsOpen(true);
      }
      return;
    }

    const selectableUsers = users.filter((u) => !u.is_already_member);

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < users.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : users.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < users.length) {
        e.preventDefault();
        const candidate = users[highlightedIndex];
        if (!candidate.is_already_member) {
          handleSelect(candidate);
        }
      } else if (selectableUsers.length === 1 && !selectedUser) {
        e.preventDefault();
        handleSelect(selectableUsers[0]);
      }
    }
  };

  const isBusy = isFetching || isLoading;

  return (
    <div className="user-email-select" ref={containerRef}>
      <div className="user-email-select__input-wrap">
        <span className="user-email-select__search-icon">
          <Search size={15} />
        </span>

        <InputField
          ref={inputRef}
          id={id}
          type="email"
          className="user-email-select__input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          error={Boolean(error)}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen && Boolean(inputValue.trim())}
          aria-autocomplete="list"
        />

        <div className="user-email-select__input-actions">
          {isBusy && (
            <Loader2 size={15} className="user-email-select__spinner" />
          )}

          {inputValue && (
            <button
              type="button"
              className="user-email-select__clear-btn"
              onClick={handleClear}
              aria-label="Clear user email"
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu - only shown when user types something */}
      {isOpen && Boolean(inputValue.trim()) && (
        <ul className="user-email-select__dropdown" role="listbox" ref={listRef}>
          {isBusy && users.length === 0 ? (
            <li className="user-email-select__status-row">
              <Loader2 size={16} className="user-email-select__spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
              <span>Searching registered users…</span>
            </li>
          ) : users.length === 0 ? (
            <li className="user-email-select__status-row">
              <div className="user-email-select__empty-title">
                {inputValue ? `No users matching "${inputValue}"` : 'No registered users found'}
              </div>
              <div className="user-email-select__empty-hint">
                Only users registered in Alturay can be added.
              </div>
            </li>
          ) : (
            users.map((user, idx) => {
              const isSelected =
                (selectedUser && selectedUser.id === user.id) ||
                (inputValue && inputValue.trim().toLowerCase() === user.email.toLowerCase());
              const isHighlighted = highlightedIndex === idx;
              const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

              return (
                <li
                  key={user.id}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={user.is_already_member}
                  className={`user-email-select__option ${
                    isSelected ? 'user-email-select__option--selected' : ''
                  } ${isHighlighted ? 'user-email-select__option--focused' : ''} ${
                    user.is_already_member ? 'user-email-select__option--disabled' : ''
                  }`}
                  onClick={() => handleSelect(user)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="user-email-select__user-info">
                    <div className="user-email-select__avatar">{initial}</div>
                    <div className="user-email-select__meta">
                      <span className="user-email-select__name">{user.name || 'Unnamed User'}</span>
                      <span className="user-email-select__email">{user.email}</span>
                    </div>
                  </div>

                  <div className="user-email-select__side">
                    {user.is_already_member ? (
                      <span className="user-email-select__badge-member">Already a member</span>
                    ) : isSelected ? (
                      <Check size={16} className="user-email-select__check" />
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      {/* Selected User confirmation card */}
      {selectedUser && (
        <div className="user-email-select__selected-card">
          <div className="user-email-select__selected-content">
            <div className="user-email-select__avatar">
              {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
            </div>
            <div className="user-email-select__meta">
              <span className="user-email-select__name">{selectedUser.name}</span>
              <span className="user-email-select__email">{selectedUser.email}</span>
            </div>
          </div>
          <span className="user-email-select__selected-tag">Selected</span>
        </div>
      )}
    </div>
  );
}
