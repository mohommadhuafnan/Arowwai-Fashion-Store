'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import WelcomeGreeting from '@/components/auth/WelcomeGreeting';
import { useAppDispatch } from '@/store/hooks';
import { hydrateFromStorage } from '@/store/slices/authSlice';

const WELCOME_FLAG = 'showWelcome';

export default function WelcomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth');
      return;
    }
    if (sessionStorage.getItem(WELCOME_FLAG) !== '1') {
      router.replace('/dashboard');
      return;
    }
    dispatch(hydrateFromStorage());
    setReady(true);
  }, [dispatch, router]);

  const complete = useCallback(() => {
    sessionStorage.removeItem(WELCOME_FLAG);
    router.replace('/dashboard');
  }, [router]);

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-[#030014] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <WelcomeGreeting onComplete={complete} />
    </AnimatePresence>
  );
}
