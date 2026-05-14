'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sun, Moon, Check, Receipt, Bell, Shield, Banknote } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setThemeMode, setAccentColor } from '@/store/slices/themeSlice';
import { settingsAPI } from '@/lib/api';
import { ACCENT_PALETTE, type AccentColor } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface SettingRow {
  key: string;
  value: string | number | boolean;
  category?: string;
  description?: string;
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { mode, accent, currency, timezone } = useAppSelector((s) => s.theme);
  const [settings, setSettings] = useState<SettingRow[]>([]);

  useEffect(() => {
    settingsAPI.getAll().then((res) => {
      if (res.data.data?.length) setSettings(res.data.data);
    }).catch(() => {});
  }, []);

  const getSetting = (key: string, fallback: string) => {
    const found = settings.find((s) => s.key === key);
    return found ? String(found.value) : fallback;
  };

  const invoiceItems = [
    { label: 'Company Name', value: getSetting('company_name', 'Fashion Mate') },
    { label: 'Invoice Prefix', value: getSetting('invoice_prefix', 'FM') },
    { label: 'Footer Text', value: 'Thank you — Fashion Mate, Mawanella!' },
  ];

  const notificationItems = [
    { label: 'Email Notifications', value: true },
    { label: 'WhatsApp Notifications', value: true },
    { label: 'Push Notifications', value: true },
  ];

  const securityItems = [
    { label: 'Two-Factor Auth', value: false },
    { label: 'Session Timeout', value: '30 min' },
  ];

  const otherSections = [
    { title: 'Invoice', icon: Receipt, items: invoiceItems },
    { title: 'Notifications', icon: Bell, items: notificationItems },
    { title: 'Security', icon: Shield, items: securityItems },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div
        className="rounded-2xl p-6 glass-card overflow-hidden relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, var(--accent), transparent 60%)' }}
        />
        <div className="relative">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
          <p className="text-sm text-[var(--muted)]">Fashion Mate · Mawanella, Sri Lanka</p>
        </div>
      </motion.div>

      <motion.div className="glass-card rounded-2xl p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <motion.div className="flex items-center gap-2 mb-5">
          <Palette className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Appearance & Theme</h3>
        </motion.div>

        <p className="text-xs text-[var(--muted)] mb-3">Display mode</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['dark', 'light'] as const).map((m) => {
            const Icon = m === 'dark' ? Moon : Sun;
            const active = mode === m;
            return (
              <motion.button
                key={m}
                onClick={() => dispatch(setThemeMode(m))}
                className={cn(
                  'relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                  active ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]/40'
                )}
                style={{ background: m === 'light' ? '#f8fafc' : '#0a0a1a', color: m === 'light' ? '#0f172a' : '#f0f0f5' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-semibold capitalize">{m} Mode</p>
                  <p className="text-[10px] opacity-60">{m === 'light' ? 'High contrast · easy to read' : 'Premium dark experience'}</p>
                </div>
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <p className="text-xs text-[var(--muted)] mb-3">Accent color</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(Object.keys(ACCENT_PALETTE) as AccentColor[]).map((key) => {
            const palette = ACCENT_PALETTE[key];
            const active = accent === key;
            return (
              <motion.button
                key={key}
                onClick={() => dispatch(setAccentColor(key))}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                  active ? 'border-[var(--accent)] scale-105' : 'border-[var(--border)] hover:scale-105'
                )}
                style={{ background: 'var(--surface)' }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
                />
                <span className="text-[10px] font-medium text-[var(--foreground)]">{palette.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.div className="glass-card rounded-2xl p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <motion.div className="flex items-center gap-2 mb-4">
          <Banknote className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Currency & Region</h3>
        </motion.div>
        <div className="space-y-3">
          {[
            { label: 'Currency', value: `${getSetting('currency', currency)} (Rs. — Sri Lankan Rupee)` },
            { label: 'Tax Rate', value: `${getSetting('tax_rate', '18')}%` },
            { label: 'Country', value: 'Sri Lanka' },
            { label: 'Timezone', value: `${timezone} (UTC+5:30)` },
            { label: 'Shop Location', value: 'Mawanella, Kegalle District' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-sm text-[var(--muted-strong)]">{item.label}</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {otherSections.map((section, si) => {
        const Icon = section.icon;
        return (
          <motion.div key={section.title} className="glass-card rounded-2xl p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + si * 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-sm text-[var(--muted-strong)]">{item.label}</span>
                  <span className="text-sm text-[var(--muted)]">{String(item.value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
