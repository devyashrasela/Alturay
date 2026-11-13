const test = require('node:test');
const assert = require('node:assert/strict');
const { formatShippingAddress, formatCustomerAddress } = require('../src/services/pdfTemplates/helpers');

test('formatShippingAddress returns formatted custom shipping address when provided', () => {
  const customShipping = {
    line1: '123 Warehouse Way',
    line2: 'Suite 400',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  };
  const customer = {
    address_line1: '99 Client Blvd',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  };

  const res = formatShippingAddress(customShipping, customer);
  assert.equal(res.includes('123 Warehouse Way'), true);
  assert.equal(res.includes('Suite 400'), true);
  assert.equal(res.includes('Mumbai, Maharashtra'), true);
  assert.equal(res.includes('400001'), true);
  assert.equal(res.includes('Pune'), false);
});

test('formatShippingAddress falls back to customer address when custom shipping address is not added', () => {
  const customer = {
    address_line1: '99 Client Blvd',
    address_line2: 'Floor 2',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
  };

  // Case 1: shipping address is null
  const resNull = formatShippingAddress(null, customer);
  assert.equal(resNull.includes('99 Client Blvd'), true);
  assert.equal(resNull.includes('Floor 2'), true);
  assert.equal(resNull.includes('Pune, Maharashtra'), true);

  // Case 2: shipping address is empty string
  const resEmptyStr = formatShippingAddress('', customer);
  assert.equal(resEmptyStr.includes('99 Client Blvd'), true);

  // Case 3: shipping address is empty object
  const resEmptyObj = formatShippingAddress({}, customer);
  assert.equal(resEmptyObj.includes('99 Client Blvd'), true);
});

test('formatShippingAddress returns null when neither shipping nor customer address is provided', () => {
  const res = formatShippingAddress(null, null);
  assert.equal(res, null);
});
