import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLoginErrorMessage,
  getRegisterErrorMessage,
  sanitizeServerMessage,
} from './authErrorMessage.js';

const FALLBACK = 'Unable to sign in right now. Please try again.';
const NETWORK = 'Unable to connect. Check your internet connection and try again.';
const INVALID = 'Invalid email or password. Please try again.';
const REGISTER_FALLBACK = 'Unable to create your account right now. Please try again.';

test('shows the backend invalid-credentials message', () => {
  const error = {
    status: 401,
    data: {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    },
  };

  assert.equal(getLoginErrorMessage(error), 'Invalid email or password.');
});

test('maps a generic 401 to actionable invalid-credentials copy', () => {
  const error = { status: 401, data: { error: { message: 'Unauthorized' } } };
  assert.equal(getLoginErrorMessage(error), INVALID);
});

test('shows the first safe validation detail for a 400', () => {
  const error = {
    status: 400,
    data: {
      error: {
        message: 'Invalid input data.',
        details: [{ field: 'email', message: 'Please provide a valid email address' }],
      },
    },
  };

  assert.equal(getLoginErrorMessage(error), 'Please provide a valid email address');
});

test('shows the rate-limit message', () => {
  const error = {
    status: 429,
    data: { error: { message: 'Too many requests. Please try again later.' } },
  };

  assert.equal(getLoginErrorMessage(error), 'Too many requests. Please try again later.');
});

test('never exposes a 500 server message', () => {
  const error = {
    status: 500,
    data: {
      error: {
        message: 'SequelizeConnectionError: connect ECONNREFUSED 127.0.0.1:3306',
      },
    },
  };

  assert.equal(getLoginErrorMessage(error), FALLBACK);
});

test('handles network and timeout failures separately', () => {
  assert.equal(getLoginErrorMessage({ status: 'FETCH_ERROR' }), NETWORK);
  assert.equal(
    getLoginErrorMessage(new TypeError('Failed to fetch')),
    NETWORK,
  );
  assert.equal(
    getLoginErrorMessage({ status: 'TIMEOUT_ERROR' }),
    'The request timed out. Please try again.',
  );
});

test('handles unexpected response formats safely', () => {
  assert.equal(getLoginErrorMessage({ status: 'PARSING_ERROR' }), FALLBACK);
  assert.equal(getLoginErrorMessage({ status: 400, data: '<html>bad gateway</html>' }), 'Please check your details and try again.');
  assert.equal(getLoginErrorMessage({ status: undefined }), FALLBACK);
});

test('shows a safe registration conflict message', () => {
  const error = {
    status: 409,
    data: {
      error: {
        code: 'CONFLICT',
        message: 'An account with this email already exists.',
      },
    },
  };

  assert.equal(getRegisterErrorMessage(error), 'An account with this email already exists.');
});

test('shows registration validation details', () => {
  const error = {
    status: 400,
    data: {
      error: {
        message: 'Invalid input data.',
        details: [{ field: 'password', message: 'Password must be at least 8 characters long' }],
      },
    },
  };

  assert.equal(
    getRegisterErrorMessage(error),
    'Password must be at least 8 characters long',
  );
});

test('uses registration fallbacks for network and server failures', () => {
  assert.equal(getRegisterErrorMessage({ status: 'FETCH_ERROR' }), NETWORK);
  assert.equal(
    getRegisterErrorMessage({ status: 500, data: { error: { message: 'SQL connection failed' } } }),
    REGISTER_FALLBACK,
  );
});

test('rejects unsafe server text', () => {
  assert.equal(
    sanitizeServerMessage('Error at User.findOne (/app/server.js:12) stack'),
    '',
  );
  assert.equal(
    sanitizeServerMessage('JWT eyJhbGciOiJIUzI1NiJ9.token failed'),
    '',
  );
  assert.equal(sanitizeServerMessage('  Invalid   email or password.  '), 'Invalid email or password.');
});
