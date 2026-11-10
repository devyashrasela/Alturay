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
    match: startsWith('/dashboard'),
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/products',
    icon: 'pkg',
    match: startsWith('/inventory', '/products'),
    sidebar: {
      title: 'Inventory',
      tile: 'I',
      icon: 'clipboardlist',
      cta: 'Add product',
      ctaIcon: 'plus',
      ctaPath: '/products?add=1',
      pill: {
        id: 'products',
        label: 'All products',
        icon: 'pkg',
        path: '/products',
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
    match: startsWith('/billing', '/invoices'),
    sidebar: {
      title: 'Billing',
      tile: 'B',
      icon: 'receipt',
      cta: 'Create new',
      ctaIcon: 'plus',
      ctaPath: '/invoices/new',
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
              isActive: (p) => p === '/invoices' || /^\/invoices\/(?!new$)[^/]+/.test(p),
            },
            {
              id: 'create',
              label: 'Create new',
              icon: 'filep',
              path: '/invoices/new',
            },
          ],
        },
        {
          label: 'PDF templates',
          items: [
            { id: 'tpl-inv', label: 'Invoice template', icon: 'tpl', path: '/billing/templates/invoice' },
            { id: 'tpl-bill', label: 'Bill template', icon: 'tpl', path: '/billing/templates/bill' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { id: 'billing-settings', label: 'Invoice settings', icon: 'sliders', path: '/billing/settings' },
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
    match: startsWith('/customers'),
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: 'sliders',
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
        isActive: (p) => p === '/settings',
      },
      groups: [
        {
          label: 'Business',
          items: [
            { id: 'users', label: 'Users & access', icon: 'user', path: '/settings/users', soon: true },
          ],
        },
      ],
    },
  },
];

export const QUICK_ACTIONS = [
  { label: 'New invoice', icon: 'file', path: '/invoices/new' },
  { label: 'New bill', icon: 'receipt', path: '/invoices/new?type=bill' },
  { label: 'Add product', icon: 'pkg', path: '/products?add=1' },
  { label: 'Add customer', icon: 'userp', path: '/customers?add=1' },
  { label: 'Receive stock', icon: 'truck', path: '/inventory/add-stock', soon: true },
];

export const getActiveSection = (pathname) =>
  NAV_SECTIONS.find((section) => section.match(pathname)) || null;

export const isItemActive = (item, pathname) => {
  if (item.isActive) return item.isActive(pathname);
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};
