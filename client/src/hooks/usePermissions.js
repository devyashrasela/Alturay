import { useSelector } from 'react-redux';
import { useGetAccessQuery } from '../store/api/membersApi';
import { ROLE_LABELS } from '../constants/roles';

export function usePermissions() {
  const activeBusinessId = useSelector((state) => state.business.activeBusinessId);

  const { data, isLoading, isFetching, error } = useGetAccessQuery(activeBusinessId, {
    skip: !activeBusinessId,
  });

  const access = data?.data;
  const role = access?.role || null;
  const roleLabel = access?.role_label || (role ? ROLE_LABELS[role] || role : '');
  const permissions = Array.isArray(access?.permissions) ? access.permissions : [];
  const assignableRoles = Array.isArray(access?.assignable_roles) ? access.assignable_roles : [];

  const can = (permission) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const canAny = (...perms) => {
    if (!perms || perms.length === 0) return true;
    const flatPerms = perms.flat();
    return flatPerms.some((p) => permissions.includes(p));
  };

  return {
    role,
    roleLabel,
    permissions,
    assignableRoles,
    isLoading: Boolean(activeBusinessId && (isLoading || (isFetching && !access))),
    error,
    can,
    canAny,
  };
}

export default usePermissions;
