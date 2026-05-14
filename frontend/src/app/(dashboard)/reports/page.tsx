'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, BarChart3, Package, Receipt, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BRAND } from '@/lib/brand';
import { reportAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report', icon: BarChart3, description: 'Revenue, orders, and transaction details', api: 'sales' },
  { id: 'inventory', label: 'Inventory Report', icon: Package, description: 'Stock levels, valuations, and movements', api: 'inventory' },
  { id: 'tax', label: 'Tax Report', icon: Receipt, description: 'Tax collected and compliance summary', api: 'tax' },
] as const;

type ReportId = typeof REPORT_TYPES[number]['id'];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportId>('sales');
  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState<{ totalRevenue?: number; count?: number }>({});
  const [inventorySummary, setInventorySummary] = useState<{ totalValue?: number; lowStockCount?: number }>({});
  const [taxTotal, setTaxTotal] = useState(0);

  const loadReport = async (id: ReportId) => {
    setLoading(true);
    try {
      if (id === 'sales') {
        const { data } = await reportAPI.getSales();
        setSalesSummary(data.data?.summary || {});
      } else if (id === 'inventory') {
        const { data } = await reportAPI.getInventory();
        setInventorySummary({ totalValue: data.data?.totalValue, lowStockCount: data.data?.lowStockCount });
      } else if (id === 'tax') {
        const { data } = await reportAPI.getTax();
        const total = (data.data || []).reduce((s: number, r: { totalTax: number }) => s + (r.totalTax || 0), 0);
        setTaxTotal(total);
      }
    } catch {
      toast.error('Could not load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport]);

  const totalRevenue = salesSummary.totalRevenue || 0;
  const transactions = salesSummary.count || 0;
  const avgOrder = transactions > 0 ? totalRevenue / transactions : 0;

  const handlePrint = () => window.print();

  return (
    <motion.div className="space-y-6 relative z-10" initial={false} animate={{ opacity: 1 }}>
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Reports</h1>
        <p className="text-sm text-[var(--muted)]">Sales, inventory & tax summaries · {BRAND.location}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        {REPORT_TYPES.map((report, i) => {
          const Icon = report.icon;
          return (
            <motion.button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`glass-card rounded-2xl p-5 text-left transition-all ${activeReport === report.id ? 'border-[var(--accent)]/40 ring-1 ring-[var(--accent)]/20' : 'hover:border-[var(--border)]'}`}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
            >
              <Icon className={`w-6 h-6 mb-3 ${activeReport === report.id ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <p className="text-sm font-medium text-[var(--foreground)]">{report.label}</p>
              <p className="text-[10px] text-[var(--muted)] mt-1">{report.description}</p>
            </motion.button>
          );
        })}
      </div>

      <motion.div className="glass-card rounded-2xl p-6 print-report" key={activeReport} initial={false} animate={{ opacity: 1 }}>
        <div className="hidden print:block mb-6">
          <p className="text-xs text-slate-500">{BRAND.fullName}</p>
          <h2 className="text-xl font-bold capitalize">{activeReport} Report</h2>
        </div>
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h3 className="font-semibold capitalize text-[var(--foreground)]">{activeReport} Report</h3>
          <div className="flex gap-2">
            <button
              onClick={() => loadReport(activeReport)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] text-xs text-[var(--foreground)] hover:opacity-80"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Refresh
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white btn-primary">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>
        ) : activeReport === 'sales' ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
              <p className="text-[10px] text-[var(--muted)]">Total Revenue</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
              <p className="text-[10px] text-[var(--muted)]">Transactions</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{transactions}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
              <p className="text-[10px] text-[var(--muted)]">Avg. Order</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(avgOrder)}</p>
            </div>
          </div>
        ) : activeReport === 'inventory' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
              <p className="text-[10px] text-[var(--muted)]">Stock Value (Cost)</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(inventorySummary.totalValue || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]">
              <p className="text-[10px] text-[var(--muted)]">Low Stock Items</p>
              <p className="text-lg font-bold text-amber-400">{inventorySummary.lowStockCount || 0}</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--surface-hover)] max-w-xs">
            <p className="text-[10px] text-[var(--muted)]">Total Tax Collected</p>
            <p className="text-lg font-bold text-[var(--foreground)]">{formatCurrency(taxTotal)}</p>
          </div>
        )}

        {!loading && transactions === 0 && activeReport === 'sales' && (
          <p className="text-xs text-[var(--muted)] text-center py-6 mt-4">No sales yet — complete a POS transaction to see live data.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
