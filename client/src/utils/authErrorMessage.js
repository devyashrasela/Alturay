const FALLBACK = 'Unable to sign in right now. Please try again.';
const REGISTER_FALLBACK = 'Unable to create your account right now. Please try again.';
const NETWORK_FALLBACK = 'Unable to connect. Check your internet connection and try again.';
const TIMEOUT_FALLBACK = 'The request timed out. Please try again.';
const INVALID_CREDENTIALS = 'Invalid email or password. Please try again.';
const INVALID_INPUT = 'Please check your details and try again.';
const RATE_LIMIT = 'Too many attempts. Please wait a moment and try again.';
const ACCOUNT_EXISTS = 'An account with this email already exists. Please sign in instead.';

const GENERIC_MESSAGES = /^(invalid input data|bad request|validation failed|unauthorized|forbidden)\.?$/i;

const UNSAFE_PATTERNS = [
  /\bstack\b/i,
  /\bat\s+[\w$.]+\s*\(/i,
  /\bnode_modules\b/i,
  /\b(?:mysql|postgres(?:ql)?|sequelize|prisma|mongoose|mongodb|database)\b/i,
  /\b(?:econnrefused|etimedout|enotfound|econnreset)\b/i,
  /\b(?:stack trace|traceback|internal server|syntaxerror|password[_ -]?hash|secret|jwt|bearer)\b/i,
  /eyJ[A-Za-z0-9_-]{10,}\./,
  /<\s*(?:html|script|body|!doctype)/i,
  /[<>]/,
];

/**
 * Server messages are rendered as text, but still need to be checked so an
 * unexpected backend error cannot leak stack traces, SQL, or credentials.
 */
export function sanitizeServerMessage(value) {
  if (typeof value !== 'string') return '';

  const message = Array.from(value, (character) => {
    const code = character.codePointAt(0);
    return code <= 0x1f || code === 0x7f ? ' ' : character;
  })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  if (!message || message.length > 200) return '';
  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(message))) return '';

  return message;
}

function readDirectMessage(data) {
  if (typeof data === 'string') return sanitizeServerMessage(data);
  if (!data || typeof data !== 'object') return '';

  const nestedError = data.error;
  const candidates = [
    nestedError && typeof nestedError === 'object' ? nestedError.message : '',
    data.message,
    typeof nestedError === 'string' ? nestedError : '',
  ];

  for (const candidate of candidates) {
    const safe = sanitizeServerMessage(candidate);
    if (safe) return safe;
  }

  return '';
}

function readDetailMessage(data) {
  const details = data && typeof data === 'object' ? data.error?.details : null;
  if (!Array.isArray(details)) return '';

  for (const detail of details) {
    const safe = sanitizeServerMessage(detail?.message);
    if (safe) return safe;
  }

  return '';
}

function isUsefulMessage(message) {
  return Boolean(message) && !GENERIC_MESSAGES.test(message);
}

/**
 * Converts an RTK Query login error into copy that is safe to show a user.
 * The backend contract is { success:false, error:{ code, message, details? } }.
 */
export function getLoginErrorMessage(error) {
  const status = error?.status;

  if (status === 'FETCH_ERROR') return NETWORK_FALLBACK;
  if (status === 'TIMEOUT_ERROR') return TIMEOUT_FALLBACK;
  if (status === 'PARSING_ERROR') return FALLBACK;

  if (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return NETWORK_FALLBACK;
  }

  const data = error?.data;
  const directMessage = readDirectMessage(data);

  if (status === 401) {
    return isUsefulMessage(directMessage) ? directMessage : INVALID_CREDENTIALS;
  }

  if (status === 429) {
    return directMessage || RATE_LIMIT;
  }

  if (typeof status === 'number' && status >= 400 && status < 500) {
    if (status === 400) {
      return readDetailMessage(data)
        || (isUsefulMessage(directMessage) ? directMessage : INVALID_INPUT);
    }

    return isUsefulMessage(directMessage) ? directMessage : FALLBACK;
  }

  return FALLBACK;
}

/**
 * Converts an RTK Query registration error into safe, actionable copy.
 */
export function getRegisterErrorMessage(error) {
  const status = error?.status;

  if (status === 'FETCH_ERROR') return NETWORK_FALLBACK;
  if (status === 'TIMEOUT_ERROR') return TIMEOUT_FALLBACK;
  if (status === 'PARSING_ERROR') return REGISTER_FALLBACK;

  if (error instanceof Error && /failed to fetch|networkerror|load failed/i.test(error.message)) {
    return NETWORK_FALLBACK;
  }

  const data = error?.data;
  const directMessage = readDirectMessage(data);

  if (status === 400) {
    return readDetailMessage(data)
      || (isUsefulMessage(directMessage) ? directMessage : INVALID_INPUT);
  }

  if (status === 409) {
    return isUsefulMessage(directMessage) ? directMessage : ACCOUNT_EXISTS;
  }

  if (status === 429) {
    return directMessage || RATE_LIMIT;
  }

  if (typeof status === 'number' && status >= 400 && status < 500) {
    return isUsefulMessage(directMessage) ? directMessage : REGISTER_FALLBACK;
  }

  return REGISTER_FALLBACK;
}

export default getLoginErrorMessage;
