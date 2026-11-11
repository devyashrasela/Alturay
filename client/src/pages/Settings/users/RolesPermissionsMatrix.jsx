import React, { useState, useMemo } from 'react';
import { useGetRolesQuery } from '../../../store/api/membersApi';
import { PERMISSION_LABELS, ROLE_LABELS } from '../../../constants/roles';
import Icon from '../../../components/ui/Icon';

export default function RolesPermissionsMatrix({ businessId, currentRole }) {
  const [collapsed, setCollapsed] = useState(true);
  const { data, isLoading } = useGetRolesQuery(businessId, { skip: !businessId });

  const roles = data?.data?.roles || [];

  // Group capabilities by group
  const groupedPermissions = useMemo(() => {
    // Collect all unique permissions across all roles
    const allPerms = Array.from(
      new Set(roles.flatMap((r) => r.permissions || []))
    );

    const groups = {};
    for (const permKey of allPerms) {
      const meta = PERMISSION_LABELS[permKey] || {
        group: 'Other',
        label: permKey,
      };
      if (!groups[meta.group]) {
        groups[meta.group] = [];
      }
      groups[meta.group].push({
        key: permKey,
        label: meta.label,
      });
    }

    return groups;
  }, [roles]);

  if (isLoading || roles.length === 0) {
    return null;
  }

  return (
    <div
      className="bcard"
      style={{
        marginTop: '24px',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--panel)',
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text)',
        }}
        aria-expanded={!collapsed}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--icon)',
            }}
          >
            <Icon name="shield" size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
              Roles & permissions reference
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              Overview of capabilities across Owner, Admin, Manager, and Staff roles
            </div>
          </div>
        </div>
        <div
          style={{
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--muted)',
          }}
        >
          <Icon name="chev" size={16} />
        </div>
      </button>

      {!collapsed && (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12.5px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--hover)', borderBottom: '1px solid var(--border)' }}>
                <th
                  style={{
                    padding: '10px 16px',
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    minWidth: '220px',
                  }}
                >
                  Capability
                </th>
                {roles.map((r) => {
                  const isUserRole = r.id === currentRole;
                  return (
                    <th
                      key={r.id}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: isUserRole ? 'var(--accent)' : 'var(--text-2)',
                        background: isUserRole
                          ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                          : undefined,
                        minWidth: '90px',
                      }}
                    >
                      {ROLE_LABELS[r.id] || r.label || r.id}
                      {isUserRole && (
                        <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--accent)' }}>
                          (You)
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedPermissions).map(([groupName, items]) => (
                <React.Fragment key={groupName}>
                  <tr style={{ background: 'color-mix(in srgb, var(--hover) 50%, var(--panel))' }}>
                    <td
                      colSpan={roles.length + 1}
                      style={{
                        padding: '8px 16px',
                        fontWeight: 600,
                        fontSize: '11.5px',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {groupName}
                    </td>
                  </tr>
                  {items.map((perm) => (
                    <tr
                      key={perm.key}
                      style={{
                        borderBottom: '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
                      }}
                    >
                      <td
                        style={{
                          padding: '9px 16px 9px 24px',
                          color: 'var(--text)',
                        }}
                      >
                        {perm.label}
                      </td>
                      {roles.map((r) => {
                        const hasPerm = (r.permissions || []).includes(perm.key);
                        const isUserRole = r.id === currentRole;
                        return (
                          <td
                            key={r.id}
                            style={{
                              padding: '9px 14px',
                              textAlign: 'center',
                              background: isUserRole
                                ? 'color-mix(in srgb, var(--accent) 4%, transparent)'
                                : undefined,
                            }}
                          >
                            {hasPerm ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-success)',
                                  fontWeight: 700,
                                }}
                                aria-label="Allowed"
                              >
                                ✓
                              </span>
                            ) : (
                              <span style={{ color: 'var(--muted)' }} aria-label="Not allowed">
                                –
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
