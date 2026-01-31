'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useIsAuthenticated } from '@/stores/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { RightSidebar } from '@/components/layout/right-sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-3xl">🐾</span>
          </div>
          <div className="text-gray-500">Cargando...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 ml-64 lg:ml-72">
          <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
        </main>

        {/* Right Sidebar - solo en pantallas grandes */}
        <div className="hidden xl:block w-80 shrink-0">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <main className="pb-16 px-4 py-4">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
