import { useState, useEffect } from 'react';
import { initializePusher, cleanupPusher } from '../app/utils/pusher';
import { chatService } from '../components/services/chatServices';
import { Message, Conversation } from '../app/type/chat';
import { useAuth } from '../context/AuthContext';

export const useChat = (parkingId?: number) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation>([]);
  const [currentParkingId, setCurrentParkingId] = useState<number | undefined>(parkingId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let pusher: any = null;

    const setupPusher = async () => {
      pusher = await initializePusher(user.id);

      pusher.bind('newMessage', (data: Message) => {
        setMessages(prev => [...prev, data]);
      });

      pusher.bind('updateMessage', (data: Message) => {
        setMessages(prev => prev.map(m => (m.id === data.id ? data : m)));
      });

      pusher.bind('deleteMessage', (messageId: number) => {
        setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m)));
      });

      pusher.bind('messageRead', (data: Message) => {
        setMessages(prev => prev.map(m => (m.id === data.id ? { ...m, read: true } : m)));
      });
    };

    setupPusher();

    return () => cleanupPusher();
  }, [user]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data } = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (otherUserId: number, parkingId?: number): Promise<Message[] | null> => {
    setLoading(true);
    try {
      const response = await chatService.getConversation(otherUserId, parkingId);
      const data = response.data as { messages: Message[]; parkingId?: number };

      console.debug('[useChat] loadConversation', otherUserId, 'messages:', data.messages.length);

      setMessages(prev => {
        const userId = user?.id;
        if (!userId) return prev;

        const preservedOptimistic = prev.filter(m => m.clientTempId != null);
        const others = prev.filter(m => {
          const s = Number(m.senderId);
          const r = Number(m.receiverId);
          const isSameConv = (s === userId && r === otherUserId) || (s === otherUserId && r === userId);
          return !isSameConv && m.clientTempId == null;
        });

        const combined = [...others, ...data.messages, ...preservedOptimistic];

        const seen = new Set<string | number>();
        const deduped: Message[] = [];
        for (const msg of combined) {
          const key = msg.clientTempId ?? msg.id;
          if (!seen.has(String(key))) {
            seen.add(String(key));
            deduped.push(msg);
          }
        }

        return deduped;
      });

      if (data.parkingId !== undefined) {
        setCurrentParkingId(data.parkingId);
      } else if (parkingId !== undefined) {
        setCurrentParkingId(parkingId);
      }

      const unreadMessages = data.messages.filter(m => !m.read && m.receiverId === user?.id);
      unreadMessages.forEach(msg => chatService.markAsRead(msg.id));

      return data.messages;
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, receiverId: number) => {
    if (!content.trim() || !user?.id) return;

    const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const tempMessage: Message = {
      id: -Date.now(),
      clientTempId,
      status: 'sending',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      senderId: user.id,
      receiverId,
      read: false,
      deletedAt: undefined,
      sender: {
        id: user.id,
        nom: (user as any).nom || '',
        prenom: (user as any).prenom || '',
        email: (user as any).email || '',
        image: (user as any).image || null,
        role: (user as any).role || 'CLIENT',
      },
      receiver: {
        id: receiverId,
        nom: '',
        prenom: '',
        email: '',
        image: null,
        role: 'CLIENT',
      },
    } as Message;

    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data } = await chatService.sendMessage(receiverId, content.trim(), currentParkingId, clientTempId);

      setMessages(prev => {
        const idx = prev.findIndex(m => m.clientTempId === clientTempId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...data, status: 'sent' };
          return copy;
        }
        return prev.map(m => (m.clientTempId === clientTempId ? { ...data, status: 'sent' } : m));
      });
    } catch (error) {
      console.error('Erreur envoi message:', error);
      setMessages(prev => prev.map(m => (m.clientTempId === clientTempId ? { ...m, status: 'failed' } : m)));
    }
  };

  const retryMessage = async (message: Message) => {
    if (!message || !user?.id) return;

    setMessages(prev => prev.map(m => (m.id === message.id || m.clientTempId === message.clientTempId ? { ...m, status: 'sending' } : m)));

    try {
      const clientTempId = message.clientTempId || `temp-retry-${Date.now()}`;
      const { data } = await chatService.sendMessage(message.receiverId, message.content, currentParkingId, clientTempId);

      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === message.id || m.clientTempId === message.clientTempId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...data, status: 'sent' };
          return copy;
        }
        return prev.map(m => (m.id === message.id ? { ...data, status: 'sent' } : m));
      });
    } catch (err) {
      console.error('Erreur retry message:', err);
      setMessages(prev => prev.map(m => (m.id === message.id || m.clientTempId === message.clientTempId ? { ...m, status: 'failed' } : m)));
    }
  };

  const deleteMessage = async (messageId: number) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const updateMessage = async (messageId: number, newContent: string) => {
    try {
      const { data } = await chatService.updateMessage(messageId, newContent);
      setMessages(prev => prev.map(m => (m.id === messageId ? data : m)));
    } catch (error) {
      console.error('Erreur modification:', error);
    }
  };

  useEffect(() => {
    if (parkingId !== undefined) {
      setCurrentParkingId(parkingId);
    }
  }, [parkingId]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, currentParkingId]);

  return {
    messages,
    conversations,
    loading,
    sendMessage,
    loadConversation,
    deleteMessage,
    updateMessage,
    setCurrentParkingId,
    currentParkingId,
    retryMessage,
  };
};