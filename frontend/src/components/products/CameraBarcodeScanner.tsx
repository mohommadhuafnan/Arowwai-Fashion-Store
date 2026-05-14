'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanBarcode } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface CameraBarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

type ScannerInstance = {
  stop: () => Promise<void>;
  clear: () => void;
};

export default function CameraBarcodeScanner({ open, onClose, onScan }: CameraBarcodeScannerProps) {
  const scannerRef = useRef<ScannerInstance | null>(null);
  const isRunningRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [error, setError] = useState('');

  onScanRef.current = onScan;
  onCloseRef.current = onClose;

  const safeStop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !isRunningRef.current) {
      scannerRef.current = null;
      isRunningRef.current = false;
      return;
    }
    isRunningRef.current = false;
    scannerRef.current = null;
    try {
      await scanner.stop();
    } catch {
      /* already stopped */
    }
    try {
      scanner.clear();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) {
      void safeStop();
      return;
    }

    let mounted = true;
    setError('');

    const start = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('barcode-camera-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 } },
          (decoded) => {
            if (!mounted) return;
            void (async () => {
              await safeStop();
              onScanRef.current(decoded);
              onCloseRef.current();
            })();
          },
          () => {}
        );

        if (!mounted) {
          try { await scanner.stop(); } catch { /* ignore */ }
          return;
        }

        scannerRef.current = scanner;
        isRunningRef.current = true;
      } catch {
        if (mounted) {
          setError('Camera access denied or not available. Use a USB barcode scanner instead.');
        }
      }
    };

    const t = setTimeout(() => { void start(); }, 350);

    return () => {
      mounted = false;
      clearTimeout(t);
      void safeStop();
    };
  }, [open, safeStop]);

  const handleClose = () => {
    void safeStop();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Scan Barcode">
      <div className="space-y-3">
        <p className="text-xs text-[var(--muted)]">Point camera at product barcode. Works on phone or tablet camera.</p>
        <motion.div
          id="barcode-camera-reader"
          className="w-full rounded-xl overflow-hidden border border-[var(--border)] min-h-[240px] bg-black/20"
        />
        {error && (
          <motion.div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600">
            <Camera className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
          <ScanBarcode className="w-3 h-3" />
          USB scanners: click the scan field on the page and scan — no camera needed.
        </div>
        <button type="button" onClick={handleClose} className="w-full py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
