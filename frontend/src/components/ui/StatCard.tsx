'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import Sparkline from './Sparkline';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  gradient?: string;
  iconColor?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  gradient = 'from-cyan-600/15 to-purple-600/10',
  iconColor = 'text-cyan-400',
  sparklineData,
  sparklineColor = '#06b6d4',
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className="glass-card glass-card-glow rounded-2xl p-5 relative overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <motion.div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', gradient)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <motion.div
            className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
          >
            <Icon className={cn('w-5 h-5', iconColor)} />
          </motion.div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              'text-xs mt-1.5 font-medium',
              changeType === 'up' ? 'text-emerald-400' : changeType === 'down' ? 'text-red-400' : 'text-[var(--muted)]'
            )}>
              {changeType === 'up' && '↑ '}
              {changeType === 'down' && '↓ '}
              {change}
            </p>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color={sparklineColor} className="opacity-80 mt-1" />
        )}
      </div>
    </motion.div>
  );
}
