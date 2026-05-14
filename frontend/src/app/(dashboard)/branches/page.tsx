'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Phone } from 'lucide-react';
import { branchAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const DEMO = [
  { _id: '1', name: 'Main Store', code: 'MAIN', address: { city: 'Mumbai', state: 'Maharashtra' }, phone: '+91 98765 43210', performance: { totalSales: 8950000, monthlyRevenue: 1245800 }, isActive: true },
  { _id: '2', name: 'Delhi Branch', code: 'DEL', address: { city: 'New Delhi', state: 'Delhi' }, phone: '+91 87654 32109', performance: { totalSales: 5200000, monthlyRevenue: 780000 }, isActive: true },
  { _id: '3', name: 'Bangalore Hub', code: 'BLR', address: { city: 'Bangalore', state: 'Karnataka' }, phone: '+91 76543 21098', performance: { totalSales: 3800000, monthlyRevenue: 560000 }, isActive: true },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState(DEMO);

  useEffect(() => {
    branchAPI.getAll().then((res) => { if (res.data.data?.length) setBranches(res.data.data); }).catch(() => {});
  }, []);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl font-bold">Branches</h1>
        <p className="text-sm text-white/50">Multi-branch management & analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch, i) => (
          <motion.div
            key={branch._id}
            className="glass-card rounded-2xl p-6 group cursor-pointer hover:border-purple-500/30 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-start justify-between mb-4">
              <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-purple-400" />
              </motion.div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-white/50">{branch.code}</span>
            </div>
            <h3 className="font-semibold mb-2">{branch.name}</h3>
            <div className="space-y-1.5 text-xs text-white/40">
              <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {branch.address?.city}, {branch.address?.state}</p>
              <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {branch.phone}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
              <div><p className="text-[10px] text-white/30">Monthly</p><p className="text-sm font-semibold text-cyan-400">{formatCurrency(branch.performance?.monthlyRevenue || 0)}</p></div>
              <div><p className="text-[10px] text-white/30">Total</p><p className="text-sm font-semibold">{formatCurrency(branch.performance?.totalSales || 0)}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
