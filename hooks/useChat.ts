import { useState, useEffect } from 'react';
import { initializePusher, cleanupPusher } from '../app/utils/pusher';
import { chatService } from '../components/services/chatServices';
import { Message, Conversation } from '../app/type/chat';
import { useAuth } from '../context/AuthContext';

export const useChat = (parkingId?: number) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation>({});
  const [currentParkingId, setCurrentParkingId] = useState<number | undefined>(parkingId);
  const [loading, setLoading] = useState(false);

  // Initialiser Pusher
  useEffect(() => {
    let pusher: any = null;
    if (!user) return;

    const setupPusher = async () => {
      pusher = await initializePusher(user.id);
      
      pusher.bind('newMessage', (data: Message) => {
        setMessages(prev => [...prev, data]);
      });

      pusher.bind('updateMessage', (data: Message) => {
        setMessages(prev => prev.map(m => m.id === data.id ? data : m));
      });

      pusher.bind('deleteMessage', (messageId: number) => {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m
        ));
      });

      pusher.bind('messageRead', (data: Message) => {
        setMessages(prev => prev.map(m => m.id === data.id ? { ...m, read: true } : m));
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
    }
    setLoading(false);
  };

  const loadConversation = async (otherUserId: number) => {
    setLoading(true);
    try {
      const { data } = await chatService.getConversation(otherUserId);
      setMessages(data.messages);

      if (data.parkingId) {
        setCurrentParkingId(data.parkingId);
      }
      
      const unreadMessages = data.messages.filter(m => !m.read && m.receiverId === user?.id);
      unreadMessages.forEach(msg => chatService.markAsRead(msg.id));
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
    setLoading(false);
  };

  const sendMessage = async (content: string, receiverId: number) => {
    if (!content.trim() || !user) return;
    try {
      const { data } = await chatService.sendMessage(receiverId, content.trim(), currentParkingId);
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error('Erreur envoi message:', error);
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
      setMessages(prev => prev.map(m => m.id === messageId ? data : m));
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
    messages, conversations, loading, sendMessage, loadConversation,
    deleteMessage, updateMessage, setCurrentParkingId, currentParkingId,
  };
};