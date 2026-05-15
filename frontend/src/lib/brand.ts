export const BRAND = {
  name: 'AROWWAI',
  tagline: 'Fashion Store',
  fullName: 'AROWWAI FASHION STORE',
  shortName: 'AROWWAI',
  location: 'Mawanella, Sri Lanka',
  logoPath: '/arowwai-logo.png',
  receiptFooter: 'Thank you for shopping with AROWWAI Fashion Store!',
  copyright: 'AROWWAI Fashion Store · Mawanella © 2026',
  /** Short welcome on invoices / PDF */
  welcomeTitle: 'Welcome',
  welcomeMessage:
    'Thank you for choosing AROWWAI — premium fashion and friendly service in the heart of Mawanella. We are glad you shopped with us today.',
  thankYouTitle: 'Thank you',
  thankYouMessage:
    'We truly appreciate your business. For exchanges, sizes, or new arrivals, visit us again or reach out using the contact details below.',
  /** Shown twice on PDF (after welcome + before footer) — edit to your real details */
  contactPhone: '+94 77 000 0000',
  contactEmail: 'hello@arowwai.lk',
  contactWebsite: 'arowwai-fashion-store.vercel.app',
} as const;

export function getLogoUrl(origin?: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${BRAND.logoPath}`;
  }
  return origin ? `${origin}${BRAND.logoPath}` : BRAND.logoPath;
}
