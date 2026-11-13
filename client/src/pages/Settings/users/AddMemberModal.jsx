import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import Modal from '../../../components/ui/Modal/Modal';
import Button from '../../../components/ui/Button/Button';
import FormField from '../../../components/ui/FormField/FormField';
import InputField from '../../../components/ui/Input/InputField';
import SelectDropdown from '../../../components/ui/Select/SelectDropdown';
import { useAddMemberMutation } from '../../../store/api/membersApi';
import { addToast } from '../../../store/slices/uiSlice';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../../constants/roles';

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
  const [role, setRole] = useState('');
  const [emailError, setEmailError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showRoleDetails, setShowRoleDetails] = useState(false);

  const submittingRef = useRef(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole(assignableRoles.length === 1 ? assignableRoles[0] : '');
      setEmailError('');
      setRoleError('');
      setGeneralError('');
      setShowRoleDetails(false);
      submittingRef.current = false;
    }
  }, [isOpen, assignableRoles]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submittingRef.current || isLoading) return;

    let hasClientError = false;
    setEmailError('');
    setRoleError('');
    setGeneralError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasClientError = true;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
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
        email: trimmedEmail,
        role,
      }).unwrap();

      const roleName = ROLE_LABELS[role] || role;
      dispatch(
        addToast({
          type: 'success',
          message: `${trimmedEmail} added as ${roleName}.`,
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
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          helper="The person must already have an Alturay account."
        >
          <InputField
            id="member-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            error={Boolean(emailError)}
            autoFocus
          />
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
