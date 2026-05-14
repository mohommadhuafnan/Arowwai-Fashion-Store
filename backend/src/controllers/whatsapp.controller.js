const whatsapp = require('../services/whatsapp.service');

const getStatus = async (_req, res) => {
  res.json({
    success: true,
    data: {
      configured: whatsapp.isConfigured(),
      provider: 'WhatsApp Business Cloud API',
    },
  });
};

const sendInvoice = async (req, res) => {
  try {
    if (!whatsapp.isConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'WhatsApp sending is not set up. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Vercel env vars.',
      });
    }

    const { phone, pdfBase64, invoiceNumber, caption } = req.body;
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Customer WhatsApp number is required' });
    }
    if (!pdfBase64) {
      return res.status(400).json({ success: false, message: 'Invoice PDF is required' });
    }

    const safeInvoice = String(invoiceNumber || 'invoice').replace(/[^\w-]/g, '_');
    const filename = `Invoice-${safeInvoice}.pdf`;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    await whatsapp.sendInvoicePdf(
      phone,
      pdfBuffer,
      filename,
      caption || `Your invoice from AROWWAI Fashion Store — ${safeInvoice}`,
    );

    const sentTo = whatsapp.formatPhone(phone);
    res.json({
      success: true,
      data: {
        sentTo,
        displayNumber: whatsapp.formatPhoneDisplay(phone),
        message: 'Invoice PDF sent on WhatsApp',
      },
    });
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Could not send invoice on WhatsApp',
    });
  }
};

module.exports = { getStatus, sendInvoice };
