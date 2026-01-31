'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react';
import { useCurrentPet } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', icon: Home, label: 'Inicio' },
  { href: '/search', icon: Search, label: 'Buscar' },
  { href: '/create', icon: PlusSquare, label: 'Crear' },
  { href: '/notifications', icon: Heart, label: 'Notificaciones' },
];

export function MobileNav() {
  const pathname = usePathname();
  const currentPet = useCurrentPet();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-full',
                isActive ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <item.icon className={cn('w-6 h-6', isActive && 'fill-current')} />
            </Link>
          );
        })}

        {/* Profile */}
        <Link
          href={currentPet ? `/pet/${currentPet.id}` : '/pets/new'}
          className="flex flex-col items-center justify-center w-16 h-full"
        >
          <div
            className={cn(
              'rounded-full p-0.5',
              pathname.startsWith('/pet/') && 'ring-2 ring-primary-500'
            )}
          >
            <Avatar
              src={currentPet?.avatarUrl}
              alt={currentPet?.name || 'Perfil'}
              size="sm"
            />
          </div>
        </Link>
      </div>
    </nav>
  );
}
