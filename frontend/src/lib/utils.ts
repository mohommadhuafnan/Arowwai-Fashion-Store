import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'LKR') {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency = 'LKR') {
  const prefix = currency === 'LKR' ? 'Rs.' : currency;
  if (amount >= 1_000_000) return `${prefix}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${prefix}${(amount / 1_000).toFixed(0)}k`;
  return formatCurrency(amount, currency);
}

export function formatDate(date: string | Date, timeZone = 'Asia/Colombo') {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(date));
}

export function getMediaUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getInitials(firstName: string, lastName?: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}
