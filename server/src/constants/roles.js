const ROLES = ['owner', 'admin', 'manager', 'staff'];

const ROLE_RANK = {
  staff: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

const PERMISSIONS = {
  owner: [
    'dashboard.view',
    'product.view',
    'product.create',
    'product.update',
    'product.delete',
    'customer.view',
    'customer.create',
    'customer.update',
    'customer.delete',
    'invoice.view',
    'invoice.create',
    'invoice.edit_own',
    'invoice.edit_any',
    'invoice.issue',
    'invoice.mark_paid',
    'invoice.cancel',
    'billing.configure',
    'business.view',
    'business.update_profile',
    'business.update_identity',
    'member.view',
    'member.add',
    'member.update_role',
    'member.remove',
  ],
  admin: [
    'dashboard.view',
    'product.view',
    'product.create',
    'product.update',
    'product.delete',
    'customer.view',
    'customer.create',
    'customer.update',
    'customer.delete',
    'invoice.view',
    'invoice.create',
    'invoice.edit_own',
    'invoice.edit_any',
    'invoice.issue',
    'invoice.mark_paid',
    'invoice.cancel',
    'billing.configure',
    'business.view',
    'business.update_profile',
    'member.view',
    'member.add',
    'member.update_role',
    'member.remove',
  ],
  manager: [
    'dashboard.view',
    'product.view',
    'product.create',
    'product.update',
    'customer.view',
    'customer.create',
    'customer.update',
    'invoice.view',
    'invoice.create',
    'invoice.edit_own',
    'invoice.edit_any',
    'invoice.issue',
    'invoice.mark_paid',
    'invoice.cancel',
    'business.view',
    'member.view',
  ],
  staff: [
    'product.view',
    'customer.view',
    'customer.create',
    'invoice.view',
    'invoice.create',
    'invoice.edit_own',
    'invoice.issue',
    'business.view',
  ],
};

const hasPermission = (role, perm) => PERMISSIONS[role]?.includes(perm) ?? false;
const permissionsFor = (role) => [...(PERMISSIONS[role] ?? [])];
const outranks = (actorRole, targetRole) => (ROLE_RANK[actorRole] || 0) > (ROLE_RANK[targetRole] || 0);
const assignableRoles = (actorRole) =>
  hasPermission(actorRole, 'member.add')
    ? ROLES.filter((r) => r !== 'owner' && outranks(actorRole, r))
    : [];

const ROLE_META = {
  owner: {
    label: 'Owner',
    description: 'Full control of the business, including identity settings and Admins.',
  },
  admin: {
    label: 'Admin',
    description: 'Manages business settings, billing configuration and team members below Admin.',
  },
  manager: {
    label: 'Manager',
    description: 'Manages products, customers and invoices. Can view the dashboard and the team.',
  },
  staff: {
    label: 'Staff',
    description: 'Creates customers and invoices and edits their own drafts. No settings or financial dashboard.',
  },
};

module.exports = {
  ROLES,
  ROLE_RANK,
  PERMISSIONS,
  ROLE_META,
  hasPermission,
  permissionsFor,
  outranks,
  assignableRoles,
};
