const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ROLES,
  ROLE_RANK,
  PERMISSIONS,
  hasPermission,
  outranks,
  assignableRoles,
} = require('../src/constants/roles');
const {
  canAssign,
  canManageTarget,
  decideRoleChange,
  decideRemoval,
} = require('../src/services/memberRules');

test('Roles catalog & hierarchy', () => {
  assert.deepEqual(ROLES, ['owner', 'admin', 'manager', 'staff']);
  assert.equal(ROLE_RANK.owner > ROLE_RANK.admin, true);
  assert.equal(ROLE_RANK.admin > ROLE_RANK.manager, true);
  assert.equal(ROLE_RANK.manager > ROLE_RANK.staff, true);
});

test('Assignable roles rule', () => {
  assert.deepEqual(assignableRoles('owner'), ['admin', 'manager', 'staff']);
  assert.deepEqual(assignableRoles('admin'), ['manager', 'staff']);
  assert.deepEqual(assignableRoles('manager'), []);
  assert.deepEqual(assignableRoles('staff'), []);
});

test('Permissions matrix checks', () => {
  assert.equal(hasPermission('owner', 'business.update_identity'), true);
  assert.equal(hasPermission('admin', 'business.update_identity'), false);
  assert.equal(hasPermission('admin', 'billing.configure'), true);
  assert.equal(hasPermission('manager', 'billing.configure'), false);
  assert.equal(hasPermission('manager', 'product.create'), true);
  assert.equal(hasPermission('staff', 'product.create'), false);
  assert.equal(hasPermission('staff', 'customer.create'), true);
  assert.equal(hasPermission('staff', 'invoice.create'), true);
  assert.equal(hasPermission('staff', 'dashboard.view'), true);
});

test('memberRules: decideRoleChange', () => {
  // Admin cannot promote to admin
  const res1 = decideRoleChange({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u2', role: 'staff' },
    newRole: 'admin',
  });
  assert.equal(res1.ok, false);
  assert.equal(res1.code, 'ROLE_NOT_ASSIGNABLE');

  // Admin can promote staff to manager
  const res2 = decideRoleChange({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u2', role: 'staff' },
    newRole: 'manager',
  });
  assert.equal(res2.ok, true);

  // Admin cannot change another admin
  const res3 = decideRoleChange({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u3', role: 'admin' },
    newRole: 'staff',
  });
  assert.equal(res3.ok, false);
  assert.equal(res3.code, 'INSUFFICIENT_ROLE');

  // Cannot change own role
  const res4 = decideRoleChange({
    actorRole: 'owner',
    actorUserId: 'u1',
    target: { user_id: 'u1', role: 'owner' },
    newRole: 'admin',
  });
  assert.equal(res4.ok, false);
  assert.equal(res4.code, 'CANNOT_MODIFY_SELF');
});

test('memberRules: decideRemoval', () => {
  // Owner cannot be removed
  const res1 = decideRemoval({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u2', role: 'owner' },
  });
  assert.equal(res1.ok, false);
  assert.equal(res1.code, 'OWNER_IMMUTABLE');

  // Admin cannot remove admin
  const res2 = decideRemoval({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u3', role: 'admin' },
  });
  assert.equal(res2.ok, false);
  assert.equal(res2.code, 'INSUFFICIENT_ROLE');

  // Admin can remove staff
  const res3 = decideRemoval({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u4', role: 'staff' },
  });
  assert.equal(res3.ok, true);

  // Self removal not allowed via member endpoint
  const res4 = decideRemoval({
    actorRole: 'admin',
    actorUserId: 'u1',
    target: { user_id: 'u1', role: 'admin' },
  });
  assert.equal(res4.ok, false);
  assert.equal(res4.code, 'CANNOT_MODIFY_SELF');

  // Manager cannot remove staff
  const res5 = decideRemoval({
    actorRole: 'manager',
    actorUserId: 'u1',
    target: { user_id: 'u4', role: 'staff' },
  });
  assert.equal(res5.ok, false);
  assert.equal(res5.code, 'INSUFFICIENT_ROLE');
});
