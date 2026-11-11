import React from 'react';
import { ROLE_LABELS } from '../../../constants/roles';

export default function RoleBadge({ role, size = 'md', className = '' }) {
  const normalized = (role || '').toLowerCase();
  const label = ROLE_LABELS[normalized] || role || 'Member';

  const roleStyles = {
    owner: {
      color: 'var(--color-purple)',
      backgroundColor: 'var(--color-purple-light)',
      borderColor: 'color-mix(in srgb, var(--color-purple) 25%, transparent)',
    },
    admin: {
      color: 'var(--accent)',
      backgroundColor: 'color-mix(in srgb, var(--accent) 16%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent) 28%, transparent)',
    },
    manager: {
      color: 'var(--color-success)',
      backgroundColor: 'var(--color-success-light)',
      borderColor: 'color-mix(in srgb, var(--color-success) 25%, transparent)',
    },
    staff: {
      color: 'var(--text-2)',
      backgroundColor: 'var(--chip)',
      borderColor: 'var(--border)',
    },
  };

  const currentStyle = roleStyles[normalized] || roleStyles.staff;

  const sizeStyles =
    size === 'sm'
      ? {
          padding: '1px 7px',
          fontSize: '11px',
          lineHeight: '1.4',
        }
      : {
          padding: '3px 9px',
          fontSize: '12px',
          lineHeight: '1.45',
        };

  return (
    <span
      className={`role-badge role-badge--${normalized} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: 'var(--radius-full)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        border: '1px solid',
        ...sizeStyles,
        ...currentStyle,
      }}
    >
      {label}
    </span>
  );
}
