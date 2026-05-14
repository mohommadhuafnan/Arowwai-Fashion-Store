'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarCollapsed, setMobileMenuOpen } from '@/store/slices/uiSlice';
import BrandLogo from '@/components/ui/BrandLogo';
import NetworkStatus from '@/components/ui/NetworkStatus';
import { cn } from '@/lib/utils';
import { navItems } from './navItems';

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item, i) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <Link
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                isActive ? 'nav-active' : 'nav-inactive'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={onNavigate ? 'activeNavMobile' : 'activeNav'}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{ background: 'linear-gradient(to bottom, var(--accent), var(--accent-secondary))' }}
                />
              )}
              <Icon
                className={cn('w-5 h-5 shrink-0', isActive ? 'text-accent' : 'group-hover:text-accent')}
                style={isActive ? { color: 'var(--accent)' } : undefined}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          </motion.div>
        );
      })}
    </>
  );
}

export function MobileMenu() {
  const dispatch = useAppDispatch();
  const { mobileMenuOpen } = useAppSelector((s) => s.ui);

  const close = () => dispatch(setMobileMenuOpen(false));

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen, dispatch]);

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden print:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed left-0 top-0 h-full w-[min(100vw-3rem,280px)] z-50 glass border-r border-[var(--border-subtle)] flex flex-col lg:hidden print:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <motion.div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border-subtle)] min-h-[64px]">
              <BrandLogo size="sm" showText />
              <NetworkStatus compact />
              <button
                type="button"
                onClick={close}
                className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <NavLinks collapsed={false} onNavigate={close} />
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 glass border-r border-[var(--border-subtle)] flex-col transition-all duration-300 no-print',
        'hidden lg:flex',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="px-4 py-4 border-b border-[var(--border-subtle)] min-h-[72px]">
        <div className={cn('flex items-center gap-3', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          <BrandLogo size={sidebarCollapsed ? 'xs' : 'sm'} showText={!sidebarCollapsed} />
          {!sidebarCollapsed && <NetworkStatus compact />}
        </div>
        {!sidebarCollapsed && (
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-semibold mt-2.5">
            Admin Panel
          </p>
        )}
        {sidebarCollapsed && (
          <div className="flex justify-center mt-2">
            <NetworkStatus compact />
          </div>
        )}
      </motion.div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <NavLinks collapsed={sidebarCollapsed} />
      </nav>

      <motion.div className="p-3 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => dispatch(setSidebarCollapsed(!sidebarCollapsed))}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('w-5 h-5 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </motion.div>
    </motion.aside>
  );
}
