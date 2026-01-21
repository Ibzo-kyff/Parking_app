import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { chatService } from '../components/services/chatServices';
import { Message, ConversationList } from '../app/type/chat';
import { useAuth } from '../context/AuthContext';
import { usePusherChannel } from './usePusherChannel';

export const useChat = (parkingId?: number) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationList>([]);
  const [loading, setLoading] = useState(false);
  const [currentParkingId, setCurrentParkingId] = useState<number | undefined>(parkingId);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [pusherStatus, setPusherStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'failed'>('disconnected');

  useEffect(() => {
    const { getPusherConnectionState, subscribeToPusherConnection } = require('../app/utils/pusher');

    // État initial
    const currentState = getPusherConnectionState();
    setPusherStatus(currentState === 'connected' ? 'connected' : (currentState === 'unavailable' ? 'failed' : 'connecting'));

    // Abonnement aux changements
    const unsubscribe = subscribeToPusherConnection((state: string) => {
      console.log('📡 [useChat] Nouveau statut Pusher:', state);
      if (state === 'connected') setPusherStatus('connected');
      else if (state === 'connecting') setPusherStatus('connecting');
      else if (state === 'failed' || state === 'unavailable') setPusherStatus('failed');
      else setPusherStatus('disconnected');
    });

    return () => unsubscribe();
  }, []);

  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Tri des messages par date
  const sortMessages = (msgs: Message[]) => {
    return [...msgs].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  /* =====================
     LOAD CONVERSATIONS
  ====================== */
  const loadConversations = useCallback(async () => {
    if (!userRef.current) return;
    try {
      const res = await chatService.getConversations();
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('❌ Erreur chargement conversations:', e);
    }
  }, []);

  /* =====================
     PUSHER EVENTS
  ====================== */
  const onNewMessage = useCallback((data: Message) => {
    const currentUser = userRef.current;
    if (!currentUser?.id) return;

    const myId = Number(currentUser.id);

    setMessages(prev => {
      // 1. Remplacement d'un message optimiste existant
      if (data.clientTempId) {
        const index = prev.findIndex(m => String(m.clientTempId) === String(data.clientTempId));
        if (index !== -1) {
          const copy = [...prev];
          copy[index] = { ...data, status: 'sent' };
          return sortMessages(copy);
        }
      }

      // 2. Éviter les doublons par ID
      if (prev.some(m => m.id === data.id)) return prev;

      // 3. Ajouter si le message fait partie de cette conversation
      if (Number(data.senderId) === myId || Number(data.receiverId) === myId) {
        return sortMessages([...prev, { ...data, status: 'sent' }]);
      }

      return prev;
    });

    loadConversations();
  }, [loadConversations]);

  const onUpdateMessage = useCallback((data: Message) => {
    setMessages(prev => prev.map(m => (m.id === data.id ? data : m)));
    loadConversations();
  }, [loadConversations]);

  const onDeleteMessage = useCallback((id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    loadConversations();
  }, [loadConversations]);

  const onMessageRead = useCallback((data: Message) => {
    setMessages(prev =>
      prev.map(m => (m.id === data.id ? { ...m, read: true } : m))
    );
  }, []);

  const pusherEvents = useMemo(
    () => [
      { eventName: 'newMessage', handler: onNewMessage },
      { eventName: 'updateMessage', handler: onUpdateMessage },
      { eventName: 'deleteMessage', handler: onDeleteMessage },
      { eventName: 'messageRead', handler: onMessageRead },
    ],
    [onNewMessage, onUpdateMessage, onDeleteMessage, onMessageRead]
  );

  usePusherChannel(pusherEvents);

  /* =====================
     LOAD ONE CONVERSATION
  ====================== */
  const loadConversation = async (otherUserId: number, parkingIdOverride?: number) => {
    // Utilisation immédiate de l'override ou de la valeur actuelle du state
    const pId = parkingIdOverride !== undefined ? parkingIdOverride : currentParkingId;

    console.log(`📂 [loadConversation] Chargement discussion avec ${otherUserId} (parkingId: ${pId})`);
    setActivePartnerId(otherUserId);
    setMessages([]);
    setLoading(true);

    try {
      const res = await chatService.getConversation(otherUserId, pId);
      const data = Array.isArray(res.data) ? res.data : res.data?.messages || [];
      console.log(`📡 [loadConversation] ${data.length} messages récupérés du serveur`);
      setMessages(sortMessages(data));
    } catch (e) {
      console.error('❌ [loadConversation] Erreur:', e);
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     SEND MESSAGE
  ====================== */
  const sendMessage = async (content: string, receiverId: number) => {
    if (!content.trim() || !userRef.current?.id) return;

    setActivePartnerId(receiverId);

    console.log('📤 [sendMessage] Envoi message:', {
      receiverId,
      content,
      myId: userRef.current.id,
      activePartnerId: receiverId,
      parkingId: currentParkingId,
    });

    const clientTempId = Date.now().toString();

    const optimistic: Message = {
      id: Number(clientTempId),
      clientTempId,
      senderId: userRef.current.id,
      receiverId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sending',
    };

    console.log('➕ [sendMessage] Ajout message optimiste');
    setMessages(prev => {
      console.log(`📊 [sendMessage] Messages avant: ${prev.length}, après: ${prev.length + 1}`);
      return [...prev, optimistic];
    });

    try {
      const { data } = await chatService.sendMessage(
        receiverId,
        content,
        currentParkingId,
        clientTempId
      );

      console.log('✅ [sendMessage] Réponse serveur reçue:', data);

      // Mise à jour immédiate avec les données réelles du serveur
      setMessages(prev => {
        const index = prev.findIndex(m => String(m.clientTempId) === String(clientTempId));
        if (index !== -1) {
          const copy = [...prev];
          copy[index] = { ...data, status: 'sent' };
          console.log(`📝 [sendMessage] Message optimiste mis à jour avec ID réel: ${data.id}`);
          return sortMessages(copy);
        }
        return sortMessages([...prev, { ...data, status: 'sent' }]);
      });

      // Recharger les conversations pour mettre à jour le dernier message dans la liste
      loadConversations();
    } catch (e) {
      console.error('❌ [sendMessage] Erreur envoi API:', e);
      setMessages(prev =>
        prev.map(m =>
          m.clientTempId === clientTempId ? { ...m, status: 'failed' } : m
        )
      );
    }
  };

  const retryMessage = async (msg: Message) => {
    setMessages(prev => prev.filter(m => m.clientTempId !== msg.clientTempId));
    await sendMessage(msg.content, msg.receiverId);
  };

  useEffect(() => {
    if (userRef.current) loadConversations();
  }, [loadConversations]);

  // 🔹 Filtrer les messages pour la conversation active uniquement
  const filteredMessages = useMemo(() => {
    if (!activePartnerId || !userRef.current?.id) {
      console.log('🔍 [useChat] Pas de filtre actif, retour de tous les messages:', messages.length);
      return messages;
    }

    const myId = Number(userRef.current.id);
    const partnerId = Number(activePartnerId);

    const filtered = messages.filter(m => {
      const senderId = Number(m.senderId);
      const receiverId = Number(m.receiverId);

      return (
        (senderId === myId && receiverId === partnerId) ||
        (senderId === partnerId && receiverId === myId)
      );
    });

    return filtered;
  }, [messages, activePartnerId]);
  // 🔹 Marquer les messages comme lus quand on est dans la conversation
  useEffect(() => {
    const markRead = async () => {
      const currentUser = userRef.current;
      if (!currentUser?.id || !activePartnerId || messages.length === 0) return;

      const myId = Number(currentUser.id);
      const partnerId = Number(activePartnerId);

      // Chercher les messages non lus envoyés par le partenaire pour moi
      const unreadIds = messages
        .filter(m =>
          Number(m.senderId) === partnerId &&
          Number(m.receiverId) === myId &&
          !m.read
        )
        .map(m => m.id);

      if (unreadIds.length > 0) {
        console.log(`👁️ [useChat] Marquage de ${unreadIds.length} messages comme lus`);
        // On traite en parallèle pour la réactivité
        unreadIds.forEach(async (id) => {
          try {
            await chatService.markAsRead(id);
            // Mise à jour locale immédiate
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
          } catch (e) {
            console.log('❌ [useChat] Erreur markAsRead pour ID:', id);
          }
        });
      }
    };

    markRead();
  }, [messages, activePartnerId]);

  const deleteMessage = async (id: number) => {
    try {
      await chatService.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      loadConversations();
    } catch (e) {
      console.error('❌ Erreur suppression message:', e);
    }
  };

  const updateMessage = async (id: number, content: string) => {
    try {
      const { data } = await chatService.updateMessage(id, content);
      setMessages(prev => prev.map(m => (m.id === id ? data : m)));
      loadConversations();
    } catch (e) {
      console.error('❌ Erreur modification message:', e);
    }
  };

  return {
    messages: filteredMessages,
    conversations,
    loading,
    loadConversation,
    sendMessage,
    deleteMessage,      // ✅ ajouté
    updateMessage,      // ✅ ajouté
    retryMessage,
    setCurrentParkingId,
    currentParkingId,
    resetActivePartner: () => setActivePartnerId(null),
    pusherStatus,
  };

};