import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

export function Can({ permission, anyOf, allOf, fallback = null, children }) {
  const { can, canAny, permissions } = usePermissions();

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
    return fallback;
  }

  return <>{children}</>;
}

export default Can;
