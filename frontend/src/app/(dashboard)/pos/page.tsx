'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Wallet,
  Receipt, Percent, User, ScanBarcode, X, MessageCircle, Printer, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addToCart, removeFromCart, updateQuantity, setDiscount, setDiscountNote, setPaymentMethod, clearCart,
  selectCartSubtotal, selectCartTotal,
} from '@/store/slices/posSlice';
import { productAPI, saleAPI, branchAPI, whatsappAPI } from '@/lib/api';
import { formatCurrency, formatDate, cn, getMediaUrl } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import BrandLogo from '@/components/ui/BrandLogo';
import QRCode from 'react-qr-code';
import {
  type SaleReceipt,
  buildReceiptQrPayload,
  buildReceiptPrintHtml,
  generateReceiptQrDataUrl,
  sendReceiptViaWhatsApp,
  formatWhatsAppDisplay,
  formatWhatsAppNumber,
} from '@/lib/receiptPrint';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'qr', label: 'QR Pay', icon: QrCode },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

const DEMO_PRODUCTS = [
  { _id: '1', name: 'Classic Denim Jacket', sku: 'DJ-001', basePrice: 3499, barcode: '8901234567890', category: { name: 'Men' }, images: [] },
  { _id: '2', name: 'Silk Evening Dress', sku: 'SD-002', basePrice: 5999, barcode: '8901234567891', category: { name: 'Women' }, images: [] },
  { _id: '3', name: 'Running Sneakers', sku: 'SN-003', basePrice: 4299, barcode: '8901234567892', category: { name: 'Shoes' }, images: [] },
  { _id: '4', name: 'Cotton T-Shirt', sku: 'TS-004', basePrice: 899, barcode: '8901234567893', category: { name: 'Casual' }, images: [] },
  { _id: '5', name: 'Leather Belt', sku: 'BT-005', basePrice: 1299, barcode: '8901234567894', category: { name: 'Accessories' }, images: [] },
  { _id: '6', name: 'Wool Blazer', sku: 'BZ-006', basePrice: 7499, barcode: '8901234567895', category: { name: 'Formal' }, images: [] },
  { _id: '7', name: 'Kids Hoodie', sku: 'KH-007', basePrice: 1599, barcode: '8901234567896', category: { name: 'Kids' }, images: [] },
  { _id: '8', name: 'Sports Leggings', sku: 'SL-008', basePrice: 1899, barcode: '8901234567897', category: { name: 'Sportswear' }, images: [] },
];

const QUICK_DISCOUNTS = [50, 100, 200, 500];

const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export default function POSPage() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.pos.cart);
  const discount = useAppSelector((s) => s.pos.discount);
  const discountNote = useAppSelector((s) => s.pos.discountNote);
  const paymentMethod = useAppSelector((s) => s.pos.paymentMethod);
  const taxRate = useAppSelector((s) => s.pos.taxRate);
  const subtotal = useAppSelector(selectCartSubtotal);
  const total = useAppSelector(selectCartTotal);
  const { user } = useAppSelector((s) => s.auth);

  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [discountInput, setDiscountInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [whatsappReady, setWhatsappReady] = useState<boolean | null>(null);
  const [branchId, setBranchId] = useState<string | null>(user?.branch?._id || null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    productAPI.getAll().then((res) => {
      if (res.data.data?.length > 0) setProducts(res.data.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.branch?._id) {
      setBranchId(user.branch._id);
      return;
    }
    branchAPI.getAll().then((res) => {
      const branches = res.data.data || [];
      const main = branches.find((b: { code?: string }) => b.code === 'MAIN') || branches[0];
      if (main?._id) setBranchId(main._id);
    }).catch(() => {});
  }, [user?.branch?._id]);

  const categories = ['all', ...new Set(products.map((p) => p.category?.name || 'General'))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat = selectedCategory === 'all' || p.category?.name === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleAddToCart = (product: typeof DEMO_PRODUCTS[0]) => {
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.basePrice,
      quantity: 1,
      discount: 0,
      tax: product.basePrice * (taxRate / 100),
      image: product.images?.[0],
    }));
    toast.success(`Added ${product.name}`);
  };

  const applyDiscountAmount = (amount: number) => {
    if (subtotal <= 0) {
      toast.error('Add items to cart first');
      return;
    }
    const capped = Math.min(Math.max(0, amount), subtotal);
    dispatch(setDiscount(capped));
    setDiscountInput(String(capped));
    if (capped > 0) toast.success(`Discount Rs ${capped} applied`);
  };

  const clearDiscount = () => {
    dispatch(setDiscount(0));
    dispatch(setDiscountNote(''));
    setDiscountInput('');
    toast.success('Discount cleared');
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search) {
      const product = products.find((p) => p.barcode === search || p.sku === search);
      if (product) {
        handleAddToCart(product);
        setSearch('');
      } else {
        toast.error('Product not found');
      }
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (!branchId) { toast.error('No branch assigned. Please contact your administrator.'); return; }
    if (!cart.every((item) => isValidObjectId(item.productId))) {
      toast.error('Demo products cannot be sold. Ensure the server is connected and reload the POS page.');
      return;
    }
    setProcessing(true);
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const receiptData: SaleReceipt = {
      invoiceNumber: `INV-${Date.now()}`,
      items: cart.map((item) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal,
      discount,
      discountNote: discountNote || undefined,
      tax: taxAmount,
      total,
      paymentMethod,
      date: new Date().toISOString(),
    };
    const saleNotes = discount > 0
      ? `Discount: Rs ${discount}${discountNote ? ` - ${discountNote}` : ''}`
      : undefined;
    try {
      const saleData = {
        branch: branchId,
        items: cart.map((item) => ({
          product: item.productId,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.unitPrice * item.quantity * (taxRate / 100),
          total: item.unitPrice * item.quantity,
        })),
        subtotal,
        discount,
        tax: taxAmount,
        total,
        payments: [{ method: paymentMethod, amount: total }],
        couponCode: couponCode || undefined,
        notes: saleNotes,
      };
      const { data } = await saleAPI.create(saleData);
      receiptData.invoiceNumber = data.data?.invoiceNumber || receiptData.invoiceNumber;
      setLastReceipt(receiptData);
      setWhatsappNumber('');
      setShowReceipt(true);
      dispatch(clearCart());
      toast.success('Sale completed!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; code?: string; message?: string };
      const isOffline = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isOffline) {
        setLastReceipt(receiptData);
        setWhatsappNumber('');
        setShowReceipt(true);
        dispatch(clearCart());
        toast.success('Sale recorded (offline mode)');
      } else {
        toast.error(error.response?.data?.message || 'Checkout failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = async () => {
    if (!lastReceipt) return;
    try {
      const qrDataUrl = await generateReceiptQrDataUrl(lastReceipt);
      const html = buildReceiptPrintHtml(lastReceipt, qrDataUrl);
      const win = window.open('', '_blank', 'width=400,height=700');
      if (!win) { toast.error('Allow pop-ups to print receipt'); return; }
      win.document.write(html);
      win.document.close();
    } catch {
      toast.error('Could not generate receipt QR code');
    }
  };

  useEffect(() => {
    if (!showReceipt) {
      setWhatsappReady(null);
      return;
    }
    whatsappAPI.getStatus()
      .then((res) => setWhatsappReady(Boolean(res.data.data?.configured)))
      .catch(() => setWhatsappReady(false));
  }, [showReceipt]);

  const customerWhatsAppDisplay = formatWhatsAppDisplay(whatsappNumber);
  const customerWhatsAppValid = Boolean(formatWhatsAppNumber(whatsappNumber));

  const shareWhatsApp = async () => {
    if (!lastReceipt || whatsappSending) return;
    if (!customerWhatsAppValid) {
      toast.error('Enter a valid customer WhatsApp number');
      return;
    }
    setWhatsappSending(true);
    try {
      const result = await sendReceiptViaWhatsApp(lastReceipt, whatsappNumber);
      if (result.mode === 'direct') {
        toast.success(`Invoice PDF sent to ${result.displayNumber}`);
      } else {
        toast.success(`WhatsApp opened for ${result.displayNumber} — tap Send (PDF downloaded)`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Could not send invoice on WhatsApp');
      toast.error(msg);
    } finally {
      setWhatsappSending(false);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setWhatsappNumber('');
  };

  return (
    <motion.div className="flex h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Products Panel */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              ref={barcodeRef}
              type="text"
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcodeScan}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none input-glow"
            />
            <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0',
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              )}
              whileTap={{ scale: 0.97 }}
            >
              {cat === 'all' ? 'All' : cat}
            </motion.button>
          ))}
        </div>

        <motion.div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 content-start items-start auto-rows-min pb-2">
          {filtered.map((product, i) => (
            <motion.button
              key={product._id}
              onClick={() => handleAddToCart(product)}
              className="glass-card rounded-xl p-2 text-left hover:border-[var(--accent)]/30 transition-all group w-full"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-full aspect-square rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center mb-2 overflow-hidden group-hover:border-[var(--accent)]/25 transition-colors">
                {product.images?.[0] ? (
                  <img src={getMediaUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-[var(--muted)]" />
                )}
              </div>
              <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 leading-snug min-h-[2rem]">{product.name}</p>
              <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">{product.sku}</p>
              <p className="text-sm font-bold text-[var(--accent)] mt-1">{formatCurrency(product.basePrice)}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 glass border-l border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-400" /> Cart ({cart.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/30 text-sm py-12">
                Scan or tap products to add
              </motion.p>
            ) : cart.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-white/40">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))} className="p-1 rounded bg-white/5 hover:bg-white/10">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs w-6 text-center">{item.quantity}</span>
                  <button onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))} className="p-1 rounded bg-white/5 hover:bg-white/10">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => dispatch(removeFromCart(item.productId))} className="p-1 text-red-400 hover:bg-red-500/10 rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div className="p-4 border-t border-white/5 space-y-3">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-white/40 font-medium">Shop discount (Rs)</p>
            <div className="grid grid-cols-4 gap-1.5">
              {QUICK_DISCOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => applyDiscountAmount(amt)}
                  className={cn(
                    'py-1.5 rounded-lg text-[10px] font-medium transition-all',
                    discount === amt ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
                  )}
                >
                  Rs {amt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={subtotal}
                placeholder="Custom amount"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => applyDiscountAmount(Number(discountInput) || 0)}
                className="px-3 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs hover:bg-emerald-600/30 whitespace-nowrap"
              >
                Apply
              </button>
              {discount > 0 && (
                <button type="button" onClick={clearDiscount} className="px-2 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20" title="Clear discount">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Reason (optional) e.g. regular customer"
              value={discountNote}
              onChange={(e) => dispatch(setDiscountNote(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (couponCode === 'FASHION10') {
                  applyDiscountAmount(Math.round(subtotal * 0.1));
                  dispatch(setDiscountNote('Coupon FASHION10'));
                  toast.success('10% coupon applied!');
                } else {
                  toast.error('Invalid coupon');
                }
              }}
              className="px-3 py-2 rounded-lg bg-purple-600/20 text-purple-400 text-xs hover:bg-purple-600/30"
            >
              <Percent className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-white/50"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount{discountNote ? ` - ${discountNote}` : ''}</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white/50"><span>Tax ({taxRate}%)</span><span>{formatCurrency((subtotal - discount) * (taxRate / 100))}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-white/5">
              <span>Total</span><span className="text-cyan-400">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => dispatch(setPaymentMethod(pm.id))}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] transition-all',
                    paymentMethod === pm.id ? 'bg-purple-600/20 border border-purple-500/30 text-purple-400' : 'bg-white/5 text-white/40 hover:bg-white/10'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {pm.label}
                </button>
              );
            })}
          </div>

          <motion.button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 text-white btn-glow disabled:opacity-40"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {processing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
          </motion.button>
        </motion.div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && lastReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeReceipt}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <BrandLogo size="sm" showText className="justify-center mb-3" />
                <h3 className="text-lg font-bold text-[var(--foreground)]">Payment Successful</h3>
                <p className="text-sm text-[var(--muted)] mt-1">Invoice: {lastReceipt.invoiceNumber}</p>
                <p className="text-2xl font-bold text-[var(--accent)] mt-2">{formatCurrency(lastReceipt.total)}</p>
              </div>

              <div className="max-h-32 overflow-y-auto mb-4 rounded-xl border border-[var(--border)] p-3 space-y-1 text-left">
                {lastReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-[var(--muted-strong)]">
                    <span className="truncate pr-2">{item.name} Ã—{item.quantity}</span>
                    <span className="shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-xl border-2 border-[var(--border)] p-4 text-center">
                <QRCode
                  value={buildReceiptQrPayload(lastReceipt)}
                  size={96}
                  className="mx-auto"
                  bgColor="transparent"
                  fgColor="currentColor"
                />
                <p className="text-[10px] text-[var(--muted)] mt-2">Scan to view this invoice online</p>
              </div>

              <motion.div className="mb-4">
                <label className="text-xs text-[var(--muted)] block mb-1.5">Customer WhatsApp number</label>
                <input
                  type="tel"
                  placeholder="077 123 4567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && shareWhatsApp()}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] input-glow"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
                />
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  {whatsappReady === false
                    ? 'Quick mode: opens WhatsApp to this number + downloads PDF. For auto-send, connect store WhatsApp API in Vercel.'
                    : 'PDF invoice sends directly from your store WhatsApp to this number.'}
                </p>
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={printReceipt}
                  className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--foreground)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </motion.button>
                <motion.button
                  onClick={shareWhatsApp}
                  disabled={!customerWhatsAppValid || whatsappSending}
                  className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: customerWhatsAppValid && !whatsappSending ? 1.02 : 1 }}
                  whileTap={{ scale: customerWhatsAppValid && !whatsappSending ? 0.98 : 1 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {whatsappSending
                    ? 'Sending PDF...'
                    : customerWhatsAppValid
                      ? `Send PDF to ${customerWhatsAppDisplay}`
                      : 'Enter number to send'}
                </motion.button>
              </motion.div>

              <button
                onClick={closeReceipt}
                className="w-full mt-3 py-2 rounded-xl text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
