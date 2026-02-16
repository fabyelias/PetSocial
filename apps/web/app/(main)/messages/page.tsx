'use client';

import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function MessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mensajes</h1>
      <EmptyState
        icon={MessageCircle}
        title="Próximamente"
        description="Pronto podrás enviar mensajes directos a otras mascotas."
      />
    </div>
  );
}
