'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { supplierAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Supplier {
  _id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  totalDue?: number;
  totalPaid?: number;
  rating?: number;
}

const EMPTY_FORM = { name: '', company: '', phone: '', email: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res.data.data || []);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      await supplierAPI.create({
        name: form.name.trim(),
        company: form.company.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
      });
      toast.success('Supplier added');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to add supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Suppliers</h1>
          <p className="text-sm text-[var(--muted)]">Vendor & purchase order management</p>
        </div>
        <button
          type="button"
          onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Supplier', render: (s) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium">{s.name as string}</p>
                  <p className="text-[10px] text-[var(--muted)]">{s.company as string}</p>
                </div>
              </div>
            )},
            { key: 'phone', label: 'Phone' },
            { key: 'totalPaid', label: 'Total Paid', render: (s) => formatCurrency((s.totalPaid as number) || 0) },
            { key: 'totalDue', label: 'Due', render: (s) => {
              const due = (s.totalDue as number) || 0;
              return <span className={due > 0 ? 'text-amber-400' : 'text-emerald-400'}>{formatCurrency(due)}</span>;
            }},
            { key: 'rating', label: 'Rating', render: (s) => s.rating ? `⭐ ${s.rating}` : '—' },
          ]}
          data={suppliers as unknown as Record<string, unknown>[]}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Supplier">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Supplier Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm input-glow"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm input-glow"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Phone *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm input-glow"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm input-glow"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Supplier'}
          </button>
        </form>
      </Modal>
    </motion.div>
  );
}
