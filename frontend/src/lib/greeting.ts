export type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeGreeting {
  greeting: string;
  period: DayPeriod;
  emoji: string;
  tagline: string;
}

const ROLE_LINES: Record<string, string> = {
  shop_owner: 'Your store is ready — manage sales, stock, and style from one place.',
  manager: 'Lead the floor today — your team and POS are synced for Mawanella.',
  cashier: 'Counter ready — scan, sell, and delight every customer.',
  inventory_staff: 'Stock and shelves await — keep Fashion Mate looking sharp.',
};

export function getSriLankaHour(timeZone = 'Asia/Colombo'): number {
  const hour = new Intl.DateTimeFormat('en-LK', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).format(new Date());
  return Number(hour);
}

export function getTimeGreeting(timeZone = 'Asia/Colombo'): TimeGreeting {
  const hour = getSriLankaHour(timeZone);

  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good Morning',
      period: 'morning',
      emoji: '🌅',
      tagline: 'A fresh day at Fashion Mate — let\'s welcome shoppers to Mawanella.',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good Afternoon',
      period: 'afternoon',
      emoji: '☀️',
      tagline: 'Busy hours ahead — serve every customer with style and a smile.',
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good Evening',
      period: 'evening',
      emoji: '🌆',
      tagline: 'Golden hour at the shop — close strong and count a great day.',
    };
  }
  return {
    greeting: 'Good Evening',
    period: 'night',
    emoji: '🌙',
    tagline: 'Still on duty? Your POS is here whenever the shop needs you.',
  };
}

export function getRoleMessage(role?: string): string {
  if (!role) return 'Welcome back to Fashion Mate — Mawanella\'s fashion POS.';
  return ROLE_LINES[role] || 'Welcome back to Fashion Mate — Mawanella\'s fashion POS.';
}

export function formatSriLankaTime(timeZone = 'Asia/Colombo') {
  return new Intl.DateTimeFormat('en-LK', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}
