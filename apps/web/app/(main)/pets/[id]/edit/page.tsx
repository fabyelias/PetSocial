'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-storage';
import { useAuthStore } from '@/stores/auth.store';
import { ImageUpload } from '@/components/ui/image-upload';

const speciesOptions = [
  { value: 'dog', label: 'Perro' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Ave' },
  { value: 'rabbit', label: 'Conejo' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'fish', label: 'Pez' },
  { value: 'reptile', label: 'Reptil' },
  { value: 'other', label: 'Otro' },
] as const;

const editPetSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']),
  breed: z.string().max(100).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  isPrivate: z.boolean().optional(),
});

type EditPetForm = z.infer<typeof editPetSchema>;

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;
  const user = useAuthStore((s) => s.user);
  const updatePet = useAuthStore((s) => s.updatePet);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [isLoadingPet, setIsLoadingPet] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPetForm>({
    resolver: zodResolver(editPetSchema),
  });

  useEffect(() => {
    async function loadPet() {
      const { data } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (data) {
        reset({
          name: data.name,
          species: data.species,
          breed: data.breed || '',
          bio: data.bio || '',
          birthDate: data.birth_date || '',
          city: data.city || '',
          country: data.country || '',
          isPrivate: data.is_private || false,
        });
        setCurrentAvatarUrl(data.avatar_url);
      }
      setIsLoadingPet(false);
    }
    loadPet();
  }, [petId, reset]);

  const onSubmit = async (data: EditPetForm) => {
    if (!user) return;

    try {
      let avatarUrl = currentAvatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadFile(
          'avatars',
          `${user.id}/${Date.now()}-${avatarFile.name}`,
          avatarFile
        );
      }

      const { error } = await supabase
        .from('pets')
        .update({
          name: data.name,
          species: data.species,
          breed: data.breed || null,
          bio: data.bio || null,
          birth_date: data.birthDate || null,
          city: data.city || null,
          country: data.country || null,
          avatar_url: avatarUrl,
          is_private: data.isPrivate || false,
        })
        .eq('id', petId);

      if (error) throw new Error(error.message);

      updatePet(petId, {
        name: data.name,
        species: data.species,
        breed: data.breed || null,
        avatarUrl: avatarUrl,
        isPrivate: data.isPrivate || false,
      });

      toast.success('Mascota actualizada');
      router.push(`/pet/${petId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar';
      toast.error(message);
    }
  };

  if (isLoadingPet) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/pet/${petId}`}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Editar mascota</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div className="flex justify-center">
            <ImageUpload
              value={avatarFile}
              onChange={setAvatarFile}
              shape="circle"
              previewUrl={currentAvatarUrl}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('isPrivate')}
              id="isPrivate"
              className="checkbox"
            />
            <label htmlFor="isPrivate" className="text-sm">
              Perfil privado
            </label>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre *
            </label>
            <input {...register('name')} type="text" id="name" className={`input ${errors.name ? 'input-error' : ''}`} />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Especie *
            </label>
            <select {...register('species')} id="species" className={`input ${errors.species ? 'input-error' : ''}`}>
              {speciesOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Raza</label>
            <input {...register('breed')} type="text" id="breed" className="input" />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
            <textarea {...register('bio')} id="bio" rows={3} className="input resize-none" maxLength={500} />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de nacimiento</label>
            <input {...register('birthDate')} type="date" id="birthDate" className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ciudad</label>
              <input {...register('city')} type="text" id="city" className="input" />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">País</label>
              <input {...register('country')} type="text" id="country" className="input" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" />Guardando...</>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </form>
    </div>
  );
}
