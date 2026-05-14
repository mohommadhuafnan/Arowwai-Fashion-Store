'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      if (!navigator.onLine) {
        if (mounted) setOnline(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
        if (mounted) setOnline(res.ok);
      } catch {
        if (mounted) setOnline(false);
      }
    };

    const onConnectionChange = () => { void check(); };

    check();
    window.addEventListener('online', onConnectionChange);
    window.addEventListener('offline', onConnectionChange);
    const interval = setInterval(check, 20000);

    return () => {
      mounted = false;
      window.removeEventListener('online', onConnectionChange);
      window.removeEventListener('offline', onConnectionChange);
      clearInterval(interval);
    };
  }, []);

  return online;
}

export default function NetworkStatus({ compact = false }: { compact?: boolean }) {
  const online = useNetworkStatus();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shrink-0',
        compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]',
        online
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-red-500/30 bg-red-500/10 text-red-400'
      )}
      title={online ? 'Connected' : 'No network connection'}
    >
      <span
        className={cn(
          'rounded-full shrink-0',
          compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
          online ? 'bg-emerald-400' : 'bg-red-500'
        )}
      />
      {!compact && <span className="font-semibold uppercase tracking-wide">{online ? 'Online' : 'Offline'}</span>}
    </div>
  );
}
