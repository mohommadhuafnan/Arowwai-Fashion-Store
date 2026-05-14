'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({ columns, data, onRowClick }: DataTableProps<T>) {
  return (
    <motion.div className="glass-card rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface)]">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider', col.className)}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <motion.tr
                key={i}
                className={cn('border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors', onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(item)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-sm text-[var(--foreground)] bg-transparent', col.className)}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <p className="text-center text-[var(--muted)] text-sm py-12">No data found</p>
      )}
    </motion.div>
  );
}
