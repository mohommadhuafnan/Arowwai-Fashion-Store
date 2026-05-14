'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package, Pencil, Trash2, Loader2, Camera, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import BarcodeScanInput from '@/components/products/BarcodeScanInput';
import CameraBarcodeScanner from '@/components/products/CameraBarcodeScanner';
import ProductImagePicker from '@/components/products/ProductImagePicker';
import { productAPI, categoryAPI } from '@/lib/api';
import { formatCurrency, getMediaUrl } from '@/lib/utils';

interface Category { _id: string; name: string; slug: string }
interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  basePrice: number;
  costPrice?: number;
  brand?: string;
  gender?: string;
  totalStock?: number;
  isActive?: boolean;
  category?: Category | string;
  images?: string[];
}

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', basePrice: '', costPrice: '', brand: '',
  gender: 'unisex', category: '', totalStock: '0', imageUrl: '',
};

const GENDERS = ['men', 'women', 'unisex', 'kids'];

function suggestSku(barcode: string) {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length >= 4) return `BC-${digits.slice(-8)}`;
  return `BC-${Date.now().toString().slice(-6)}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const scanBarRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([productAPI.getAll(), categoryAPI.getAll()]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const findLocal = useCallback((barcode: string) => {
    const code = barcode.trim();
    return products.find(
      (p) => p.barcode === code || p.sku === code || p.barcode?.endsWith(code)
    );
  }, [products]);

  const openCreateWithBarcode = useCallback((barcode: string) => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      barcode,
      sku: suggestSku(barcode),
      category: categories[0]?._id || '',
    });
    setModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 200);
  }, [categories]);

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;

    const local = findLocal(code);
    if (local) {
      toast.success(`Found: ${local.name}`);
      openEdit(local);
      setScanValue('');
      return;
    }

    try {
      const { data } = await productAPI.getByBarcode(code);
      if (data.data) {
        toast.success(`Found: ${data.data.name}`);
        openEdit(data.data as Product);
        setScanValue('');
        return;
      }
    } catch {
      /* not in API — quick add */
    }

    toast(`New barcode — add product details`, { icon: '➕' });
    openCreateWithBarcode(code);
    setScanValue('');
  }, [findLocal, openCreateWithBarcode]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      basePrice: String(p.basePrice),
      costPrice: String(p.costPrice || ''),
      brand: p.brand || '',
      gender: p.gender || 'unisex',
      category: typeof p.category === 'object' ? p.category?._id : (p.category as string) || '',
      totalStock: String(p.totalStock || 0),
      imageUrl: p.images?.[0] || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.basePrice || !form.category) {
      toast.error('Name, SKU, price and category are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      barcode: form.barcode.trim() || undefined,
      basePrice: Number(form.basePrice),
      costPrice: Number(form.costPrice) || 0,
      brand: form.brand.trim() || undefined,
      gender: form.gender,
      category: form.category,
      totalStock: Number(form.totalStock) || 0,
      isActive: true,
      images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
    };
    try {
      if (editing) {
        await productAPI.update(editing._id, payload);
        toast.success('Product updated');
      } else {
        await productAPI.create(payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      loadData();
      setTimeout(() => scanBarRef.current?.focus(), 300);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await productAPI.delete(deleteConfirm._id);
      toast.success('Product deactivated');
      setDeleteConfirm(null);
      loadData();
    } catch {
      toast.error('Failed to deactivate product');
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const { data } = await productAPI.uploadImage(file);
      return data.data.url as string;
    } catch {
      toast.error('Failed to upload image');
      throw new Error('upload failed');
    }
  };

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode || '').includes(search)
    );
  });

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] input-glow';
  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Products</h1>
          <p className="text-sm text-[var(--muted)]">{products.length} items · scan to find or quick-add</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => { setScanValue(''); scanBarRef.current?.focus(); toast('Ready to scan', { icon: '📷' }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--accent)]/40 text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)]/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-4 h-4" /> Scan Mode
          </motion.button>
          <motion.button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" /> Add Product
          </motion.button>
        </div>
      </motion.div>

      {/* Main barcode scan bar — USB scanner: focus here and scan */}
      <motion.div
        className="glass-card rounded-2xl p-4 border border-[var(--accent)]/20"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs font-medium text-[var(--accent)] mb-2 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" /> Barcode Scanner
        </p>
        <div className="flex gap-2">
          <BarcodeScanInput
            value={scanValue}
            onChange={setScanValue}
            onScan={handleBarcodeScanned}
            placeholder="Scan barcode here (USB scanner) or type & Enter…"
            autoFocus
            className="flex-1"
            inputClassName="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] input-glow ring-2 ring-[var(--accent)]/20"
          />
          <motion.button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="px-4 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] flex items-center gap-2 text-sm shrink-0"
            whileTap={{ scale: 0.98 }}
            title="Use camera to scan"
          >
            <Camera className="w-5 h-5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Camera</span>
          </motion.button>
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-2">
          Scan existing product → opens edit. Unknown barcode → quick-add form with barcode filled in.
        </p>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search name, SKU or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls + ' pl-10'}
          style={inputStyle}
        />
      </div>

      {loading ? (
        <motion.div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></motion.div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Product', render: (p) => {
              const img = getMediaUrl((p.images as string[])?.[0]);
              return (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center overflow-hidden shrink-0">
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-[var(--accent)]" />}
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{p.name as string}</p>
                  <p className="text-[10px] text-[var(--muted)]">{p.sku as string}</p>
                </div>
              </div>
            );}},
            { key: 'barcode', label: 'Barcode', render: (p) => (
              <span className="font-mono text-xs text-[var(--muted-strong)]">{(p.barcode as string) || '—'}</span>
            )},
            { key: 'brand', label: 'Brand', render: (p) => (p.brand as string) || '—' },
            { key: 'basePrice', label: 'Price (LKR)', render: (p) => formatCurrency(p.basePrice as number) },
            { key: 'totalStock', label: 'Stock', render: (p) => {
              const stock = (p.totalStock as number) ?? 0;
              return <span className={stock < 10 ? 'text-amber-400 font-medium' : 'text-emerald-400'}>{stock}</span>;
            }},
            { key: 'isActive', label: 'Status', render: (p) => (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {p.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            )},
            { key: 'actions', label: '', render: (p) => (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(p as unknown as Product)} className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--accent)]">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(p as unknown as Product)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )},
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
        />
      )}

      {cameraOpen && (
        <CameraBarcodeScanner
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onScan={handleBarcodeScanned}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Quick Add Product'} wide>
        <form onSubmit={handleSave} className="space-y-4">
          {!editing && form.barcode && (
            <div className="px-3 py-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs text-[var(--accent)] font-mono">
              Scanned barcode: {form.barcode}
            </div>
          )}
          <ProductImagePicker
            imageUrl={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            onUpload={handleImageUpload}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[var(--muted)] mb-1 block">Product Name *</label>
              <input
                ref={nameInputRef}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                style={inputStyle}
                placeholder="e.g. Cotton T-Shirt"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">SKU *</label>
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputCls + ' font-mono'} style={inputStyle} placeholder="TS-001" />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Barcode</label>
              <div className="flex gap-1">
                <BarcodeScanInput
                  value={form.barcode}
                  onChange={(v) => setForm({ ...form, barcode: v })}
                  onScan={(v) => setForm((f) => ({ ...f, barcode: v, sku: f.sku || suggestSku(v) }))}
                  placeholder="Scan…"
                  className="flex-1"
                  inputClassName="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-mono text-[var(--foreground)] input-glow"
                />
                <button type="button" onClick={() => setCameraOpen(true)} className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-hover)]">
                  <Camera className="w-4 h-4 text-[var(--accent)]" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Selling Price (LKR) *</label>
              <input required type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Cost Price (LKR)</label>
              <input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Brand</label>
              <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Stock Qty</label>
              <input type="number" min="0" value={form.totalStock} onChange={(e) => setForm({ ...form, totalStock: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls + ' cursor-pointer'} style={inputStyle}>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Category *</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputCls + ' cursor-pointer'}
                style={inputStyle}
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--surface-hover)]">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Deactivate Product">
        <p className="text-sm text-[var(--muted)] mb-4">
          Deactivate <strong className="text-[var(--foreground)]">{deleteConfirm?.name}</strong>? It will be hidden from POS but kept in records.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">Deactivate</button>
        </div>
      </Modal>
    </motion.div>
  );
}
