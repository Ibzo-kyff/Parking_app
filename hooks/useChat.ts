import { useState, useEffect, useMemo, useCallback } from 'react';
import { chatService } from '../components/services/chatServices';
import { Message, Conversation } from '../app/type/chat';
import { useAuth } from '../context/AuthContext';
import { usePusherChannel } from './usePusherChannel';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const useChat = (parkingId?: number) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation>({});
  const [currentParkingId, setCurrentParkingId] = useState<number | undefined>(parkingId);
  const [loading, setLoading] = useState(false);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);

  // ---------------- PUSHER EVENTS ----------------
  const handleNewMessage = useCallback(async (data: Message) => {
    if (!user) return;

    // 1. Mise à jour de l'état "messages" si le message concerne la conversation active OU si c'est mon message (envoyé depuis un autre device par ex)
    setMessages(prev => {
      // Le message est pertinent pour l'affichage si :
      // - Je suis l'expéditeur (cas multi-device ou écho)
      // - OU l'expéditeur est mon partenaire actif
      // - OU le destinataire est mon partenaire actif (si j'envoie)
      const isRelevant =
        data.senderId === user.id ||
        (activePartnerId !== null && (data.senderId === activePartnerId || data.receiverId === activePartnerId));

      if (isRelevant) {
        // Déduplication : on vérifie si l'ID existe déjà
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      }
      return prev;
    });

    // 2. Notification Locale
    // On notifie seulement si c'est un message entrant (pas de moi)
    if (data.senderId !== user.id) {
      // Si on est déjà en train de parler avec cette personne, on peut éviter la notif ou faire un son discret
      // Ici, on notifie quand même pour être sûr (le système OS gère souvent le foreground)
      // Ou on peut conditionner : if (activePartnerId !== data.senderId) { ... }

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Nouveau message",
            body: data.content, // Attention à la confidentialité/longueur
            sound: 'default',
            data: { messageId: data.id, senderId: data.senderId }
          },
          trigger: null, // Immédiat
        });
      } catch (e) { console.log('Erreur notification chat', e); }
    }
  }, [user, activePartnerId]);

  const handleUpdateMessage = useCallback((data: Message) => {
    setMessages(prev => prev.map(m => m.id === data.id ? data : m));
  }, []);

  const handleDeleteMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, deletedAt: new Date().toISOString() } : m
    ));
  }, []);

  const handleMessageRead = useCallback((data: Message) => {
    setMessages(prev => prev.map(m => m.id === data.id ? { ...m, read: true } : m));
  }, []);

  const pusherEvents = useMemo(() => [
    { eventName: 'newMessage', handler: handleNewMessage },
    { eventName: 'updateMessage', handler: handleUpdateMessage },
    { eventName: 'deleteMessage', handler: handleDeleteMessage },
    { eventName: 'messageRead', handler: handleMessageRead },
  ], [handleNewMessage, handleUpdateMessage, handleDeleteMessage, handleMessageRead]);

  // Utilisation du hook centralisé
  usePusherChannel(pusherEvents);

  // ---------------- API CALLS ----------------
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
    setActivePartnerId(otherUserId); // Marquer cet utilisateur comme actif
    setLoading(true);
    try {
      const { data } = await chatService.getConversation(otherUserId);
      setMessages(data.messages);

      if (data.parkingId) {
        setCurrentParkingId(data.parkingId);
      }

      const unreadMessages = data.messages.filter((m: Message) => !m.read && m.receiverId === user?.id);
      unreadMessages.forEach((msg: Message) => chatService.markAsRead(msg.id));
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
    setLoading(false);
  };

  const sendMessage = async (content: string, receiverId: number) => {
    if (!content.trim() || !user) return;
    try {
      const { data } = await chatService.sendMessage(receiverId, content.trim(), currentParkingId);

      // Mise à jour optimiste/manuelle (en attendant Pusher pour confirmer ou doubler)
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
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