'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-storage';
import { useCurrentPet, useUser } from '@/stores/auth.store';

interface StoryCreateProps {
  onClose: () => void;
  onCreated: () => void;
}

export function StoryCreate({ onClose, onCreated }: StoryCreateProps) {
  const currentPet = useCurrentPet();
  const user = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      toast.error('La imagen no puede superar 10MB');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file || !currentPet || !user) return;
    setIsUploading(true);

    try {
      const fileName = `${user.id}/${currentPet.id}/${Date.now()}-${file.name}`;
      const mediaUrl = await uploadFile('stories', fileName, file);

      const { error } = await supabase.from('stories').insert({
        pet_id: currentPet.id,
        media_url: mediaUrl,
        caption: caption.trim() || null,
      });

      if (error) throw error;

      toast.success('Historia publicada');
      onCreated();
    } catch {
      toast.error('Error al publicar la historia');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-lg">Nueva historia</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Seleccionar imagen
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF (max 10MB)</p>
              </div>
            </button>
          ) : (
            <div className="relative w-full aspect-[9/16] max-h-[400px] rounded-xl overflow-hidden bg-black">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Caption */}
          {preview && (
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Agregar un texto (opcional)..."
              maxLength={500}
              className="input w-full"
            />
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="btn-primary btn-lg w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                'Publicar historia'
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              La historia desaparecerá en 24 horas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
