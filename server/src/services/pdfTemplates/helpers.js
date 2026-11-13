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
    if (typeof url === 'string' && /^data:image\/(png|jpe?g);base64,/i.test(url)) {
      const base64Data = url.replace(/^data:image\/(png|jpe?g);base64,/i, '');
      const buf = Buffer.from(base64Data, 'base64');
      if (buf.length > 2 * 1024 * 1024) return null;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
      return isPng || isJpg ? buf : null;
    }

    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (!isLocalhost) {
      const { address } = await dns.lookup(u.hostname);
      if (isPrivateIp(address)) return null;
    }
    const res = await fetch(u, {
      signal: AbortSignal.timeout(3000),
      redirect: 'error',
      headers: { Accept: 'image/png,image/jpeg;q=0.9,*/*;q=0.5' },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 2 * 1024 * 1024) return null;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
    return isPng || isJpg ? buf : null;
  } catch {
    return null; // skip the logo, never fail the PDF
  }
};

const formatShippingAddress = (addr, fallbackCustomer = null) => {
  let res = null;
  if (addr) {
    if (typeof addr === 'string') {
      const trimmed = addr.trim();
      res = trimmed.length > 0 ? trimmed : null;
    } else if (typeof addr === 'object') {
      const parts = [
        addr.line1,
        addr.line2,
        [addr.city, addr.state].filter(Boolean).join(', '),
        addr.pincode,
      ].filter(Boolean);
      res = parts.length > 0 ? parts.join('\n') : null;
    }
  }
  if (!res && fallbackCustomer) {
    res = formatCustomerAddress(fallbackCustomer);
  }
  return res;
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
  formatBusinessAddress,
  formatCustomerAddress,
  formatShippingAddress,
  formatPaymentMethods,
};
