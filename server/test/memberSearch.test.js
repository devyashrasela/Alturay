const test = require('node:test');
const assert = require('node:assert/strict');
const memberController = require('../src/controllers/memberController');
const { User, BusinessMember } = require('../src/models');

test('memberController.searchUsers returns matching users and flags existing members', async () => {
  const origUserFindAll = User.findAll;
  const origBMFindAll = BusinessMember.findAll;

  let capturedWhere = null;
  User.findAll = async ({ where, attributes, limit }) => {
    capturedWhere = where;
    return [
      { id: 'u1', name: 'Alice Smith', email: 'alice@example.com' },
      { id: 'u2', name: 'Bob Jones', email: 'bob@example.com' },
    ];
  };

  BusinessMember.findAll = async ({ where }) => {
    assert.equal(where.business_id, 'b-123');
    return [
      { user_id: 'u1', role: 'admin' },
    ];
  };

  try {
    const req = {
      businessId: 'b-123',
      query: { q: 'alice' },
    };
    let responseData = null;
    const res = {
      json: (payload) => {
        responseData = payload;
        return payload;
      },
    };
    const next = (err) => {
      if (err) throw err;
    };

    await memberController.searchUsers(req, res, next);

    assert.ok(responseData);
    assert.equal(responseData.success, true);
    assert.equal(responseData.data.users.length, 2);

    const [u1, u2] = responseData.data.users;
    assert.equal(u1.id, 'u1');
    assert.equal(u1.is_already_member, true);
    assert.equal(u1.current_role, 'admin');

    assert.equal(u2.id, 'u2');
    assert.equal(u2.is_already_member, false);
    assert.equal(u2.current_role, null);

    // Test empty query returns empty list without calling findAll
    let emptyResponse = null;
    await memberController.searchUsers(
      { businessId: 'b-123', query: { q: '   ' } },
      { json: (p) => { emptyResponse = p; return p; } },
      next
    );
    assert.equal(emptyResponse.success, true);
    assert.deepEqual(emptyResponse.data.users, []);
  } finally {
    User.findAll = origUserFindAll;
    BusinessMember.findAll = origBMFindAll;
  }
});
