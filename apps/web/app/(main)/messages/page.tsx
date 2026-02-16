'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, MessageCircle, Send, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentPet } from '@/stores/auth.store';
import { formatRelativeTime, cn } from '@/lib/utils';

interface Conversation {
  id: string;
  otherPet: {
    id: string;
    name: string;
    avatar_url: string | null;
    species: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  sender_pet_id: string;
  created_at: string;
  is_read: boolean;
}

const speciesLabels: Record<string, string> = {
  dog: 'Perro', cat: 'Gato', bird: 'Ave', rabbit: 'Conejo',
  hamster: 'Hamster', fish: 'Pez', reptile: 'Reptil', other: 'Otro',
};

export default function MessagesPage() {
  const currentPet = useCurrentPet();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar_url: string | null; species: string }[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!currentPet) return;

    async function loadConversations() {
      const { data } = await supabase
        .from('conversations')
        .select(`
          id, last_message_at,
          pet_a:pets!pet_a_id(id, name, avatar_url, species),
          pet_b:pets!pet_b_id(id, name, avatar_url, species)
        `)
        .or(`pet_a_id.eq.${currentPet!.id},pet_b_id.eq.${currentPet!.id}`)
        .order('last_message_at', { ascending: false });

      if (!data) {
        setIsLoading(false);
        return;
      }

      const convos: Conversation[] = [];

      for (const c of data) {
        const petA = c.pet_a as unknown as { id: string; name: string; avatar_url: string | null; species: string };
        const petB = c.pet_b as unknown as { id: string; name: string; avatar_url: string | null; species: string };
        const otherPet = petA.id === currentPet!.id ? petB : petA;

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .eq('receiver_pet_id', currentPet!.id)
          .eq('is_read', false);

        convos.push({
          id: c.id,
          otherPet,
          lastMessage: lastMsg?.content || '',
          lastMessageAt: c.last_message_at,
          unreadCount: count || 0,
        });
      }

      setConversations(convos);
      setIsLoading(false);
    }

    loadConversations();
  }, [currentPet?.id]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('id, content, sender_pet_id, created_at, is_read')
        .eq('conversation_id', activeConversation!.id)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);

      // Mark as read
      if (currentPet) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', activeConversation!.id)
          .eq('receiver_pet_id', currentPet.id)
          .eq('is_read', false);
      }
    }

    loadMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`chat-${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const newMsg: Message = {
            id: row.id as string,
            content: row.content as string,
            sender_pet_id: row.sender_pet_id as string,
            created_at: row.created_at as string,
            is_read: row.is_read as boolean,
          };
          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if we're the receiver
          const receiverId = row.receiver_pet_id as string;
          if (currentPet && receiverId === currentPet.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation?.id, currentPet?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search pets to start new conversation
  useEffect(() => {
    if (!searchQuery.trim() || !currentPet) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('pets')
        .select('id, name, avatar_url, species')
        .neq('id', currentPet.id)
        .ilike('name', `%${searchQuery}%`)
        .eq('is_active', true)
        .limit(10);

      setSearchResults(data || []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, currentPet?.id]);

  const handleSend = async () => {
    if (!currentPet || !activeConversation || !messageText.trim()) return;
    setIsSending(true);

    try {
      await supabase.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_pet_id: currentPet.id,
        receiver_pet_id: activeConversation.otherPet.id,
        content: messageText.trim(),
      });

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeConversation.id);

      setMessageText('');
    } catch {
      // Message will appear via real-time or fail silently
    } finally {
      setIsSending(false);
    }
  };

  const startConversation = async (otherPetId: string) => {
    if (!currentPet) return;

    // Check if conversation already exists
    const [petA, petB] = [currentPet.id, otherPetId].sort();
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('pet_a_id', petA)
      .eq('pet_b_id', petB)
      .single();

    if (existing) {
      const conv = conversations.find((c) => c.id === existing.id);
      if (conv) {
        setActiveConversation(conv);
      }
      setShowSearch(false);
      setSearchQuery('');
      return;
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ pet_a_id: petA, pet_b_id: petB })
      .select()
      .single();

    if (newConv) {
      const otherPet = searchResults.find((p) => p.id === otherPetId)!;
      const conv: Conversation = {
        id: newConv.id,
        otherPet,
        lastMessage: '',
        lastMessageAt: newConv.created_at,
        unreadCount: 0,
      };
      setConversations((prev) => [conv, ...prev]);
      setActiveConversation(conv);
    }

    setShowSearch(false);
    setSearchQuery('');
  };

  if (!currentPet) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Necesitas una mascota"
        description="Crea una mascota para poder enviar mensajes."
        actionLabel="Crear mascota"
        actionHref="/pets/new"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Chat view (active conversation)
  if (activeConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-2rem)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => { setActiveConversation(null); setMessages([]); }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={`/pet/${activeConversation.otherPet.id}`} className="flex items-center gap-3">
            <Avatar src={activeConversation.otherPet.avatar_url} alt={activeConversation.otherPet.name} size="md" />
            <div>
              <h2 className="font-semibold text-sm">{activeConversation.otherPet.name}</h2>
              <p className="text-xs text-gray-500">{speciesLabels[activeConversation.otherPet.species] || activeConversation.otherPet.species}</p>
            </div>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">
              Envía el primer mensaje a {activeConversation.otherPet.name}
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_pet_id === currentPet.id;
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                    isMine
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
                  )}
                >
                  <p>{msg.content}</p>
                  <p className={cn('text-[10px] mt-1', isMine ? 'text-white/70' : 'text-gray-400')}>
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="input flex-1"
              autoFocus
            />
            <button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="btn-primary p-3 rounded-xl disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Conversations list view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Search to start new conversation */}
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mascota para chatear..."
            className="input w-full"
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className="mt-2 card p-2 space-y-1">
              {searchResults.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => startConversation(pet.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Avatar src={pet.avatar_url} alt={pet.name} size="sm" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{pet.name}</p>
                    <p className="text-xs text-gray-500">{speciesLabels[pet.species] || pet.species}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {conversations.length === 0 && !showSearch ? (
        <EmptyState
          icon={MessageCircle}
          title="Sin conversaciones"
          description="Busca una mascota para iniciar una conversación."
          actionLabel="Nueva conversación"
          onAction={() => setShowSearch(true)}
        />
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Avatar src={conv.otherPet.avatar_url} alt={conv.otherPet.name} size="md" />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className={cn('text-sm', conv.unreadCount > 0 ? 'font-bold' : 'font-medium')}>
                    {conv.otherPet.name}
                  </p>
                  <span className="text-xs text-gray-400">{formatRelativeTime(conv.lastMessageAt)}</span>
                </div>
                <p className={cn('text-xs truncate', conv.unreadCount > 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-500')}>
                  {conv.lastMessage || 'Sin mensajes aún'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="min-w-[20px] h-[20px] bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
