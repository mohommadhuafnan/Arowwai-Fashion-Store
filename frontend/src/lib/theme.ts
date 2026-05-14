export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'rose' | 'purple' | 'teal' | 'amber' | 'emerald' | 'blue';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  currency: string;
  timezone: string;
}

export const ACCENT_PALETTE: Record<AccentColor, { label: string; primary: string; secondary: string; light: string; gradient: string }> = {
  rose:    { label: 'Rose',    primary: '#e11d48', secondary: '#f43f5e', light: '#fda4af', gradient: 'from-rose-500 to-fuchsia-600' },
  purple:  { label: 'Purple',  primary: '#7c3aed', secondary: '#8b5cf6', light: '#c4b5fd', gradient: 'from-purple-600 to-violet-600' },
  teal:    { label: 'Teal',    primary: '#0d9488', secondary: '#14b8a6', light: '#5eead4', gradient: 'from-teal-600 to-cyan-600' },
  amber:   { label: 'Amber',   primary: '#d97706', secondary: '#f59e0b', light: '#fcd34d', gradient: 'from-amber-500 to-orange-600' },
  emerald: { label: 'Emerald', primary: '#059669', secondary: '#10b981', light: '#6ee7b7', gradient: 'from-emerald-600 to-teal-600' },
  blue:    { label: 'Blue',    primary: '#2563eb', secondary: '#3b82f6', light: '#93c5fd', gradient: 'from-blue-600 to-indigo-600' },
};

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  accent: 'rose',
  currency: 'LKR',
  timezone: 'Asia/Colombo',
};

export const THEME_STORAGE_KEY = 'fashionmate-theme';

export function loadTheme(): ThemeConfig {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}

export function saveTheme(config: ThemeConfig) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
}

export function applyThemeToDOM(config: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const palette = ACCENT_PALETTE[config.accent];

  root.setAttribute('data-theme', config.mode);
  root.setAttribute('data-accent', config.accent);
  root.style.setProperty('--accent', palette.primary);
  root.style.setProperty('--accent-secondary', palette.secondary);
  root.style.setProperty('--accent-light', palette.light);
}
