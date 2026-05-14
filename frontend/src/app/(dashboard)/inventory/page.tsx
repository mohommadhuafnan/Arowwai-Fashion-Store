'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowRightLeft } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import StatCard from '@/components/ui/StatCard';
import { inventoryAPI } from '@/lib/api';

const DEMO = [
  { _id: '1', product: { name: 'Denim Jacket', sku: 'DJ-001' }, quantity: 3, lowStockThreshold: 5, warehouse: 'main', damaged: 0 },
  { _id: '2', product: { name: 'Silk Dress', sku: 'SD-002' }, quantity: 22, lowStockThreshold: 5, warehouse: 'main', damaged: 1 },
  { _id: '3', product: { name: 'Sneakers', sku: 'SN-003' }, quantity: 67, lowStockThreshold: 10, warehouse: 'main', damaged: 0 },
  { _id: '4', product: { name: 'Wool Blazer', sku: 'BZ-006' }, quantity: 2, lowStockThreshold: 5, warehouse: 'main', damaged: 0 },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState(DEMO);
  const lowStock = inventory.filter((i) => i.quantity <= i.lowStockThreshold);

  useEffect(() => {
    inventoryAPI.getAll().then((res) => { if (res.data.data?.length) setInventory(res.data.data); }).catch(() => {});
  }, []);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-white/50">Real-time stock tracking & management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Items" value={inventory.length} icon={Package} />
        <StatCard title="Low Stock Alerts" value={lowStock.length} change="Needs attention" changeType="down" icon={AlertTriangle} gradient="from-amber-600/20 to-red-600/10" />
        <StatCard title="Warehouses" value={1} icon={ArrowRightLeft} gradient="from-cyan-600/20 to-purple-600/10" />
      </div>

      <DataTable
        columns={[
          { key: 'product', label: 'Product', render: (i) => {
            const p = i.product as { name: string; sku: string };
            return <motion.div><p className="font-medium">{p?.name}</p><p className="text-[10px] text-white/40">{p?.sku}</p></motion.div>;
          }},
          { key: 'quantity', label: 'Stock', render: (i) => {
            const q = i.quantity as number;
            const t = i.lowStockThreshold as number;
            return <span className={q <= t ? 'text-amber-400 font-medium' : 'text-emerald-400'}>{q}</span>;
          }},
          { key: 'lowStockThreshold', label: 'Threshold' },
          { key: 'damaged', label: 'Damaged', render: (i) => {
            const d = i.damaged as number;
            return d > 0 ? <span className="text-red-400">{d}</span> : '0';
          }},
          { key: 'warehouse', label: 'Warehouse', render: (i) => <span className="capitalize">{i.warehouse as string}</span> },
        ]}
        data={inventory as unknown as Record<string, unknown>[]}
      />
    </motion.div>
  );
}
