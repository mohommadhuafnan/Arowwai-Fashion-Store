'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { toggleMobileMenu } from '@/store/slices/uiSlice';
import { getInitials } from '@/lib/utils';
import { notificationAPI } from '@/lib/api';
import LiveClock from './LiveClock';
import NetworkStatus from '@/components/ui/NetworkStatus';

export default function Topbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<{ _id: string; title: string; message: string; isRead: boolean }[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    notificationAPI.getAll().then((res) => setNotifications(res.data.data || [])).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/auth');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.header
      className="h-14 sm:h-16 glass border-b border-[var(--border-subtle)] flex items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 shrink-0 relative z-30 no-print"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <button
        type="button"
        onClick={() => dispatch(toggleMobileMenu())}
        className="lg:hidden p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <motion.div className="min-w-0 lg:hidden flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
          {user?.firstName ? `Hi, ${user.firstName}` : 'AROWWAI POS'}
        </p>
        <p className="text-[10px] text-[var(--muted)] truncate">Fashion Store</p>
      </motion.div>

      <div className="hidden md:block min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </p>
        <p className="text-[10px] text-[var(--muted)]">AROWWAI Fashion Store · Mawanella</p>
      </div>

      <motion.div className="relative flex-1 max-w-lg hidden sm:block lg:ml-auto" whileFocus={{ scale: 1.01 }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
        <input
          type="text"
          placeholder="Search products, customers, orders..."
          className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] focus:outline-none input-glow transition-all"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
        />
      </motion.div>

      <motion.div className="flex items-center gap-3">
        <NetworkStatus />
        <LiveClock />

        <motion.div className="relative">
          <motion.button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
            style={{ background: 'transparent' }}
            whileHover={{ scale: 1.05, backgroundColor: 'var(--surface-hover)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--accent)' }}
              >
                {unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-12 w-80 glass-card rounded-2xl p-4 z-50 shadow-2xl"
              >
                <h3 className="text-sm font-semibold mb-3 text-[var(--foreground)]">Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--muted)] text-center py-4">No notifications</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <motion.div
                      key={n._id}
                      className="p-2 rounded-lg mb-1 cursor-pointer"
                      style={{ background: 'transparent' }}
                      whileHover={{ x: 2, backgroundColor: 'var(--surface-hover)' }}
                    >
                      <p className="text-xs font-medium text-[var(--foreground)]">{n.title}</p>
                      <p className="text-[10px] text-[var(--muted)]">{n.message}</p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="relative">
          <motion.button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-all"
            whileHover={{ scale: 1.02, backgroundColor: 'var(--surface-hover)' }}
          >
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))` }}
            >
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </motion.div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-[var(--foreground)]">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-[var(--muted)] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-48 glass-card rounded-xl p-2 z-50"
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.header>
  );
}
