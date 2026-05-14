'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { Toaster } from 'react-hot-toast';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 10, 30, 0.95)',
            color: '#f0f0f5',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
    </Provider>
  );
}
