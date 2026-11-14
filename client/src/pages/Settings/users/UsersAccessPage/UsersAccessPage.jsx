import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useGetMembersQuery,
  useRemoveMemberMutation,
  useLeaveBusinessMutation,
} from '../../../../store/api/membersApi';
import { addToast } from '../../../../store/slices/uiSlice';
import { clearBusiness } from '../../../../store/slices/businessSlice';
import { usePermissions } from '../../../../hooks/usePermissions';
import { formatDate } from '../../../../utils/formatDate';
import Button from '../../../../components/ui/Button/Button';
import Icon from '../../../../components/ui/Icon/Icon';
import RoleBadge from '../../../../components/ui/RoleBadge/RoleBadge';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import { PageLoader } from '../../../../components/ui/Loader/Spinner';
import EmptyState from '../../../../components/ui/EmptyState/EmptyState';
import AddMemberModal from '../AddMemberModal/AddMemberModal';
import MemberRoleSelect from '../MemberRoleSelect/MemberRoleSelect';
import RolesPermissionsMatrix from '../RolesPermissionsMatrix/RolesPermissionsMatrix';
import './UsersAccessPage.css';

export default function UsersAccessPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeBusinessId, activeBusiness } = useSelector((s) => s.business);
  const { role, can, assignableRoles } = usePermissions();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { data, isLoading, isError, refetch } = useGetMembersQuery(activeBusinessId, {
    skip: !activeBusinessId,
  });

  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [leaveBusiness, { isLoading: isLeaving }] = useLeaveBusinessMutation();

  const members = data?.data?.members || [];
  const serverAssignableRoles = data?.data?.assignable_roles || assignableRoles || [];

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const term = search.trim().toLowerCase();
    return members.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        (m.role && m.role.toLowerCase().includes(term))
    );
  }, [members, search]);

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember({
        businessId: activeBusinessId,
        memberId: memberToRemove.id,
      }).unwrap();

      dispatch(
        addToast({
          type: 'success',
          message: `${memberToRemove.name || memberToRemove.email} has been removed.`,
        })
      );
      setMemberToRemove(null);
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to remove member.',
        })
      );
    }
  };

  const handleConfirmLeave = async () => {
    try {
      await leaveBusiness(activeBusinessId).unwrap();
      dispatch(clearBusiness());
      dispatch(
        addToast({
          type: 'success',
          message: `You have left ${activeBusiness?.name || 'the business'}.`,
        })
      );
      navigate('/businesses', { replace: true });
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: err?.data?.error?.message || 'Failed to leave business.',
        })
      );
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <div className="users-page">
        <EmptyState
          icon={<Icon name="users" size={32} />}
          title="Could not load team members"
          description="There was a problem retrieving the members for this business."
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const canAddMember = can('member.add');
  const isManagerReadOnly = role === 'manager';

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">Users & access</h1>
          <p className="users-sub">
            Manage who can access {activeBusiness?.name || 'this business'} and configure their permissions.
          </p>
        </div>

        {canAddMember && (
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            icon={<Icon name="plus" size={16} />}
          >
            Add user
          </Button>
        )}
      </div>

      {/* Manager read-only notice */}
      {isManagerReadOnly && (
        <div className="users-banner">
          <Icon name="shield" size={16} />
          <span>You can view the team, but only Admins and the Owner can add or modify members.</span>
        </div>
      )}

      {/* Main card */}
      <div className="users-card">
        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="users-search-wrap">
            <span className="users-search-icon">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              className="users-search-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="users-count">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </div>
        </div>

        {/* Desktop table */}
        <div className="users-desktop-table">
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--hover)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-2)', width: '38%' }}>
                  User
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-2)', width: '25%' }}>
                  Role
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-2)', width: '22%' }}>
                  Joined
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    fontWeight: 600,
                    color: 'var(--text-2)',
                    textAlign: 'right',
                    width: '15%',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const initial = (member.name || member.email || 'U').charAt(0).toUpperCase();
                const canManage = member.can_manage;

                return (
                  <tr
                    key={member.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {/* User info */}
                    <td style={{ padding: '14px 20px' }}>
                      <div className="user-cell">
                        <div className="user-avatar">{initial}</div>
                        <div className="user-meta">
                          <div className="user-name-row">
                            <span className="user-name">{member.name || 'Unnamed User'}</span>
                            {member.is_you && <span className="user-chip">You</span>}
                          </div>
                          <span className="user-email">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '14px 16px' }}>
                      {canManage ? (
                        <MemberRoleSelect
                          businessId={activeBusinessId}
                          member={member}
                          assignableRoles={serverAssignableRoles}
                        />
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <RoleBadge role={member.role} />
                          {member.role === 'owner' && (
                            <span
                              title="The owner cannot be changed."
                              style={{ display: 'inline-flex', color: 'var(--muted)' }}
                            >
                              <Icon name="lock" size={13} />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Joined date */}
                    <td style={{ padding: '14px 16px', color: 'var(--muted)' }}>
                      {formatDate(member.joined_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {canManage ? (
                        <button
                          type="button"
                          className="btn-icon-danger"
                          title={`Remove ${member.name || member.email}`}
                          aria-label={`Remove ${member.name || member.email}`}
                          onClick={() => setMemberToRemove(member)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked list */}
        <div className="users-mobile-list">
          {filteredMembers.map((member) => {
            const initial = (member.name || member.email || 'U').charAt(0).toUpperCase();
            const canManage = member.can_manage;

            return (
              <div key={member.id} className="user-mobile-card">
                <div className="user-mobile-row">
                  <div className="user-cell">
                    <div className="user-avatar">{initial}</div>
                    <div className="user-meta">
                      <div className="user-name-row">
                        <span className="user-name">{member.name || 'Unnamed User'}</span>
                        {member.is_you && <span className="user-chip">You</span>}
                      </div>
                      <span className="user-email">{member.email}</span>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      className="btn-icon-danger"
                      aria-label={`Remove ${member.name || member.email}`}
                      onClick={() => setMemberToRemove(member)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>

                <div className="user-mobile-row" style={{ paddingTop: '8px' }}>
                  <div>
                    {canManage ? (
                      <MemberRoleSelect
                        businessId={activeBusinessId}
                        member={member}
                        assignableRoles={serverAssignableRoles}
                      />
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Joined {formatDate(member.joined_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix reference */}
      <RolesPermissionsMatrix businessId={activeBusinessId} currentRole={role} />

      {/* Danger Zone: Leave business (hidden for owner) */}
      {role !== 'owner' && (
        <div className="danger-zone">
          <div>
            <div className="danger-zone__title">Leave this business</div>
            <div className="danger-zone__desc">
              You will lose access to {activeBusiness?.name || 'this business'} immediately. You will need
              an invitation from an Admin or Owner to rejoin.
            </div>
          </div>
          <Button
            variant="danger"
            onClick={() => setShowLeaveDialog(true)}
            disabled={isLeaving}
          >
            Leave business
          </Button>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        businessId={activeBusinessId}
        assignableRoles={serverAssignableRoles}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove member?"
        message={`Remove ${memberToRemove?.name || memberToRemove?.email || 'this user'} from ${
          activeBusiness?.name || 'the business'
        }? They will lose access immediately. Any invoices or documents they created will be retained.`}
        confirmLabel="Remove"
        loading={isRemoving}
      />

      {/* Leave Business Confirmation */}
      <ConfirmDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleConfirmLeave}
        title="Leave business?"
        message={`Are you sure you want to leave ${
          activeBusiness?.name || 'this business'
        }? You will lose access immediately.`}
        confirmLabel="Leave business"
        loading={isLeaving}
      />
    </div>
  );
}
