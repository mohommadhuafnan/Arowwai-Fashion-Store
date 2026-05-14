'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, ArrowRight } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import BrandLogo from '@/components/ui/BrandLogo';
import { BRAND } from '@/lib/brand';
import { formatSriLankaTime, getRoleMessage, getTimeGreeting } from '@/lib/greeting';
import { useAppSelector } from '@/store/hooks';

const AUTO_REDIRECT_MS = 4500;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

interface WelcomeGreetingProps {
  onComplete: () => void;
}

export default function WelcomeGreeting({ onComplete }: WelcomeGreetingProps) {
  const user = useAppSelector((s) => s.auth.user);
  const timezone = useAppSelector((s) => s.theme.timezone) || 'Asia/Colombo';
  const [progress, setProgress] = useState(0);
  const [timeLabel, setTimeLabel] = useState('');

  const { greeting, emoji, tagline } = getTimeGreeting(timezone);
  const firstName = user?.firstName || 'there';
  const roleLine = getRoleMessage(user?.role);
  const branch = user?.branch?.name || 'Mawanella';

  const finish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    setTimeLabel(formatSriLankaTime(timezone));
    const tick = setInterval(() => setTimeLabel(formatSriLankaTime(timezone)), 30_000);
    return () => clearInterval(tick);
  }, [timezone]);

  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / AUTO_REDIRECT_MS) * 100));
      if (elapsed < AUTO_REDIRECT_MS) requestAnimationFrame(frame);
    };
    const id = requestAnimationFrame(frame);
    const timer = setTimeout(finish, AUTO_REDIRECT_MS);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timer);
    };
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#030014]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ParticleBackground />

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/20 blur-[120px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/15 blur-[100px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg mx-4 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex justify-center mb-6">
          <motion.div
            className="relative"
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BrandLogo size="xl" showText textClassName="[&_p:first-child]:text-white [&_p:last-child]:text-slate-400" />
            <motion.span
              className="absolute -top-2 -right-2 text-3xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              {emoji}
            </motion.span>
          </motion.div>
        </motion.div>

        <motion.div variants={item} className="flex items-center justify-center gap-2 text-xs text-white/50 mb-3">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>{BRAND.fullName} · {branch}</span>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        </motion.div>

        <motion.h1
          variants={item}
          className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2"
        >
          {greeting},
        </motion.h1>

        <motion.p variants={item} className="text-2xl md:text-3xl font-semibold text-white mb-4">
          {firstName}!
        </motion.p>

        <motion.p variants={item} className="text-sm md:text-base text-white/60 leading-relaxed max-w-md mx-auto mb-2">
          {tagline}
        </motion.p>

        <motion.p variants={item} className="text-xs text-white/40 max-w-sm mx-auto mb-8">
          {roleLine}
        </motion.p>

        <motion.p variants={item} className="text-[11px] text-white/35 tabular-nums mb-8">
          {timeLabel} · Sri Lanka (LKR)
        </motion.p>

        <motion.div variants={item} className="space-y-4">
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
          >
            Enter Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>

          <motion.div className="w-48 h-1 mx-auto rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
              style={{ width: `${progress}%` }}
            />
          </motion.div>
          <p className="text-[10px] text-white/30">Opening your dashboard…</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
