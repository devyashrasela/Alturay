import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import Modal from '../../../../components/ui/Modal/Modal';
import Button from '../../../../components/ui/Button/Button';
import FormField from '../../../../components/ui/FormField/FormField';
import InputField from '../../../../components/ui/Input/InputField';
import SelectDropdown from '../../../../components/ui/Select/SelectDropdown/SelectDropdown';
import { useAddMemberMutation, useSearchUsersQuery } from '../../../../store/api/membersApi';
import { addToast } from '../../../../store/slices/uiSlice';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../../../constants/roles';
import './AddMemberModal.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddMemberModal({
  isOpen,
  onClose,
  businessId,
  assignableRoles = [],
}) {
  const dispatch = useDispatch();
  const [addMember, { isLoading }] = useAddMemberMutation();

  const [email, setEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [role, setRole] = useState('');
  const [emailError, setEmailError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showRoleDetails, setShowRoleDetails] = useState(false);

  const submittingRef = useRef(false);
  const containerRef = useRef(null);

  const trimmedQuery = email.trim();

  // Search only when user types something (does not fetch or show all users from the start)
  const { data: searchData, isFetching: isSearching } = useSearchUsersQuery(
    { businessId, query: trimmedQuery },
    { skip: !isOpen || !businessId || trimmedQuery.length === 0 }
  );

  const candidateUsers = trimmedQuery.length > 0 ? (searchData?.data?.users || []) : [];
  const shouldShowDropdown = dropdownOpen && trimmedQuery.length > 0;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setDropdownOpen(false);
      setRole(assignableRoles.length === 1 ? assignableRoles[0] : '');
      setEmailError('');
      setRoleError('');
      setGeneralError('');
      setShowRoleDetails(false);
      submittingRef.current = false;
    }
  }, [isOpen, assignableRoles]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectUser = (user) => {
    if (user.is_member) return;
    // Put selected email into input only (no extra field added)
    setEmail(user.email);
    setEmailError('');
    setDropdownOpen(false);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) setEmailError('');
    setDropdownOpen(val.trim().length > 0);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submittingRef.current || isLoading) return;

    let hasClientError = false;
    setEmailError('');
    setRoleError('');
    setGeneralError('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setEmailError('Email is required.');
      hasClientError = true;
    } else if (!EMAIL_REGEX.test(targetEmail)) {
      setEmailError('Please enter a valid email address.');
      hasClientError = true;
    }

    if (!role) {
      setRoleError('Please select a role.');
      hasClientError = true;
    }

    if (hasClientError) return;

    submittingRef.current = true;
    try {
      await addMember({
        businessId,
        email: targetEmail,
        role,
      }).unwrap();

      const roleName = ROLE_LABELS[role] || role;
      dispatch(
        addToast({
          type: 'success',
          message: `${targetEmail} added as ${roleName}.`,
        })
      );
      onClose();
    } catch (err) {
      const errData = err?.data?.error;
      const code = errData?.code;
      const msg = errData?.message;

      if (code === 'USER_NOT_FOUND') {
        setEmailError(
          msg || 'No Alturay account exists for this email. Ask them to register first, then add them here.'
        );
      } else if (code === 'ALREADY_MEMBER') {
        setEmailError(
          msg || 'This user is already a member of this business. Change their role from the list instead.'
        );
      } else if (code === 'ROLE_NOT_ASSIGNABLE' || code === 'INSUFFICIENT_ROLE') {
        setRoleError(msg || 'Your role does not allow assigning this role.');
      } else {
        setGeneralError(msg || 'Failed to add member. Please try again.');
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const selectedRoleDesc = role ? ROLE_DESCRIPTIONS[role] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add user"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
          >
            Add user
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="add-member-form">
        {generalError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-light)',
              color: 'var(--danger)',
              fontSize: '13px',
              lineHeight: 1.4,
            }}
          >
            {generalError}
          </div>
        )}

        <FormField
          label="Email address"
          htmlFor="member-email"
          required
          error={emailError}
          helper="Search by name or email among registered Alturay users."
        >
          {/* Autocomplete wrapper positioned directly around the input */}
          <div className="add-member-autocomplete" ref={containerRef}>
            <InputField
              id="member-email"
              type="text"
              placeholder="Type name or email (e.g. alex@example.com)..."
              value={email}
              onChange={handleEmailChange}
              onFocus={() => {
                if (trimmedQuery.length > 0) setDropdownOpen(true);
              }}
              error={Boolean(emailError)}
              autoFocus
              autoComplete="off"
            />

            {/* Dropdown sits right below the input bar */}
            {shouldShowDropdown && (
              <div className="add-member-dropdown" role="listbox">
                <div className="add-member-dropdown__header">
                  {isSearching ? 'Searching users…' : 'Matching Alturay Users'}
                </div>

                {candidateUsers.length > 0 ? (
                  candidateUsers.map((user) => {
                    const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

                    return (
                      <button
                        key={user.id}
                        type="button"
                        role="option"
                        disabled={user.is_member}
                        className="add-member-dropdown__item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <span className="add-member-dropdown__avatar">{initial}</span>
                        <div className="add-member-dropdown__info">
                          <span className="add-member-dropdown__name">{user.name}</span>
                          <span className="add-member-dropdown__email">{user.email}</span>
                        </div>
                        {user.is_member && (
                          <span className="add-member-dropdown__badge">
                            {ROLE_LABELS[user.current_role] || 'Already added'}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="add-member-dropdown__empty">
                    {isSearching
                      ? 'Loading…'
                      : `No registered users found matching "${trimmedQuery}"`}
                  </div>
                )}
              </div>
            )}
          </div>
        </FormField>

        <FormField
          label="Role"
          htmlFor="member-role"
          required
          error={roleError}
        >
          <SelectDropdown
            id="member-role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (roleError) setRoleError('');
            }}
            error={Boolean(roleError)}
          >
            <option value="" disabled>
              Select a role
            </option>
            {assignableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] || r} — {ROLE_DESCRIPTIONS[r] || ''}
              </option>
            ))}
          </SelectDropdown>

          {selectedRoleDesc && (
            <p
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--text-2)',
                lineHeight: 1.4,
              }}
            >
              {selectedRoleDesc}
            </p>
          )}
        </FormField>

        <div style={{ marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setShowRoleDetails((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '12.5px',
              color: 'var(--accent)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <span>{showRoleDetails ? '▾ Hide role breakdown' : '▸ What can each role do?'}</span>
          </button>

          {showRoleDetails && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--hover)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {assignableRoles.map((r) => (
                <div key={r}>
                  <strong style={{ color: 'var(--text)' }}>{ROLE_LABELS[r] || r}: </strong>
                  <span>{ROLE_DESCRIPTIONS[r]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
