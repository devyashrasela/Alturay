/*
 * Single source of truth for the app shell navigation.
 * Sampled and matched directly with alturay-shell-reference (1).html
 */

const startsWith = (...prefixes) => (pathname) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const NAV_SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'chart',
    perm: 'dashboard.view',
    match: startsWith('/dashboard'),
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/products',
    icon: 'pkg',
    perm: 'product.view',
    match: startsWith('/inventory', '/products'),
    sidebar: {
      title: 'Inventory',
      tile: 'I',
      icon: 'clipboardlist',
      cta: 'Add product',
      ctaIcon: 'plus',
      ctaPath: '/products?add=1',
      ctaPerm: 'product.create',
      pill: {
        id: 'products',
        label: 'All products',
        icon: 'pkg',
        path: '/products',
        perm: 'product.view',
        isActive: (p) => p === '/products' || p.startsWith('/products/'),
      },
      groups: [
        {
          label: 'Overview',
          items: [
            { id: 'inv-dash', label: 'Overview', icon: 'gauge', path: '/inventory', soon: true },
          ],
        },
        {
          label: 'Stock',
          items: [
            { id: 'add-stock', label: 'Add stock', icon: 'plus', path: '/inventory/add-stock', soon: true },
            { id: 'ship', label: 'Shipments', icon: 'truck', path: '/inventory/shipments', soon: true },
          ],
        },
        {
          label: 'Locations',
          items: [
            { id: 'invs', label: 'Inventories', icon: 'layers', path: '/inventory/inventories', soon: true },
            { id: 'wh', label: 'Warehouses', icon: 'wh', path: '/inventory/warehouses', soon: true },
          ],
        },
        {
          label: 'Reports',
          items: [
            { id: 'inv-rep', label: 'Inventory reports', icon: 'chart', path: '/inventory/reports', soon: true },
          ],
        },
      ],
    },
  },
  {
    id: 'billing',
    label: 'Billing',
    path: '/invoices',
    icon: 'receipt',
    perm: 'invoice.view',
    match: startsWith('/billing', '/invoices'),
    sidebar: {
      title: 'Billing',
      tile: 'B',
      icon: 'receipt',
      cta: 'Create new',
      ctaIcon: 'plus',
      ctaPath: '/invoices/new',
      ctaPerm: 'invoice.create',
      pill: {
        id: 'bill-dash',
        label: 'Billing dashboard',
        icon: 'gauge',
        path: '/billing',
        soon: true,
      },
      groups: [
        {
          label: 'Documents',
          items: [
            {
              id: 'invoices',
              label: 'Invoices & bills',
              icon: 'file',
              path: '/invoices',
              perm: 'invoice.view',
              isActive: (p) => p === '/invoices' || /^\/invoices\/(?!new$)[^/]+/.test(p),
            },
            {
              id: 'create',
              label: 'Create new',
              icon: 'filep',
              path: '/invoices/new',
              perm: 'invoice.create',
            },
          ],
        },
        {
          label: 'PDF templates',
          items: [
            { id: 'tpl-inv', label: 'Invoice template', icon: 'tpl', path: '/billing/templates/invoice', perm: 'billing.configure' },
            { id: 'tpl-bill', label: 'Bill template', icon: 'tpl', path: '/billing/templates/bill', perm: 'billing.configure' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { id: 'billing-settings', label: 'Invoice settings', icon: 'sliders', path: '/billing/settings', perm: 'billing.configure' },
          ],
        },
      ],
    },
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: 'users',
    perm: 'customer.view',
    match: startsWith('/customers'),
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'sliders',
    anyPerm: ['business.update_profile', 'member.view'],
    match: startsWith('/settings'),
    sidebar: {
      title: 'Settings',
      tile: 'S',
      icon: 'sliders',
      cta: '',
      ctaIcon: '',
      pill: {
        id: 'biz',
        label: 'Business settings',
        icon: 'bld',
        path: '/settings',
        perm: 'business.update_profile',
        isActive: (p) => p === '/settings',
      },
      groups: [
        {
          label: 'Business',
          items: [
            { id: 'users', label: 'Users & access', icon: 'user', path: '/settings/users', perm: 'member.view' },
          ],
        },
      ],
    },
  },
];

export const QUICK_ACTIONS = [
  { label: 'New invoice', icon: 'file', path: '/invoices/new', perm: 'invoice.create' },
  { label: 'New bill', icon: 'receipt', path: '/invoices/new?type=bill', perm: 'invoice.create' },
  { label: 'Add product', icon: 'pkg', path: '/products?add=1', perm: 'product.create' },
  { label: 'Add customer', icon: 'userp', path: '/customers?add=1', perm: 'customer.create' },
  { label: 'Receive stock', icon: 'truck', path: '/inventory/add-stock', perm: 'product.create', soon: true },
];

export const getHomePath = (can) => {
  if (typeof can === 'function' && can('dashboard.view')) {
    return '/dashboard';
  }
  return '/invoices';
};

export const resolveSectionPath = (section, can) => {
  if (typeof can !== 'function') return section.path;

  if (section.id === 'settings') {
    if (can('business.update_profile')) return '/settings';
    if (can('member.view')) return '/settings/users';
    return null;
  }

  if (section.perm && !can(section.perm)) {
    return null;
  }

  return section.path;
};

export const filterNavForPermissions = (sections, can) => {
  if (typeof can !== 'function') return sections;

  return sections
    .map((section) => {
      // Check section-level perm
      if (section.perm && !can(section.perm)) return null;
      if (section.anyPerm && !section.anyPerm.some(can)) return null;

      const resolvedPath = resolveSectionPath(section, can);
      if (!resolvedPath) return null;

      if (!section.sidebar) {
        return { ...section, path: resolvedPath };
      }

      const sidebar = { ...section.sidebar };

      // Filter CTA
      if (sidebar.ctaPerm && !can(sidebar.ctaPerm)) {
        sidebar.cta = '';
        sidebar.ctaIcon = '';
        sidebar.ctaPath = '';
      }

      // Filter Pill
      let pill = sidebar.pill;
      if (pill && pill.perm && !can(pill.perm)) {
        pill = null;
      }

      // Filter groups
      const groups = (sidebar.groups || [])
        .map((group) => {
          const items = (group.items || []).filter((item) => {
            if (item.perm && !can(item.perm)) return false;
            return true;
          });
          return items.length > 0 ? { ...group, items } : null;
        })
        .filter(Boolean);

      // If no pill and no groups, skip sidebar or section
      if (!pill && groups.length === 0 && !resolvedPath) {
        return null;
      }

      return {
        ...section,
        path: resolvedPath,
        sidebar: {
          ...sidebar,
          pill,
          groups,
        },
      };
    })
    .filter(Boolean);
};

export const getActiveSection = (pathname) =>
  NAV_SECTIONS.find((section) => section.match(pathname)) || null;

export const isItemActive = (item, pathname) => {
  if (item.isActive) return item.isActive(pathname);
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};
