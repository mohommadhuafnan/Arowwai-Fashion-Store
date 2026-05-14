'use client';

import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { getMediaUrl } from '@/lib/utils';

interface ProductImagePickerProps {
  imageUrl: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
}

export default function ProductImagePicker({ imageUrl, onChange, onUpload }: ProductImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = getMediaUrl(imageUrl);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch {
      /* parent shows toast */
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-[var(--muted)] block">Product Image (optional)</label>
      <div className="flex gap-3 items-start">
        <div
          className="w-24 h-24 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden bg-[var(--surface-hover)] shrink-0"
        >
          {preview ? (
            <img src={preview} alt="Product" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-8 h-8 text-[var(--muted)]" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL or upload file"
            className="w-full px-3 py-2 rounded-xl text-xs text-[var(--foreground)]"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--foreground)]"
            >
              Upload photo
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
