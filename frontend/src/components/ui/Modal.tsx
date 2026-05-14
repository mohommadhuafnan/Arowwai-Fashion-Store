'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`glass-card glass-card-glow rounded-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto gradient-border`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--glass-bg)] backdrop-blur-xl z-10">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)]">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
            <motion.div className="p-5">{children}</motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
