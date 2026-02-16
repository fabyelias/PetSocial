'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Globe, Users, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-storage';
import { useCurrentPet } from '@/stores/auth.store';
import { MultiImageUpload } from '@/components/ui/image-upload';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const visibilityOptions = [
  { value: 'public', label: 'Público', icon: Globe, description: 'Todos pueden ver' },
  { value: 'followers', label: 'Seguidores', icon: Users, description: 'Solo seguidores' },
  { value: 'private', label: 'Privado', icon: Lock, description: 'Solo tú' },
] as const;

export default function CreatePostPage() {
  const router = useRouter();
  const currentPet = useCurrentPet();
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPet || mediaFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          pet_id: currentPet.id,
          caption: caption || null,
          visibility,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const url = await uploadFile(
          'post-media',
          `${currentPet.id}/${post.id}/${i}-${file.name}`,
          file
        );
        const isVideo = file.type.startsWith('video/');

        await supabase.from('post_media').insert({
          post_id: post.id,
          type: isVideo ? 'video' : 'image',
          url,
          position: i,
          mime_type: file.type,
          file_size: file.size,
        });
      }

      toast.success('Publicación creada');
      router.push('/feed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la publicación';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentPet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Necesitas una mascota para publicar</p>
        <Link href="/pets/new" className="btn-primary btn-md">
          Crear mascota
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/feed"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Nueva publicación</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          {/* Pet info */}
          <div className="flex items-center gap-3">
            <Avatar src={currentPet.avatarUrl} alt={currentPet.name} size="md" />
            <span className="font-semibold text-sm">{currentPet.name}</span>
          </div>

          {/* Media upload */}
          <MultiImageUpload
            files={mediaFiles}
            onChange={setMediaFiles}
            maxFiles={10}
          />

          {/* Caption */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe un pie de foto..."
              rows={4}
              maxLength={2200}
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {caption.length}/2200
            </p>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibilidad
            </label>
            <div className="flex gap-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                      visibility === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || mediaFiles.length === 0}
          className="btn-primary btn-lg w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Publicando...
            </>
          ) : (
            'Publicar'
          )}
        </button>
      </form>
    </div>
  );
}
