'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Receipt, XCircle } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import { BRAND } from '@/lib/brand';
import { saleAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  payments?: { method: string; amount: number }[];
  items: InvoiceItem[];
  createdAt: string;
  branch?: { name?: string; address?: string; city?: string };
}

export default function InvoiceVerifyPage() {
  const params = useParams();
  const invoiceNumber = decodeURIComponent(String(params?.invoiceNumber || ''));
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!invoiceNumber) {
      setError('Invalid invoice link');
      setLoading(false);
      return;
    }

    saleAPI.getByInvoice(invoiceNumber)
      .then((res) => setInvoice(res.data.data))
      .catch(() => setError('Invoice not found or unavailable'))
      .finally(() => setLoading(false));
  }, [invoiceNumber]);

  const paymentMethod = invoice?.payments?.[0]?.method?.toUpperCase() || 'PAID';

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md bg-white text-[#111] rounded-2xl border-2 border-[#111] shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="px-6 pt-6 pb-4 text-center border-b border-dashed border-[#ddd]">
          <BrandLogo size="sm" showText className="justify-center mb-3" />
          <p className="text-xs text-[#666]">{BRAND.location}</p>
          <h1 className="text-lg font-bold mt-3 flex items-center justify-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoice Verification
          </h1>
          <p className="text-sm font-mono mt-1">{invoiceNumber}</p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center py-10 text-[#666]">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Loading invoice...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center py-10 text-center">
              <XCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="font-medium">{error}</p>
              <p className="text-xs text-[#666] mt-2">Check the invoice number and try again.</p>
            </div>
          )}

          {!loading && invoice && (
            <>
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Verified invoice from {BRAND.name} Fashion Store</span>
              </div>

              <div className="text-sm text-[#555] space-y-1 mb-4">
                <p>Date: {formatDate(invoice.createdAt)}</p>
                {invoice.branch?.name && <p>Branch: {invoice.branch.name}</p>}
                <p>Status: <span className="font-medium capitalize">{invoice.status}</span></p>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-[#ddd] text-left">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={i} className="border-b border-[#f0f0f0]">
                      <td className="py-2 pr-2">
                        <p>{item.name}</p>
                        {item.sku && <p className="text-[10px] text-[#888]">{item.sku}</p>}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-[#ccc] pt-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span><span>-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(invoice.tax)}</span></div>
                <div className="flex justify-between text-base font-bold pt-1">
                  <span>Total</span><span>{formatCurrency(invoice.total)}</span>
                </div>
                <p className="text-xs text-[#666] pt-1">Payment: {paymentMethod}</p>
              </div>

              <p className="text-center text-xs text-[#888] mt-6">{BRAND.receiptFooter}</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
