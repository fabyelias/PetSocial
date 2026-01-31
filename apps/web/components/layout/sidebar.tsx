'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  MessageCircle,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useCurrentPet, usePets } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', icon: Home, label: 'Inicio' },
  { href: '/search', icon: Search, label: 'Buscar' },
  { href: '/create', icon: PlusSquare, label: 'Crear' },
  { href: '/notifications', icon: Heart, label: 'Notificaciones' },
  { href: '/messages', icon: MessageCircle, label: 'Mensajes' },
];

export function Sidebar() {
  const pathname = usePathname();
  const currentPet = useCurrentPet();
  const pets = usePets();
  const logout = useAuthStore((state) => state.logout);
  const setCurrentPet = useAuthStore((state) => state.setCurrentPet);
  const [showPetSelector, setShowPetSelector] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 lg:w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/feed" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🐾</span>
          </div>
          <span className="text-xl font-bold">PetSocial</span>
        </Link>
      </div>

      {/* Pet Selector */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowPetSelector(!showPetSelector)}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <Avatar
            src={currentPet?.avatarUrl}
            alt={currentPet?.name || 'Mascota'}
            size="md"
          />
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">
              {currentPet?.name || 'Selecciona mascota'}
            </div>
            <div className="text-xs text-gray-500">
              {currentPet?.species || 'Sin mascota'}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              showPetSelector && 'rotate-180'
            )}
          />
        </button>

        {/* Pet dropdown */}
        {showPetSelector && pets.length > 1 && (
          <div className="mt-2 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg">
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => {
                  setCurrentPet(pet.id);
                  setShowPetSelector(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800',
                  currentPet?.id === pet.id && 'bg-primary-50 dark:bg-primary-900/20'
                )}
              >
                <Avatar src={pet.avatarUrl} alt={pet.name} size="sm" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{pet.name}</div>
                  <div className="text-xs text-gray-500">{pet.species}</div>
                </div>
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2 px-3">
              <Link
                href="/pets/new"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-500"
                onClick={() => setShowPetSelector(false)}
              >
                <PlusSquare className="w-4 h-4" />
                Agregar mascota
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-900 font-semibold'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-6 h-6',
                      isActive ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Link
          href={currentPet ? `/pet/${currentPet.id}` : '/pets/new'}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
        >
          <Avatar
            src={currentPet?.avatarUrl}
            alt={currentPet?.name || 'Perfil'}
            size="md"
          />
          <div className="flex-1">
            <div className="font-medium text-sm">{currentPet?.name || 'Mi perfil'}</div>
            <div className="text-xs text-gray-500">Ver perfil</div>
          </div>
        </Link>

        <div className="flex items-center gap-2 mt-3">
          <Link
            href="/settings"
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
