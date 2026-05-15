/**
 * CallMeBot — free WhatsApp text API (no Meta Business app).
 * Setup: WhatsApp +34 644 65 81 16 with "I allow callmebot to send me messages"
 * → you receive an apikey. Add CALLMEBOT_API_KEY to Vercel.
 * @see https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */

function isConfigured() {
  return Boolean(process.env.CALLMEBOT_API_KEY?.trim());
}

function formatPhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

/**
 * Send a plain WhatsApp text to the customer (from your linked WhatsApp / CallMeBot).
 * @param {string} phone - Customer number (077… or 9477…)
 * @param {string} text - Message body (include invoice link for “invoice” delivery)
 */
async function sendText(phone, text) {
  const to = formatPhoneDigits(phone);
  if (!to) {
    throw new Error('Enter a valid WhatsApp number (e.g. 0771234567)');
  }

  const apikey = process.env.CALLMEBOT_API_KEY.trim();
  const phoneParam = encodeURIComponent(`+${to}`);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneParam}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  const res = await fetch(url, { method: 'GET' });
  const body = (await res.text()).trim();

  if (!res.ok) {
    throw new Error(body || `CallMeBot HTTP ${res.status}`);
  }
  if (/^ERROR/i.test(body) || /not allowed|invalid|blocked/i.test(body)) {
    throw new Error(body.slice(0, 280));
  }

  return body;
}

function publicAppOrigin() {
  const fromEnv = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  return '';
}

function buildInvoiceLink(invoiceNumber) {
  const base = publicAppOrigin();
  if (!base) return '';
  return `${base}/invoice/${encodeURIComponent(invoiceNumber)}`;
}

module.exports = {
  isConfigured,
  sendText,
  formatPhoneDigits,
  buildInvoiceLink,
};
