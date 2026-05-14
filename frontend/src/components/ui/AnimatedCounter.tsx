'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Animation length in seconds */
  duration?: number;
  /** Delay before count-up starts (seconds) */
  delay?: number;
  /** Format as LKR currency (Rs. 3,316) while counting */
  currency?: boolean;
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  className,
  duration = 2,
  delay = 0,
  currency = false,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const safeEnd = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    const start = mounted.current ? prevValue.current : 0;
    mounted.current = true;

    let frameId = 0;
    let delayTimer: ReturnType<typeof setTimeout>;

    const run = () => {
      const startTime = performance.now();
      const dur = duration * 1000;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / dur, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(start + (safeEnd - start) * eased));
        if (progress < 1) frameId = requestAnimationFrame(animate);
        else prevValue.current = safeEnd;
      };

      frameId = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      delayTimer = setTimeout(run, delay * 1000);
    } else {
      run();
    }

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(frameId);
    };
  }, [value, duration, delay]);

  const formatted = currency
    ? formatCurrency(display)
    : `${prefix}${display.toLocaleString('en-LK')}${suffix}`;

  return (
    <motion.span
      className={cn('tabular-nums inline-block', className)}
      initial={{ opacity: 0.6, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {formatted}
    </motion.span>
  );
}
