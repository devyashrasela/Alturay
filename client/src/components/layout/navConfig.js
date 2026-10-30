import {
  Building2,
  ClipboardList,
  FilePlus2,
  Gauge,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Package,
  PackagePlus,
  Receipt,
  Settings,
  Sparkles,
  Truck,
  UserCog,
  UserPlus,
  Users,
  Warehouse,
  FileText,
} from 'lucide-react';

/*
 * Single source of truth for the app shell navigation.
 *
 *  - NAV_SECTIONS  → the top bar links. A section with a `sidebar` also gets
 *                    the secondary sidebar; one without it gets full width.
 *  - `soon: true`  → the screen does not exist yet. The item renders disabled
 *                    with a "Soon" tag. Remove the flag when the route ships.
 *  - `isActive`    → optional override when exact/prefix matching is not enough.
 */

const startsWith = (...prefixes) => (pathname) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const NAV_SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    match: startsWith('/dashboard'),
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/products',
    icon: Package,
    match: startsWith('/inventory', '/products'),
    sidebar: {
      title: 'Inventory',
      groups: [
        {
          label: 'Overview',
          items: [
            { label: 'Inventory dashboard', icon: Gauge, path: '/inventory', soon: true },
            { label: 'All products', icon: Package, path: '/products' },
          ],
        },
        {
          label: 'Stock',
          items: [
            { label: 'Add stock', icon: PackagePlus, path: '/inventory/add-stock', soon: true },
            { label: 'Shipments', icon: Truck, path: '/inventory/shipments', soon: true },
          ],
        },
        {
          label: 'Locations',
          items: [
            { label: 'Inventories', icon: Layers, path: '/inventory/inventories', soon: true },
            { label: 'Warehouses', icon: Warehouse, path: '/inventory/warehouses', soon: true },
          ],
        },
        {
          label: 'Reports',
          items: [
            { label: 'Inventory reports', icon: ClipboardList, path: '/inventory/reports', soon: true },
          ],
        },
      ],
    },
  },
  {
    id: 'billing',
    label: 'Billing',
    path: '/invoices',
    icon: Receipt,
    match: startsWith('/billing', '/invoices'),
    sidebar: {
      title: 'Billing',
      groups: [
        {
          label: 'Overview',
          items: [{ label: 'Billing dashboard', icon: Gauge, path: '/billing', soon: true }],
        },
        {
          label: 'Documents',
          items: [
            {
              label: 'Invoices & bills',
              icon: FileText,
              path: '/invoices',
              // Stay highlighted on /invoices/:id but not on /invoices/new.
              isActive: (p) => p === '/invoices' || /^\/invoices\/(?!new$)[^/]+/.test(p),
            },
            { label: 'Create new', icon: FilePlus2, path: '/invoices/new' },
          ],
        },
      ],
    },
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: Users,
    match: startsWith('/customers'),
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    match: startsWith('/settings'),
    sidebar: {
      title: 'Settings',
      groups: [
        {
          label: 'Business',
          items: [
            { label: 'Business settings', icon: Building2, path: '/settings', isActive: (p) => p === '/settings' },
            { label: 'Users & access', icon: UserCog, path: '/settings/users', soon: true },
          ],
        },
        {
          label: 'PDF templates',
          items: [
            { label: 'Invoice template', icon: LayoutTemplate, path: '/settings/templates/invoice', soon: true },
            { label: 'Bill template', icon: Receipt, path: '/settings/templates/bill', soon: true },
          ],
        },
        {
          label: 'Account',
          items: [{ label: 'Personalization', icon: Sparkles, path: '/settings/personalization' }],
        },
      ],
    },
  },
];

export const QUICK_ACTIONS = [
  { label: 'New invoice', icon: FileText, path: '/invoices/new' },
  { label: 'New bill', icon: Receipt, path: '/invoices/new' },
  { label: 'Add product', icon: PackagePlus, path: '/products' },
  { label: 'Add customer', icon: UserPlus, path: '/customers', soon: true },
  { label: 'Receive stock', icon: Truck, path: '/inventory/add-stock', soon: true },
];

export const getActiveSection = (pathname) =>
  NAV_SECTIONS.find((section) => section.match(pathname)) || null;

export const isItemActive = (item, pathname) => {
  if (item.isActive) return item.isActive(pathname);
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};
