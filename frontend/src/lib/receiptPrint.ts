import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { BRAND, getLogoUrl } from '@/lib/brand';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface SaleReceipt {
  invoiceNumber: string;
  items: { name: string; sku: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  discountNote?: string;
  tax: number;
  total: number;
  paymentMethod: string;
  date: string;
}

export function getAppOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function buildInvoiceVerifyUrl(invoiceNumber: string) {
  return `${getAppOrigin()}/invoice/${encodeURIComponent(invoiceNumber)}`;
}

export function buildReceiptQrPayload(receipt: SaleReceipt) {
  return buildInvoiceVerifyUrl(receipt.invoiceNumber);
}

export function buildReceiptWhatsAppMessage(receipt: SaleReceipt) {
  const divider = '------------------------------';
  const itemLines = receipt.items.flatMap((item) => [
    `${item.name} (${item.sku})`,
    `  ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.unitPrice * item.quantity)}`,
  ]);

  return [
    `*${BRAND.fullName}*`,
    BRAND.location,
    '',
    `Invoice: ${receipt.invoiceNumber}`,
    `Date: ${formatDate(receipt.date)}`,
    divider,
    ...itemLines,
    divider,
    `Subtotal: ${formatCurrency(receipt.subtotal)}`,
    ...(receipt.discount > 0
      ? [`Discount: -${formatCurrency(receipt.discount)}${receipt.discountNote ? ` (${receipt.discountNote})` : ''}`]
      : []),
    `Tax: ${formatCurrency(receipt.tax)}`,
    `*TOTAL: ${formatCurrency(receipt.total)}*`,
    `Payment: ${receipt.paymentMethod.toUpperCase()}`,
    '',
    `View invoice online:`,
    buildInvoiceVerifyUrl(receipt.invoiceNumber),
    '',
    BRAND.receiptFooter,
  ].join('\n');
}

/** One line for WhatsApp — full line items stay on the PDF only (not a long chat “invoice”). */
export function buildWhatsAppPdfCaption(receipt: SaleReceipt) {
  return `${BRAND.fullName} — Invoice ${receipt.invoiceNumber} · ${formatCurrency(receipt.total)}. Official receipt is the attached PDF. Thank you!`;
}

export async function generateReceiptQrDataUrl(receipt: SaleReceipt) {
  return QRCode.toDataURL(buildReceiptQrPayload(receipt), {
    width: 140,
    margin: 1,
    color: { dark: '#111111', light: '#ffffff' },
  });
}

export function buildReceiptPrintHtml(receipt: SaleReceipt, qrDataUrl: string) {
  const rows = receipt.items.map((i) => `
      <tr>
        <td style="padding:4px 0">${i.name}<br><small style="color:#666">${i.sku}</small></td>
        <td style="text-align:center;padding:4px 0">${i.quantity}</td>
        <td style="text-align:right;padding:4px 0">${formatCurrency(i.unitPrice * i.quantity)}</td>
      </tr>`).join('');

  const logoUrl = getLogoUrl();
  const invoiceUrl = buildInvoiceVerifyUrl(receipt.invoiceNumber);
  const discountRow = receipt.discount > 0
    ? `<div>Discount: -${formatCurrency(receipt.discount)}${receipt.discountNote ? ` <small>(${receipt.discountNote})</small>` : ''}</div>`
    : '';

  return `<!DOCTYPE html><html><head><title>Receipt ${receipt.invoiceNumber}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:system-ui,sans-serif;margin:0;padding:16px;color:#111;background:#fff}
        .receipt{
          max-width:320px;
          margin:0 auto;
          padding:20px 16px 16px;
          border:2px solid #111;
          border-radius:10px;
          text-align:center;
        }
        .logo{width:80px;height:80px;object-fit:contain;margin:0 auto 10px;display:block;background:#000;border-radius:8px;padding:4px}
        .meta{font-size:12px;color:#555;margin-bottom:16px;text-align:left}
        table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}
        th{border-bottom:1px solid #ddd;padding-bottom:6px}
        .totals{margin-top:12px;border-top:1px dashed #ccc;padding-top:8px;font-size:13px;text-align:left}
        .total{font-size:16px;font-weight:bold;margin-top:6px}
        .footer{margin-top:18px;font-size:12px;line-height:1.5}
        .qr-section{margin-top:16px;padding-top:14px;border-top:1px dashed #ccc}
        .qr-code{width:112px;height:112px;display:block;margin:0 auto 8px}
        .qr-caption{font-size:10px;color:#666;margin:0 0 4px}
        .qr-link{font-size:9px;color:#888;word-break:break-all;margin:0}
        @media print{
          body{margin:0;padding:8px}
          .receipt{border:2px solid #000}
        }
      </style></head><body>
      <div class="receipt">
      <img class="logo" src="${logoUrl}" alt="${BRAND.fullName}" />
      <p class="meta">${BRAND.location}<br>Invoice: ${receipt.invoiceNumber}<br>${formatDate(receipt.date)}</p>
      <table><thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="totals">
        <div>Subtotal: ${formatCurrency(receipt.subtotal)}</div>
        ${discountRow}
        <div>Tax: ${formatCurrency(receipt.tax)}</div>
        <div class="total">Total: ${formatCurrency(receipt.total)}</div>
        <div style="margin-top:8px;font-size:12px">Payment: ${receipt.paymentMethod.toUpperCase()}</div>
      </div>
      <p class="footer">${BRAND.receiptFooter}</p>
      <div class="qr-section">
        <img class="qr-code" src="${qrDataUrl}" alt="Invoice QR code" />
        <p class="qr-caption">Scan to view this invoice online</p>
        <p class="qr-link">${invoiceUrl}</p>
      </div>
      </div>
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script>
    </body></html>`;
}

function receiptPdfFileName(invoiceNumber: string) {
  return `Invoice-${invoiceNumber.replace(/[^\w-]/g, '_')}.pdf`;
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function contactDetailLines(): string[] {
  return [
    BRAND.location,
    `Phone: ${BRAND.contactPhone}`,
    `Email: ${BRAND.contactEmail}`,
    `Store / verify online: ${BRAND.contactWebsite}`,
  ];
}

/** Rose accent aligned with app theme */
const ACCENT: [number, number, number] = [190, 24, 60];
const INK: [number, number, number] = [28, 28, 30];
const MUTED: [number, number, number] = [90, 90, 95];
const PANEL: [number, number, number] = [252, 248, 249];

export async function generateReceiptPdf(receipt: SaleReceipt): Promise<Blob> {
  const qrDataUrl = await generateReceiptQrDataUrl(receipt);
  const invoiceUrl = buildInvoiceVerifyUrl(receipt.invoiceNumber);
  const logoUrl = getLogoUrl();
  const logoDataUrl = await fetchImageAsDataUrl(logoUrl);

  const pageW = 92;
  const margin = 7;
  const contentW = pageW - margin * 2;
  const itemBlockH = receipt.items.length * 11 + 28;
  const pageH = Math.min(
    420,
    Math.max(210, 100 + itemBlockH + 138 + (BRAND.welcomeMessage.length > 120 ? 8 : 0)),
  );

  const doc = new jsPDF({ unit: 'mm', format: [pageW, pageH] });

  let y = 0;

  const setInk = () => doc.setTextColor(...INK);
  const setMuted = () => doc.setTextColor(...MUTED);
  const setAccent = () => doc.setTextColor(...ACCENT);

  const left = (text: string, size: number, opts?: { bold?: boolean; muted?: boolean; accent?: boolean }) => {
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    if (opts?.muted) setMuted();
    else if (opts?.accent) setAccent();
    else setInk();
    const lines = doc.splitTextToSize(text, contentW) as string[];
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.38) + 1.2;
  };

  const rule = (soft = false) => {
    doc.setDrawColor(soft ? 220 : 200, soft ? 218 : 200, soft ? 222 : 205);
    doc.setLineWidth(soft ? 0.15 : 0.25);
    doc.line(margin, y, pageW - margin, y);
    y += soft ? 3.5 : 4.5;
    doc.setLineWidth(0.2);
  };

  const drawContactCard = (title: string) => {
    const pad = 3;
    doc.setFillColor(...PANEL);
    doc.setDrawColor(235, 220, 225);
    const detailCount = contactDetailLines().length;
    const innerH = pad * 2 + 4 + detailCount * 3.6;
    doc.roundedRect(margin, y - 1, contentW, innerH + 2, 1.5, 1.5, 'FD');
    y += pad + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);
    doc.text(title, margin + pad, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setInk();
    contactDetailLines().forEach((ln) => {
      doc.text(ln, margin + pad, y);
      y += 3.6;
    });
    y += pad + 3;
  };

  // —— Header band
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(BRAND.fullName, pageW / 2, 11, { align: 'center', maxWidth: contentW });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(BRAND.tagline.toUpperCase(), pageW / 2, 18, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(BRAND.location, pageW / 2, 23, { align: 'center', maxWidth: contentW });
  y = 32;

  setInk();
  // Logo
  if (logoDataUrl) {
    try {
      const maxLogoW = 22;
      const maxLogoH = 22;
      doc.addImage(logoDataUrl, 'PNG', (pageW - maxLogoW) / 2, y, maxLogoW, maxLogoH);
      y += maxLogoH + 4;
    } catch {
      y += 2;
    }
  } else {
    y += 2;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setAccent();
  doc.text(BRAND.welcomeTitle, pageW / 2, y, { align: 'center' });
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setMuted();
  const welcomeLines = doc.splitTextToSize(BRAND.welcomeMessage, contentW) as string[];
  doc.text(welcomeLines, pageW / 2, y, { align: 'center', maxWidth: contentW });
  y += welcomeLines.length * 3.4 + 5;

  rule(true);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setAccent();
  doc.text('INVOICE', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setMuted();
  doc.text('Official customer invoice — all line items and totals are on this document', pageW / 2, y, {
    align: 'center',
    maxWidth: contentW,
  });
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setInk();
  doc.text(receipt.invoiceNumber, pageW / 2, y, { align: 'center' });
  y += 4.5;
  setMuted();
  doc.setFontSize(8);
  doc.text(formatDate(receipt.date), pageW / 2, y, { align: 'center' });
  y += 7;

  // Items table header
  doc.setFillColor(245, 240, 242);
  doc.rect(margin, y - 1, contentW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setInk();
  doc.text('Item', margin + 1, y + 4);
  doc.text('Qty', margin + contentW * 0.58, y + 4);
  doc.text('Amount', margin + contentW - 1, y + 4, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  receipt.items.forEach((item) => {
    const nameLines = doc.splitTextToSize(item.name, contentW * 0.52) as string[];
    const rowH = Math.max(8, nameLines.length * 3.2 + 3);
    doc.text(nameLines, margin + 1, y + 3.5);
    doc.setTextColor(...MUTED);
    doc.setFontSize(6.8);
    doc.text(item.sku, margin + 1, y + 3.5 + nameLines.length * 3.2);
    doc.setFontSize(8);
    setInk();
    doc.text(String(item.quantity), margin + contentW * 0.58, y + 4);
    doc.text(formatCurrency(item.unitPrice * item.quantity), margin + contentW - 1, y + 4, { align: 'right' });
    y += rowH;
  });

  y += 2;
  rule(true);

  doc.setFontSize(8.5);
  left(`Subtotal: ${formatCurrency(receipt.subtotal)}`, 8.5);
  if (receipt.discount > 0) {
    left(
      `Discount: -${formatCurrency(receipt.discount)}${receipt.discountNote ? ` (${receipt.discountNote})` : ''}`,
      8.5,
    );
  }
  left(`Tax: ${formatCurrency(receipt.tax)}`, 8.5);
  left(`TOTAL DUE: ${formatCurrency(receipt.total)}`, 11, { bold: true, accent: true });
  left(`Payment method: ${receipt.paymentMethod.toUpperCase()}`, 8.5);
  y += 4;

  rule(true);

  drawContactCard('Contact us');

  rule(true);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setAccent();
  doc.text(BRAND.thankYouTitle, pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setMuted();
  const thanksLines = doc.splitTextToSize(BRAND.thankYouMessage, contentW) as string[];
  doc.text(thanksLines, pageW / 2, y, { align: 'center', maxWidth: contentW });
  y += thanksLines.length * 3.4 + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setMuted();
  doc.text('View / verify this invoice online:', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(6.5);
  setInk();
  const urlLines = doc.splitTextToSize(invoiceUrl, contentW) as string[];
  doc.text(urlLines, pageW / 2, y, { align: 'center', maxWidth: contentW });
  y += urlLines.length * 2.8 + 5;

  const qrSize = 26;
  doc.addImage(qrDataUrl, 'PNG', (pageW - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setMuted();
  doc.text('Scan to verify this invoice online', pageW / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  setInk();
  const foot = doc.splitTextToSize(BRAND.receiptFooter, contentW) as string[];
  doc.text(foot, pageW / 2, y, { align: 'center', maxWidth: contentW });
  y += foot.length * 3.5 + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setMuted();
  doc.text(BRAND.copyright, pageW / 2, y, { align: 'center', maxWidth: contentW });

  return doc.output('blob');
}

export function formatWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return '';
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

export function formatWhatsAppDisplay(phone: string) {
  const formatted = formatWhatsAppNumber(phone);
  if (!formatted) return '';
  if (formatted.startsWith('94') && formatted.length === 11) {
    return `0${formatted.slice(2, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`;
  }
  return `+${formatted}`;
}

export type WhatsAppSendResult = {
  sentTo: string;
  displayNumber: string;
  message: string;
  /** native-share = device share sheet with PDF; wa-web = WhatsApp link in a real tab */
  mode: 'native-share' | 'wa-web';
};

export type SendReceiptWhatsAppOptions = {
  /**
   * Open with `window.open('about:blank')` in the same click handler *before* any `await`
   * so the browser does not block WhatsApp as a popup after async PDF generation.
   */
  externalChatWindow?: Window | null;
};

function downloadPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * WhatsApp handoff for the typed customer number:
 * 1) **Native share** with the PDF — on many phones this sends the file to WhatsApp without a separate “Downloads” step.
 * 2) Else open **WhatsApp directly for that number** (https / whatsapp://) with a short caption; if the PDF could not attach automatically, a one-time file save is offered so you can add it in the same chat.
 */
function buildWhatsAppOpenUrls(phoneDigits: string, receipt: SaleReceipt) {
  const text = encodeURIComponent(buildWhatsAppPdfCaption(receipt));
  return {
    /** Opens the WhatsApp app on many mobile devices */
    appScheme: `whatsapp://send?phone=${phoneDigits}&text=${text}`,
    /** Reliable in a browser tab; opens WhatsApp Web / app to this number */
    webSend: `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}`,
  };
}

export async function sendReceiptViaWhatsApp(
  receipt: SaleReceipt,
  phone: string,
  opts?: SendReceiptWhatsAppOptions,
): Promise<WhatsAppSendResult> {
  const formatted = formatWhatsAppNumber(phone);
  if (!formatted) {
    throw new Error('Enter a valid WhatsApp number (e.g. 0771234567)');
  }

  const displayNumber = formatWhatsAppDisplay(phone);
  const pdfBlob = await generateReceiptPdf(receipt);
  const fileName = receiptPdfFileName(receipt.invoiceNumber);
  const caption = buildWhatsAppPdfCaption(receipt);
  const { appScheme, webSend } = buildWhatsAppOpenUrls(formatted, receipt);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const extWin = opts?.externalChatWindow;
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
  const sharePdfOnly: ShareData = {
    files: [pdfFile],
    title: `${BRAND.fullName} — Invoice ${receipt.invoiceNumber}`,
  };
  const sharePdfWithShortCaption: ShareData = { ...sharePdfOnly, text: caption };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (!navigator.canShare) {
        await navigator.share(sharePdfOnly);
      } else if (navigator.canShare(sharePdfOnly)) {
        await navigator.share(sharePdfOnly);
      } else if (navigator.canShare(sharePdfWithShortCaption)) {
        await navigator.share(sharePdfWithShortCaption);
      } else {
        throw new Error('cannot-share-pdf');
      }
      if (extWin && !extWin.closed) extWin.close();
      return {
        sentTo: formatted,
        displayNumber,
        message: `Pick WhatsApp, then the chat for ${displayNumber} — the invoice goes as the PDF file (no separate download on supported phones).`,
        mode: 'native-share',
      };
    } catch (e) {
      const name = (e as { name?: string })?.name;
      if (name === 'AbortError') throw new Error('Sharing cancelled');
    }
  }

  const navigateWinToWhatsApp = (win: Window) => {
    win.location.href = isMobile ? appScheme : webSend;
  };

  const openReservedTab = () => {
    if (extWin && !extWin.closed) {
      try {
        extWin.document.open();
        extWin.document.write(
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>WhatsApp</title></head><body style="margin:0;font-family:system-ui,sans-serif;padding:2rem;text-align:center;background:#0f172a;color:#e2e8f0"><p style="font-size:16px">Opening WhatsApp for your customer…</p><p style="font-size:13px;opacity:.75;margin-top:.75rem">If nothing opens, allow pop-ups for this site.</p></body></html>',
        );
        extWin.document.close();
      } catch {
        /* ignore */
      }
      navigateWinToWhatsApp(extWin);
      return true;
    }
    return false;
  };

  if (openReservedTab()) {
    downloadPdfBlob(pdfBlob, fileName);
    return {
      sentTo: formatted,
      displayNumber,
      message: `WhatsApp should open for ${displayNumber}. The PDF was saved once — attach it in that chat if it did not send automatically (browsers cannot always push the file without this step).`,
      mode: 'wa-web',
    };
  }

  downloadPdfBlob(pdfBlob, fileName);
  const popped = window.open(isMobile ? appScheme : webSend, '_blank', 'noopener,noreferrer');
  if (!popped || popped.closed) {
    window.location.href = isMobile ? appScheme : webSend;
    return {
      sentTo: formatted,
      displayNumber,
      message: `Opening WhatsApp for ${displayNumber}. PDF saved — attach it in that chat if needed, then use your browser’s back button to return.`,
      mode: 'wa-web',
    };
  }

  return {
    sentTo: formatted,
    displayNumber,
    message: `WhatsApp opened for ${displayNumber}. PDF saved — attach it in that chat if the file did not appear by itself.`,
    mode: 'wa-web',
  };
}
