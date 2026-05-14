import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import StoreProvider from '@/components/providers/StoreProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import FirebaseAnalytics from '@/components/providers/FirebaseAnalytics';
import { BRAND } from '@/lib/brand';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AROWWAI Fashion Store — POS',
  description: 'Fashion retail POS for Mawanella — access from any phone or device, 24/7',
  applicationName: 'AROWWAI POS',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: BRAND.logoPath, type: 'image/png' }],
    shortcut: BRAND.logoPath,
    apple: BRAND.logoPath,
  },
  appleWebApp: {
    capable: true,
    title: 'AROWWAI POS',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0c0c0f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} data-theme="dark" data-accent="rose" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('fashionmate-theme')||'{}');var d=document.documentElement;d.setAttribute('data-theme',t.mode||'dark');d.setAttribute('data-accent',t.accent||'rose');var p={rose:['#e11d48','#f43f5e','#fda4af'],purple:['#7c3aed','#8b5cf6','#c4b5fd'],teal:['#0d9488','#14b8a6','#5eead4'],amber:['#d97706','#f59e0b','#fcd34d'],emerald:['#059669','#10b981','#6ee7b7'],blue:['#2563eb','#3b82f6','#93c5fd']};var c=p[t.accent||'rose'];d.style.setProperty('--accent',c[0]);d.style.setProperty('--accent-secondary',c[1]);d.style.setProperty('--accent-light',c[2]);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-app text-[var(--foreground)]">
        <StoreProvider>
          <ThemeProvider>
            <FirebaseAnalytics />
            {children}
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
