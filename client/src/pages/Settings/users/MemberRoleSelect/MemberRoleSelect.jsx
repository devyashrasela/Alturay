import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateMemberRoleMutation } from '../../../../store/api/membersApi';
import { addToast } from '../../../../store/slices/uiSlice';
import { ROLE_LABELS } from '../../../../constants/roles';

export default function MemberRoleSelect({
  businessId,
  member,
  assignableRoles = [],
}) {
  const dispatch = useDispatch();
  const [updateRole, { isLoading }] = useUpdateMemberRoleMutation();
  const [currentRole, setCurrentRole] = useState(member.role);

  // If member's current role is not in assignableRoles, include it so dropdown displays it correctly
  const availableOptions = Array.from(new Set([member.role, ...assignableRoles]));

  const handleChange = async (e) => {
    const nextRole = e.target.value;
    if (nextRole === currentRole) return;

    setCurrentRole(nextRole);
    try {
      await updateRole({
        businessId,
        memberId: member.id,
        role: nextRole,
      }).unwrap();

      const memberName = member.name || member.email;
      const roleName = ROLE_LABELS[nextRole] || nextRole;
      dispatch(
        addToast({
          type: 'success',
          message: `${memberName} is now ${roleName}.`,
        })
      );
    } catch (err) {
      // Revert on failure
      setCurrentRole(member.role);
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to update member role.',
        })
      );
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={isLoading}
        aria-label={`Role for ${member.name || member.email}`}
        className="form-field__input"
        style={{
          height: '32px',
          padding: '2px 28px 2px 10px',
          fontSize: '12.5px',
          fontWeight: 500,
          borderRadius: 'var(--radius-md)',
          background: 'var(--hover)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ACA9A4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='m6 9 6 6 6-6'/%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          backgroundSize: '14px',
        }}
      >
        {availableOptions.map((r) => (
          <option key={r} value={r} style={{ background: 'var(--panel)', color: 'var(--text)' }}>
            {ROLE_LABELS[r] || r}
          </option>
        ))}
      </select>
    </div>
  );
}
