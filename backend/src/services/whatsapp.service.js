const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

function isConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 9) return null;
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

function formatPhoneDisplay(phone) {
  const e164 = formatPhone(phone);
  if (!e164) return phone;
  if (e164.startsWith('94') && e164.length === 11) {
    return `0${e164.slice(2, 4)} ${e164.slice(4, 7)} ${e164.slice(7)}`;
  }
  return `+${e164}`;
}

async function uploadPdf(pdfBuffer, filename) {
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', 'application/pdf');
  form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
      body: form,
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'WhatsApp media upload failed');
  }
  return data.id;
}

async function sendDocument(to, mediaId, caption, filename) {
  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          id: mediaId,
          caption: caption || undefined,
          filename,
        },
      }),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'WhatsApp send failed');
  }
  return data;
}

async function sendInvoicePdf(phone, pdfBuffer, filename, caption) {
  const to = formatPhone(phone);
  if (!to) {
    throw new Error('Enter a valid WhatsApp number (e.g. 0771234567)');
  }

  const mediaId = await uploadPdf(pdfBuffer, filename);
  return sendDocument(to, mediaId, caption, filename);
}

module.exports = {
  isConfigured,
  formatPhone,
  formatPhoneDisplay,
  sendInvoicePdf,
};
