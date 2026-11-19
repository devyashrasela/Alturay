const path = require('path');
const net = require('net');
const dns = require('dns').promises;

const MM = 72 / 25.4; // PDF points per millimetre (~2.835)
const FONT = { regular: 'App-Regular', bold: 'App-Bold' };

const registerFonts = (doc) => {
  doc.registerFont(FONT.regular, path.join(__dirname, 'fonts', 'NotoSans-Regular.ttf'));
  doc.registerFont(FONT.bold, path.join(__dirname, 'fonts', 'NotoSans-Bold.ttf'));
};

const localeFor = (currency) => (currency === 'INR' ? 'en-IN' : 'en-US');

const numberFmt = (value, currency = 'INR') =>
  new Intl.NumberFormat(localeFor(currency), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(value) || 0);

// currency is free text in Business Settings, so never let a bad code throw
const moneyFmt = (value, currency = 'INR') => {
  try {
    return new Intl.NumberFormat(localeFor(currency), {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `${currency} ${numberFmt(value, currency)}`;
  }
};

const formatDate = (d) => {
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d));
  } catch {
    return String(d);
  }
};

// subtotal already includes tax in this codebase, so derive the pre-tax figure
const totalsOf = (invoice) => {
  const tax = Number(invoice.tax_total) || 0;
  const subtotal = Number(invoice.subtotal) || 0;
  const discount =
    (Number(invoice.discount_amount) || 0) +
    (subtotal * (Number(invoice.discount_percent) || 0)) / 100;
  return {
    preTax: Math.max(0, subtotal - tax),
    tax,
    discount,
    total: Number(invoice.total_amount) || 0,
  };
};

// Private IP detection to guard against SSRF
const isPrivateIp = (ip) =>
  net.isIP(ip) === 4
    ? /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)
    : /^(::1|fc|fd|fe80)/i.test(ip);

const loadLogo = async (url) => {
  try {
    if (!url) return null;
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (!isLocalhost) {
      const { address } = await dns.lookup(u.hostname);
      if (isPrivateIp(address)) return null;
    }
    const res = await fetch(u, { signal: AbortSignal.timeout(2500), redirect: 'error' });
    if (!res.ok || !/^image\/(png|jpe?g|webp)/.test(res.headers.get('content-type') || '')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length <= 512 * 1024 ? buf : null;
  } catch {
    return null; // skip the logo, never fail the PDF
  }
};

const toPdfCompatibleImageUrl = (url) => {
  if (typeof url !== 'string' || !url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('cloudinary.com')) return url;
    const segments = parsed.pathname.split('/');
    const uploadIndex = segments.indexOf('upload');
    if (uploadIndex === -1) return url;
    const tail = segments.slice(uploadIndex + 1);
    const versionIndex = tail.findIndex((segment) => /^v\d+$/.test(segment));
    const transformationPattern = /^(?:c_(?:fill|crop|thumb|scale)|w_|h_|ar_|g_|x_|y_|z_|r_|f_|q_)/;
    const firstAssetIndex = versionIndex >= 0
      ? versionIndex
      : tail.findIndex((segment) => !segment.includes(',') && !transformationPattern.test(segment));
    const assetStart = firstAssetIndex >= 0 ? firstAssetIndex : tail.length;
    const assetPath = tail.slice(assetStart);
    if (assetPath.length > 0) {
      // fl_png32 forces an 8-bit RGBA PNG. PDFKit mis-builds the alpha mask for
      // palette PNGs with a bit depth below 8, which renders the logo clipped.
      segments.splice(uploadIndex + 1, tail.length, 'f_png,fl_png32', ...assetPath);
      parsed.pathname = segments.join('/');
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

// PDFKit 0.16 derives an indexed PNG's alpha mask assuming one palette index per
// decoded byte. png-js returns rows packed for bit depths below 8, so a 1/2/4-bit
// palette image with transparency loses half of its pixels and mis-reads the rest.
const hasUnsupportedIndexedAlpha = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 33) return false;
  if (buffer.readUInt32BE(0) !== 0x89504e47) return false; // not a PNG
  if (buffer[25] !== 3 || buffer[24] >= 8) return false; // needs indexed + bit depth < 8

  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'tRNS') return true;
    if (type === 'IDAT' || type === 'IEND') return false;
    offset += 12 + length;
  }
  return false;
};

const drawBusinessLogo = (doc, logoBuffer, {
  x,
  y,
  maxWidth = 120,
  maxHeight = 56,
  align = 'right',
  valign = 'center',
} = {}) => {
  if (!logoBuffer || hasUnsupportedIndexedAlpha(logoBuffer)) return false;
  try {
    const image = typeof doc.openImage === 'function' ? doc.openImage(logoBuffer) : null;
    if (!image?.width || !image?.height) return false;

    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = align === 'right' ? x + maxWidth - drawWidth : x;
    const drawY = valign === 'center' ? y + (maxHeight - drawHeight) / 2 : y;

    doc.image(logoBuffer, drawX, drawY, {
      width: drawWidth,
      height: drawHeight,
    });
    return true;
  } catch {
    return false;
  }
};

const formatShippingAddress = (addr) => {
  if (!addr) return null;
  if (typeof addr === 'string') {
    const trimmed = addr.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof addr === 'object') {
    const parts = [
      addr.line1,
      addr.line2,
      [addr.city, addr.state].filter(Boolean).join(', '),
      addr.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  }
  return null;
};

const formatCustomerAddress = (customer) => {
  if (!customer) return null;
  const parts = [
    customer.address_line1,
    customer.address_line2,
    [customer.city, customer.state].filter(Boolean).join(', '),
    customer.pincode ? `PIN: ${customer.pincode}` : null,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join('\n');
  return customer.formatted_address || null;
};

const formatBusinessAddress = (business) => {
  if (!business) return null;
  const parts = [
    business.address_line1,
    business.address_line2,
    [business.city, business.state].filter(Boolean).join(', '),
    business.pincode ? `PIN: ${business.pincode}` : null,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join('\n');
  return business.formatted_address || null;
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  check: 'Check / Cheque',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  net_banking: 'Net Banking',
  other: 'Other',
};

const formatPaymentMethods = (methods) => {
  if (!methods) return null;
  const arr = Array.isArray(methods) ? methods : (typeof methods === 'string' ? [methods] : []);
  if (arr.length === 0) return null;
  return arr.map((m) => PAYMENT_LABELS[m] || m).join(', ');
};

module.exports = {
  MM,
  FONT,
  registerFonts,
  localeFor,
  numberFmt,
  moneyFmt,
  formatDate,
  totalsOf,
  loadLogo,
  toPdfCompatibleImageUrl,
  drawBusinessLogo,
  formatBusinessAddress,
  formatCustomerAddress,
  formatShippingAddress,
  formatPaymentMethods,
};
