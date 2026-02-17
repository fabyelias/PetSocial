'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Heart, MessageCircle } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useCurrentPet } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { playNotificationSound, playMessageSound } from '@/lib/sounds';

const navItems = [
  { href: '/feed', icon: Home, label: 'Inicio' },
  { href: '/search', icon: Search, label: 'Buscar' },
  { href: '/create', icon: PlusSquare, label: 'Crear' },
  { href: '/notifications', icon: Heart, label: 'Notificaciones' },
  { href: '/messages', icon: MessageCircle, label: 'Mensajes' },
];

export function MobileNav() {
  const pathname = usePathname();
  const currentPet = useCurrentPet();
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  const fetchMsgCount = useCallback(async () => {
    if (!currentPet) return;
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_pet_id', currentPet.id)
      .eq('is_read', false);
    setMsgCount(count || 0);
  }, [currentPet?.id]);

  const fetchNotifCount = useCallback(async () => {
    if (!currentPet) return;
    const lastSeenKey = `notif_seen_${currentPet.id}`;
    const lastSeen = localStorage.getItem(lastSeenKey);
    const since = lastSeen || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: myPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('pet_id', currentPet.id);
    const myPostIds = myPosts?.map((p) => p.id) || [];

    // Always count pending friend requests
    const { count: pendingRequests } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', currentPet.id)
      .eq('status', 'pending');

    if (myPostIds.length === 0) {
      setNotifCount(pendingRequests || 0);
      return;
    }

    const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).in('post_id', myPostIds).neq('pet_id', currentPet.id).gte('created_at', since),
      supabase.from('comments').select('*', { count: 'exact', head: true }).in('post_id', myPostIds).neq('pet_id', currentPet.id).gte('created_at', since),
    ]);

    setNotifCount((likeCount || 0) + (commentCount || 0) + (pendingRequests || 0));
  }, [currentPet?.id]);

  useEffect(() => {
    fetchNotifCount();
    fetchMsgCount();
    const interval = setInterval(() => {
      fetchNotifCount();
      fetchMsgCount();
    }, 30000);

    if (currentPet) {
      const channel = supabase
        .channel('mobile-notifs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => { fetchNotifCount(); playNotificationSound(); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => { fetchNotifCount(); playNotificationSound(); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows' }, () => { fetchNotifCount(); playNotificationSound(); })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { fetchMsgCount(); playMessageSound(); })
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }

    return () => clearInterval(interval);
  }, [currentPet?.id, fetchNotifCount, fetchMsgCount]);

  useEffect(() => {
    if (pathname === '/notifications') {
      setNotifCount(0);
      if (currentPet) {
        localStorage.setItem(`notif_seen_${currentPet.id}`, new Date().toISOString());
      }
    }
    if (pathname === '/messages') setMsgCount(0);
  }, [pathname, currentPet?.id]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const count = item.href === '/notifications' ? notifCount : item.href === '/messages' ? msgCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-full relative',
                isActive ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <div className="relative">
                <item.icon className={cn('w-6 h-6', isActive && 'fill-current')} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
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
