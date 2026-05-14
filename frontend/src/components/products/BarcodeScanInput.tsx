'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { ScanBarcode } from 'lucide-react';

interface BarcodeScanInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}

/** USB/handheld scanners type digits quickly then send Enter — this input captures that pattern. */
export default function BarcodeScanInput({
  value,
  onChange,
  onScan,
  placeholder = 'Scan barcode or type…',
  autoFocus = false,
  className = '',
  inputClassName = '',
}: BarcodeScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const finishScan = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      onChange(trimmed);
      onScan?.(trimmed);
    },
    [onChange, onScan]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishScan(value || bufferRef.current);
      bufferRef.current = '';
      return;
    }
    const now = Date.now();
    // Scanner sends chars in rapid burst (< 50ms apart)
    if (now - lastKeyTimeRef.current > 100) bufferRef.current = '';
    lastKeyTimeRef.current = now;
    if (e.key.length === 1) bufferRef.current += e.key;
  };

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' };

  return (
    <div className={`relative ${className}`}>
      <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent)]" />
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={
          inputClassName ||
          'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--input-placeholder)] input-glow'
        }
        style={inputStyle}
      />
    </div>
  );
}
