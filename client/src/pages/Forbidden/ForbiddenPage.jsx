import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';
import { getHomePath } from '../../components/layout/navConfig';
import EmptyState from '../../components/ui/EmptyState/EmptyState';
import Icon from '../../components/ui/Icon';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { roleLabel, can } = usePermissions();
  const activeBusiness = useSelector((state) => state.business.activeBusiness);
  const businessName = activeBusiness?.name || 'this business';

  const homePath = getHomePath(can);
  const homeLabel = homePath === '/dashboard' ? 'Go to Dashboard' : 'Go to Invoices';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-6)',
      }}
    >
      <EmptyState
        icon={<Icon name="lock" size={32} />}
        title="You don't have access to this page"
        description={
          roleLabel
            ? `Your role in ${businessName} is ${roleLabel}. Ask an Admin or the Owner if you need access.`
            : `You do not have permission to view this page in ${businessName}.`
        }
        actionLabel={homeLabel}
        onAction={() => navigate(homePath)}
      />
    </div>
  );
}
