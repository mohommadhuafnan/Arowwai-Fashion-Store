const meta = require('./whatsapp.service');
const callmebot = require('./callmebot.service');

function isAnyConfigured() {
  return meta.isConfigured() || callmebot.isConfigured();
}

function getStatusPayload() {
  const cloud = meta.isConfigured();
  const cmb = callmebot.isConfigured();
  let provider = null;
  if (cloud) provider = 'whatsapp-cloud';
  else if (cmb) provider = 'callmebot';

  return {
    configured: cloud || cmb,
    provider,
    supportsPdfAttachment: cloud,
    callmebotConfigured: cmb,
  };
}

/**
 * @param {string} phone
 * @param {Buffer} pdfBuffer
 * @param {string} filename
 * @param {string} caption
 * @param {string} invoiceNumber
 */
async function sendInvoice(phone, pdfBuffer, filename, caption, invoiceNumber) {
  if (meta.isConfigured()) {
    await meta.sendInvoicePdf(phone, pdfBuffer, filename, caption);
    return { channel: 'whatsapp-cloud', supportsPdf: true };
  }

  if (callmebot.isConfigured()) {
    const link = callmebot.buildInvoiceLink(invoiceNumber);
    const text = [
      caption || `Invoice from AROWWAI Fashion Store — ${invoiceNumber}`,
      '',
      link ? `View invoice online:\n${link}` : 'Open your store receipt link from the cashier.',
      '',
      'A PDF copy can be sent from the store if you ask.',
    ].join('\n');

    await callmebot.sendText(phone, text);
    return {
      channel: 'callmebot',
      supportsPdf: false,
      message:
        'WhatsApp message sent (invoice link). CallMeBot sends text only — add Meta WhatsApp Cloud env vars to attach PDF files.',
    };
  }

  const err = new Error(
    'No WhatsApp provider configured. Add either Meta (WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID) or CallMeBot (CALLMEBOT_API_KEY) in Vercel.',
  );
  err.statusCode = 503;
  throw err;
}

module.exports = {
  isAnyConfigured,
  getStatusPayload,
  sendInvoice,
  formatPhoneDisplay: meta.formatPhoneDisplay,
  formatPhone: meta.formatPhone,
};
