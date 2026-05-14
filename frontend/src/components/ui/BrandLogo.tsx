'use client';

import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<BrandLogoSize, { box: string; px: number }> = {
  xs: { box: 'w-8 h-8', px: 32 },
  sm: { box: 'w-10 h-10', px: 40 },
  md: { box: 'w-14 h-14', px: 56 },
  lg: { box: 'w-20 h-20', px: 80 },
  xl: { box: 'w-28 h-28', px: 112 },
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export default function BrandLogo({
  size = 'sm',
  showText = false,
  className,
  textClassName,
}: BrandLogoProps) {
  const { box, px } = SIZE_MAP[size];

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <div
        className={cn(
          'relative shrink-0 rounded-lg overflow-hidden bg-black ring-1 ring-black/20 dark:ring-white/15 shadow-sm',
          box
        )}
        title={BRAND.fullName}
      >
        <Image
          src={BRAND.logoPath}
          alt={BRAND.fullName}
          width={px}
          height={px}
          className="object-contain w-full h-full p-0.5"
          priority={size === 'lg' || size === 'xl'}
          unoptimized
        />
      </div>
      {showText && (
        <div className={cn('min-w-0 leading-tight', textClassName)}>
          <p className="font-bold text-sm tracking-wide text-[var(--foreground)] truncate">{BRAND.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] truncate">{BRAND.tagline}</p>
        </div>
      )}
    </div>
  );
}
