import QRCode from 'qrcode';
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
