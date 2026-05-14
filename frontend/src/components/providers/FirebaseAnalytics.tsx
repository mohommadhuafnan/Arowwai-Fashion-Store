'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/firebase';

export default function FirebaseAnalytics() {
  useEffect(() => {
    initAnalytics().catch(() => {});
  }, []);
  return null;
}
