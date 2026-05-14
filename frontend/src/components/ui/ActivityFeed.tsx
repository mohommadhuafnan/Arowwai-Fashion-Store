'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { formatDate } from '@/lib/utils';

const demoActivity = [
  { type: 'sale', message: 'New sale recorded — INV-2847', timestamp: new Date().toISOString(), status: 'completed' as const },
  { type: 'product', message: 'Product stock updated — Denim Jacket', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'completed' as const },
  { type: 'customer', message: 'New customer registered — Priya S.', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'pending' as const },
];

export default function ActivityFeed() {
  const liveActivity = useAppSelector((s) => s.ui.liveActivity);
  const items = liveActivity.length > 0
    ? liveActivity.map((a) => ({ ...a, status: 'completed' as const }))
    : demoActivity;

  return (
    <motion.div
      className="glass-card rounded-2xl p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-[var(--accent)]" />
        Recent Activity
      </h3>
      <div className="space-y-2 max-h-[220px] overflow-y-auto">
        {items.slice(0, 8).map((item, i) => (
          <motion.div
            key={`${item.timestamp}-${i}`}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <motion.div className="min-w-0">
              <p className="text-xs font-medium truncate">{item.message}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{formatDate(item.timestamp)}</p>
            </motion.div>
            <span className={`status-badge shrink-0 ${item.status === 'completed' ? 'status-completed' : 'status-pending'}`}>
              {item.status === 'completed' ? 'Done' : 'Pending'}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
