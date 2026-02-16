'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const createPetSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50, 'Máximo 50 caracteres'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'], {
    required_error: 'Selecciona una especie',
  }),
  breed: z.string().max(100).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
});

type CreatePetForm = z.infer<typeof createPetSchema>;

export default function NewPetPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addPet = useAuthStore((s) => s.addPet);
  const setCurrentPet = useAuthStore((s) => s.setCurrentPet);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePetForm>({
    resolver: zodResolver(createPetSchema),
    defaultValues: {
      name: '',
      species: undefined,
      breed: '',
      bio: '',
      birthDate: '',
      city: '',
      country: '',
    },
  });

  const onSubmit = async (data: CreatePetForm) => {
    if (!user) return;

    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        avatarUrl = await uploadFile(
          'avatars',
          `${user.id}/${Date.now()}-${avatarFile.name}`,
          avatarFile
        );
      }

      const { data: pet, error } = await supabase
        .from('pets')
        .insert({
          owner_id: user.id,
          name: data.name,
          species: data.species,
          breed: data.breed || null,
          bio: data.bio || null,
          birth_date: data.birthDate || null,
          city: data.city || null,
          country: data.country || null,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      addPet({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        avatarUrl: pet.avatar_url,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      });

      setCurrentPet(pet.id);
      toast.success('¡Mascota creada exitosamente!');
      router.push('/feed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la mascota';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/feed"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Nueva mascota</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <ImageUpload
              value={avatarFile}
              onChange={setAvatarFile}
              shape="circle"
            />
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="Nombre de tu mascota"
              className={`input ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Especie */}
          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Especie *
            </label>
            <select
              {...register('species')}
              id="species"
              className={`input ${errors.species ? 'input-error' : ''}`}
            >
              <option value="">Selecciona una especie</option>
              {speciesOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.species && (
              <p className="mt-1 text-sm text-red-500">{errors.species.message}</p>
            )}
          </div>

          {/* Raza */}
          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Raza (opcional)
            </label>
            <input
              {...register('breed')}
              type="text"
              id="breed"
              placeholder="Ej: Golden Retriever"
              className="input"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Bio (opcional)
            </label>
            <textarea
              {...register('bio')}
              id="bio"
              rows={3}
              placeholder="Cuéntanos sobre tu mascota..."
              className="input resize-none"
              maxLength={500}
            />
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Fecha de nacimiento (opcional)
            </label>
            <input
              {...register('birthDate')}
              type="date"
              id="birthDate"
              className="input"
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Ciudad
              </label>
              <input
                {...register('city')}
                type="text"
                id="city"
                placeholder="Ciudad"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                País
              </label>
              <input
                {...register('country')}
                type="text"
                id="country"
                placeholder="País"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary btn-lg w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creando mascota...
            </>
          ) : (
            'Crear mascota'
          )}
        </button>
      </form>
    </div>
  );
}
