'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { hydrateTheme } from '@/store/slices/themeSlice';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateTheme());
  }, [dispatch]);

  return <>{children}</>;
}
