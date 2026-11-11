import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NAV_SECTIONS,
  getHomePath,
  resolveSectionPath,
  filterNavForPermissions,
} from '../src/components/layout/navConfig.js';

test('getHomePath based on permissions', () => {
  assert.equal(getHomePath((p) => p === 'dashboard.view'), '/dashboard');
  assert.equal(getHomePath(() => false), '/invoices');
});

test('resolveSectionPath for roles', () => {
  const settingsSection = NAV_SECTIONS.find((s) => s.id === 'settings');

  // Owner/Admin has business.update_profile
  const ownerCan = (p) => p === 'business.update_profile' || p === 'member.view';
  assert.equal(resolveSectionPath(settingsSection, ownerCan), '/settings');

  // Manager has member.view but not business.update_profile
  const managerCan = (p) => p === 'member.view';
  assert.equal(resolveSectionPath(settingsSection, managerCan), '/settings/users');

  // Staff has neither
  const staffCan = () => false;
  assert.equal(resolveSectionPath(settingsSection, staffCan), null);
});

test('filterNavForPermissions filters navigation for Staff', () => {
  // Staff permissions
  const staffPerms = [
    'product.view',
    'customer.view',
    'customer.create',
    'invoice.view',
    'invoice.create',
    'invoice.edit_own',
    'invoice.issue',
  ];
  const staffCan = (p) => staffPerms.includes(p);

  const filtered = filterNavForPermissions(NAV_SECTIONS, staffCan);
  const ids = filtered.map((s) => s.id);

  assert.equal(ids.includes('dashboard'), false);
  assert.equal(ids.includes('settings'), false);
  assert.equal(ids.includes('inventory'), true);
  assert.equal(ids.includes('billing'), true);
  assert.equal(ids.includes('customers'), true);
});

test('filterNavForPermissions keeps Users & access for Manager', () => {
  const managerPerms = [
    'dashboard.view',
    'product.view',
    'product.create',
    'product.update',
    'customer.view',
    'customer.create',
    'customer.update',
    'invoice.view',
    'invoice.create',
    'invoice.edit_any',
    'invoice.edit_own',
    'invoice.issue',
    'invoice.mark_paid',
    'invoice.cancel',
    'business.view',
    'member.view',
  ];
  const managerCan = (p) => managerPerms.includes(p);

  const filtered = filterNavForPermissions(NAV_SECTIONS, managerCan);
  const settingsSection = filtered.find((s) => s.id === 'settings');

  assert.ok(settingsSection);
  assert.equal(settingsSection.path, '/settings/users');
  assert.equal(settingsSection.sidebar.pill, null); // business settings pill filtered out
  assert.equal(settingsSection.sidebar.groups[0].items[0].id, 'users');
});
