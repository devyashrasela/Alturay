export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

export const ROLE_DESCRIPTIONS = {
  owner: 'Full control of the business, including identity settings and Admins.',
  admin: 'Manages business settings, billing configuration and team members below Admin.',
  manager: 'Manages products, customers and invoices. Can view the dashboard and the team.',
  staff: 'Creates customers and invoices and edits their own drafts. Personal billing dashboard.',
};

export const PERMISSION_LABELS = {
  'dashboard.view': { group: 'Dashboard', label: 'View financial dashboard' },
  'product.view': { group: 'Products', label: 'View products' },
  'product.create': { group: 'Products', label: 'Create products' },
  'product.update': { group: 'Products', label: 'Update products' },
  'product.delete': { group: 'Products', label: 'Delete products' },
  'customer.view': { group: 'Customers', label: 'View customers' },
  'customer.create': { group: 'Customers', label: 'Create customers' },
  'customer.update': { group: 'Customers', label: 'Update customers' },
  'customer.delete': { group: 'Customers', label: 'Delete customers' },
  'invoice.view': { group: 'Invoices & Billing', label: 'View invoices & bills' },
  'invoice.create': { group: 'Invoices & Billing', label: 'Create invoices & bills' },
  'invoice.edit_own': { group: 'Invoices & Billing', label: 'Edit own draft invoices' },
  'invoice.edit_any': { group: 'Invoices & Billing', label: 'Edit any draft invoice' },
  'invoice.issue': { group: 'Invoices & Billing', label: 'Issue invoices' },
  'invoice.mark_paid': { group: 'Invoices & Billing', label: 'Mark invoices as paid' },
  'invoice.cancel': { group: 'Invoices & Billing', label: 'Cancel invoices' },
  'billing.configure': { group: 'Invoices & Billing', label: 'Configure billing & templates' },
  'business.view': { group: 'Business Settings', label: 'View business details' },
  'business.update_profile': { group: 'Business Settings', label: 'Update business profile' },
  'business.update_identity': { group: 'Business Settings', label: 'Update QR prefix & identity' },
  'member.view': { group: 'Team & Access', label: 'View team members & roles' },
  'member.add': { group: 'Team & Access', label: 'Add new members' },
  'member.update_role': { group: 'Team & Access', label: 'Change member roles' },
  'member.remove': { group: 'Team & Access', label: 'Remove members' },
};
