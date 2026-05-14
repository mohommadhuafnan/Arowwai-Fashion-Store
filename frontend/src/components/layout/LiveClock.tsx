'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

export default function LiveClock() {
  const timezone = useAppSelector((s) => s.theme.timezone) || 'Asia/Colombo';
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <motion.div className="hidden lg:block w-36 h-10 rounded-full bg-[var(--surface)] animate-pulse" />;
  }

  const time = new Intl.DateTimeFormat('en-LK', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const date = new Intl.DateTimeFormat('en-LK', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);

  return (
    <motion.div
      className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[11px]"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
      <span className="text-[var(--muted)]">{date}</span>
      <span className="text-[var(--border)]">|</span>
      <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
      <span className="font-semibold tabular-nums text-[var(--foreground)]">{time}</span>
    </motion.div>
  );
}
