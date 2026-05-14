'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Crown, Pencil, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { customerAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Customer {
  _id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  loyaltyPoints?: number;
  membershipLevel?: string;
  totalSpent?: number;
  totalOrders?: number;
  isActive?: boolean;
}

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', email: '', membershipLevel: 'bronze',
};

const LEVEL_COLORS: Record<string, string> = {
  bronze: 'bg-amber-700/20 text-amber-600',
  silver: 'bg-gray-400/20 text-gray-500',
  gold: 'bg-yellow-500/20 text-yellow-600',
  platinum: 'bg-purple-500/20 text-purple-500',
};

const LEVELS = ['bronze', 'silver', 'gold', 'platinum'];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data.data || []);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName || '',
      phone: c.phone,
      email: c.email || '',
      membershipLevel: c.membershipLevel || 'bronze',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim()) {
      toast.error('First name and phone are required');
      return;
    }
    setSaving(true);
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      membershipLevel: form.membershipLevel,
    };
    try {
      if (editing) {
        await customerAPI.update(editing._id, payload);
        toast.success('Customer updated');
      } else {
        await customerAPI.create(payload);
        toast.success('Customer created');
      }
      setModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await customerAPI.update(deleteConfirm._id, { isActive: false });
      toast.success('Customer removed');
      setDeleteConfirm(null);
      loadData();
    } catch {
      toast.error('Failed to remove customer');
    }
  };

  const filtered = customers.filter((c) =>
    `${c.firstName} ${c.lastName || ''}`.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] input-glow';
  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Customers</h1>
          <p className="text-sm text-[var(--muted)]">{customers.length} customers · CRM & loyalty</p>
        </div>
        <motion.button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" /> Add Customer
        </motion.button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search by name or phone..."
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
            { key: 'name', label: 'Customer', render: (c) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center text-xs font-bold text-white">
                  {(c.firstName as string)?.[0]}{(c.lastName as string)?.[0] || ''}
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{c.firstName as string} {c.lastName as string}</p>
                  <p className="text-[10px] text-[var(--muted)]">{c.phone as string}</p>
                </div>
              </div>
            )},
            { key: 'email', label: 'Email', render: (c) => (c.email as string) || '—' },
            { key: 'membershipLevel', label: 'Level', render: (c) => (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${LEVEL_COLORS[c.membershipLevel as string] || LEVEL_COLORS.bronze}`}>
                <Crown className="w-3 h-3" /> {c.membershipLevel as string}
              </span>
            )},
            { key: 'loyaltyPoints', label: 'Points', render: (c) => (c.loyaltyPoints as number) ?? 0 },
            { key: 'totalSpent', label: 'Total Spent', render: (c) => formatCurrency((c.totalSpent as number) || 0) },
            { key: 'totalOrders', label: 'Orders', render: (c) => (c.totalOrders as number) ?? 0 },
            { key: 'actions', label: '', render: (c) => (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(c as unknown as Customer)} className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--accent)]">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(c as unknown as Customer)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )},
          ]}
          data={filtered as unknown as Record<string, unknown>[]}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} wide>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.div>
              <label className="text-xs text-[var(--muted)] mb-1 block">First Name *</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} style={inputStyle} placeholder="Nimal" />
            </motion.div>
            <motion.div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} style={inputStyle} placeholder="Perera" />
            </motion.div>
            <motion.div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Phone *</label>
              <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} style={inputStyle} placeholder="0771234567" />
            </motion.div>
            <motion.div>
              <label className="text-xs text-[var(--muted)] mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} style={inputStyle} placeholder="customer@email.lk" />
            </motion.div>
            <motion.div className="col-span-2">
              <label className="text-xs text-[var(--muted)] mb-1 block">Membership Level</label>
              <select value={form.membershipLevel} onChange={(e) => setForm({ ...form, membershipLevel: e.target.value })} className={inputCls} style={inputStyle}>
                {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </motion.div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl btn-primary text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Customer">
        <p className="text-sm text-[var(--muted)] mb-4">
          Remove <strong className="text-[var(--foreground)]">{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong> from active customers?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">Remove</button>
        </div>
      </Modal>
    </motion.div>
  );
}
