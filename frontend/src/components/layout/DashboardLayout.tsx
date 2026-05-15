'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser, hydrateFromStorage } from '@/store/slices/authSlice';
import { setMobileMenuOpen } from '@/store/slices/uiSlice';
import Sidebar, { MobileMenu } from './Sidebar';
import Topbar from './Topbar';
import { cn } from '@/lib/utils';

let sessionBootstrapped = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth');
      return;
    }

    dispatch(hydrateFromStorage());
    setReady(true);

    if (!sessionBootstrapped && localStorage.getItem('offlineMode') !== 'true') {
      sessionBootstrapped = true;
      dispatch(loadUser());
    }
  }, [dispatch, router]);

  useEffect(() => {
    if (ready && !isAuthenticated && !localStorage.getItem('token')) {
      router.replace('/auth');
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    dispatch(setMobileMenuOpen(false));
  }, [pathname, dispatch]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-app text-[var(--muted)] text-sm">
        Loading dashboard…
      </div>
    );
  }

  if (!isAuthenticated && typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return null;
  }

  const isPOS = pathname === '/pos';

  return (
    <motion.div className="flex h-screen overflow-hidden bg-ambient" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Sidebar />
      <MobileMenu />
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-10 ml-0',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}
      >
        <Topbar />
        <main
          className={cn(
            'flex-1',
            isPOS ? 'flex min-h-0 flex-col overflow-hidden p-0' : 'overflow-auto p-4 sm:p-6'
          )}
        >
          {children}
        </main>
      </div>
    </motion.div>
  );
}
