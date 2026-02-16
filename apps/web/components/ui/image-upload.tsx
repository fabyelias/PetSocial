'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  previewUrl?: string | null;
  accept?: string;
  shape?: 'circle' | 'square';
}

export function ImageUpload({
  value,
  onChange,
  className,
  previewUrl,
  accept = 'image/jpeg,image/png,image/webp',
  shape = 'square',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(previewUrl || null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {preview || value ? (
        <div
          className={cn(
            'relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 cursor-pointer',
            shape === 'circle' ? 'rounded-full w-24 h-24' : 'rounded-xl w-full aspect-square max-w-48'
          )}
          onClick={() => inputRef.current?.click()}
        >
          <Image
            src={preview || ''}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors',
            shape === 'circle' ? 'rounded-full w-24 h-24' : 'rounded-xl w-full aspect-square max-w-48'
          )}
        >
          <ImagePlus className="w-8 h-8" />
          <span className="text-xs">Subir foto</span>
        </button>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function MultiImageUpload({
  files,
  onChange,
  maxFiles = 10,
  className,
}: MultiImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const remaining = maxFiles - files.length;
    const filesToAdd = newFiles.slice(0, remaining);

    onChange([...files, ...filesToAdd]);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        multiple
        onChange={handleAdd}
        className="hidden"
      />
      <div className="grid grid-cols-3 gap-2">
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
            <Image src={preview} alt={`Media ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {files.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <ImagePlus className="w-6 h-6" />
            <span className="text-xs">{files.length}/{maxFiles}</span>
          </button>
        )}
      </div>
    </div>
  );
}
