'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, Lock, PawPrint, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/supabase-storage';
import { useAuthStore, usePets, useUser } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { ImageUpload } from '@/components/ui/image-upload';

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

export default function SettingsPage() {
  const router = useRouter();
  const user = useUser();
  const pets = usePets();
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);

    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadFile(
          'avatars',
          `${user.id}/profile-${Date.now()}`,
          avatarFile
        );
      }

      const updates: Record<string, string> = { display_name: displayName };
      if (avatarUrl) updates.avatar_url = avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      await refreshUser();
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;

    try {
      await logout();
      toast.success('Cuenta eliminada');
      router.push('/');
    } catch {
      toast.error('Error al eliminar la cuenta');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      {/* Profile section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold">Perfil de usuario</h2>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <ImageUpload
              value={avatarFile}
              onChange={setAvatarFile}
              shape="circle"
              previewUrl={null}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="btn-primary btn-md w-full"
          >
            {isSavingProfile ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
            ) : (
              'Guardar perfil'
            )}
          </button>
        </div>
      </div>

      {/* Pets section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold">Mis mascotas</h2>
          </div>
          <Link href="/pets/new" className="text-sm text-primary-600 hover:text-primary-500 font-medium">
            Agregar
          </Link>
        </div>

        <div className="space-y-3">
          {pets.map((pet) => (
            <div key={pet.id} className="flex items-center gap-3">
              <Avatar src={pet.avatarUrl} alt={pet.name} size="md" />
              <div className="flex-1">
                <p className="font-medium text-sm">{pet.name}</p>
                <p className="text-xs text-gray-500">{speciesLabels[pet.species] || pet.species}</p>
              </div>
              <Link
                href={`/pets/${pet.id}/edit`}
                className="text-xs text-primary-600 hover:text-primary-500 font-medium"
              >
                Editar
              </Link>
            </div>
          ))}
          {pets.length === 0 && (
            <p className="text-sm text-gray-500">No tienes mascotas registradas</p>
          )}
        </div>
      </div>

      {/* Password section */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold">Cambiar contraseña</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !newPassword}
            className="btn-outline btn-md w-full"
          >
            {isChangingPassword ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cambiando...</>
            ) : (
              'Cambiar contraseña'
            )}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-red-600">Zona de peligro</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Al eliminar tu cuenta, se borrarán todos tus datos permanentemente.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Eliminar cuenta
        </button>
      </div>
    </div>
  );
}
