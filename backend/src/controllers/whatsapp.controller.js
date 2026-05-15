const router = require('../services/whatsappRouter.service');

const getStatus = async (_req, res) => {
  res.json({
    success: true,
    data: router.getStatusPayload(),
  });
};

const sendInvoice = async (req, res) => {
  try {
    if (!router.isAnyConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'No WhatsApp sender configured. Add either (1) Meta: WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID, or (2) CallMeBot: CALLMEBOT_API_KEY — see backend/.env.example',
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

    const result = await router.sendInvoice(
      phone,
      pdfBuffer,
      filename,
      caption || `Your invoice from AROWWAI Fashion Store — ${safeInvoice}`,
      String(invoiceNumber || safeInvoice).trim() || safeInvoice,
    );

    const sentTo = router.formatPhone(phone);
    res.json({
      success: true,
      data: {
        sentTo,
        displayNumber: router.formatPhoneDisplay(phone),
        message: result.message || (result.supportsPdf ? 'Invoice PDF sent on WhatsApp' : 'Invoice link sent on WhatsApp'),
        supportsPdf: result.supportsPdf !== false,
        provider: result.channel,
      },
    });
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: err.message,
      });
    }
    console.error('WhatsApp send error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Could not send invoice on WhatsApp',
    });
  }
};

module.exports = { getStatus, sendInvoice };
