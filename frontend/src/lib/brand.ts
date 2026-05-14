export const BRAND = {
  name: 'AROWWAI',
  tagline: 'Fashion Store',
  fullName: 'AROWWAI FASHION STORE',
  shortName: 'AROWWAI',
  location: 'Mawanella, Sri Lanka',
  logoPath: '/arowwai-logo.png',
  receiptFooter: 'Thank you for shopping with AROWWAI Fashion Store!',
  copyright: 'AROWWAI Fashion Store · Mawanella © 2026',
} as const;

export function getLogoUrl(origin?: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${BRAND.logoPath}`;
  }
  return origin ? `${origin}${BRAND.logoPath}` : BRAND.logoPath;
}
