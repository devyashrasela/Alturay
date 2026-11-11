import React from 'react';
import { Outlet } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { PageLoader } from '../components/ui/Loader/Spinner';
import ForbiddenPage from '../pages/Forbidden/ForbiddenPage';

export default function RequirePermission({ permission, anyOf, allOf }) {
  const { can, canAny, permissions, isLoading } = usePermissions();

  if (isLoading) {
    return <PageLoader />;
  }

  let allowed = true;

  if (permission) {
    allowed = allowed && can(permission);
  }

  if (anyOf && anyOf.length > 0) {
    allowed = allowed && canAny(...anyOf);
  }

  if (allOf && allOf.length > 0) {
    allowed = allowed && allOf.every((p) => permissions.includes(p));
  }

  if (!allowed) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
