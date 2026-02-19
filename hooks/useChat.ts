import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { chatService } from '../components/services/chatServices';
import { Message, ConversationList } from '../app/type/chat';
import { useAuth } from '../context/AuthContext';
import { usePusherChannel } from './usePusherChannel';
import {
  initializePusher,
  subscribeToUserPresence,
  subscribeToOtherUserPresence,
  getPusherConnectionState,
  subscribeToPusherConnection,
  cleanupPusher
} from '../app/utils/pusher';

export const useChat = (parkingId?: number) => {
  const { user, authState } = useAuth();
  const token = authState?.accessToken || null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationList>([]);
  const [loading, setLoading] = useState(false);
  const [currentParkingId, setCurrentParkingId] = useState<number | undefined>(parkingId);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [pusherStatus, setPusherStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'failed'>('disconnected');
  const [userPresence, setUserPresence] = useState<Record<number, { isOnline: boolean, lastSeen: string | null }>>({});

  const userRef = useRef(user);
  const tokenRef = useRef(token);
  // Ref pour suivre l'état de chargement et éviter les interruptions
  const loadingRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
    tokenRef.current = token;
  }, [user, token]);

  // Initialiser Pusher
  useEffect(() => {
    const initPusher = async () => {
      if (!user?.id) return;

      try {
        await initializePusher(user.id);
        await subscribeToUserPresence(user.id);
      } catch (error) {
        console.error('❌ [useChat] Erreur initialisation Pusher:', error);
      }
    };

    initPusher();

    return () => {
      // Note: On ne fait plus cleanupPusher() ici car cela coupe la connexion 
      // pour tous les autres composants. Le nettoyage global est géré au logout.
    };
  }, [user?.id]);

  // Écouter les changements de statut Pusher
  useEffect(() => {
    const unsubscribe = subscribeToPusherConnection((state: string) => {
      console.log('📡 [useChat] Nouveau statut Pusher:', state);

      if (state === 'connected') {
        setPusherStatus('connected');
      } else if (state === 'connecting') {
        setPusherStatus('connecting');
      } else if (state === 'failed' || state === 'unavailable') {
        setPusherStatus('failed');
      } else {
        setPusherStatus('disconnected');
      }
    });

    // État initial
    const currentState = getPusherConnectionState();
    setPusherStatus(
      currentState === 'connected' ? 'connected' :
        currentState === 'failed' || currentState === 'unavailable' ? 'failed' :
          currentState === 'connecting' ? 'connecting' : 'disconnected'
    );

    return unsubscribe;
  }, []);

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
    if (!userRef.current || !tokenRef.current) return;

    try {
      const res = await chatService.getConversations();
      const conversationsData = Array.isArray(res.data) ? res.data : [];

      setConversations(conversationsData);

      // Initialiser les statuts de présence
      const presenceData: Record<number, { isOnline: boolean, lastSeen: string | null }> = {};
      conversationsData.forEach((conv: any) => {
        if (conv.user) {
          presenceData[conv.user.id] = {
            isOnline: conv.user.isOnline || false,
            lastSeen: conv.user.lastSeen || null
          };
        }
      });
      setUserPresence(prev => ({ ...prev, ...presenceData }));

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

    // 🔹 Filtrage par parking pour éviter de mélanger les contextes
    if (currentParkingId !== undefined && data.parkingId && Number(data.parkingId) !== Number(currentParkingId)) {
      // Si le message n'est pas pour le parking actif, on l'ignore de la vue courante
      // Mais on recharge quand même les conversations pour mettre à jour les notifs
      loadConversations();
      return;
    }

    const myId = Number(currentUser.id);

    setMessages(prev => {
      // 1. Remplacement d'un message optimiste existant (via clientTempId)
      if (data.clientTempId) {
        const index = prev.findIndex(m => String(m.clientTempId) === String(data.clientTempId));
        if (index !== -1) {
          const copy = [...prev];
          copy[index] = { ...data, status: 'sent' }; // Mise à jour avec les vraies données
          return sortMessages(copy);
        }
      }

      // 2. Éviter les doublons par ID réel
      if (prev.some(m => m.id === data.id)) return prev;

      // 3. Ajouter si le message fait partie de cette conversation
      // Nous utilisons filteredMessages pour l'affichage, donc ici on ajoute simplement au pool
      return sortMessages([...prev, { ...data, status: 'sent' }]);
    });

    // On recharge la liste des conversations pour mettre à jour l'aperçu et le badge non lu
    loadConversations();
  }, [loadConversations, currentParkingId]);

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
    // Mettre à jour aussi le statut de lecture dans la liste des conversations
    setConversations(prev => prev.map(conv => {
      if (conv.lastMessage && conv.lastMessage.id === data.id) {
        return {
          ...conv,
          unreadCount: Math.max(0, (conv.unreadCount || 0) - 1),
          lastMessage: { ...conv.lastMessage, read: true }
        };
      }
      return conv;
    }));
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
  const loadConversation = useCallback(async (otherUserId: number, parkingIdOverride?: number, limit?: number) => {
    const pId = parkingIdOverride !== undefined ? parkingIdOverride : currentParkingId;

    console.log(`📂 [loadConversation] Chargement discussion avec ${otherUserId} (parkingId: ${pId})`);
    setActivePartnerId(otherUserId);

    // NE PAS VIDER messages[] ici si on charge la même conversation (ou pendant la pagination)
    // Mais pour l'instant, pour simplifier et éviter les mélanges, on vide.
    // L'amélioration serait de vérifier si otherUserId === activePartnerId
    if (activePartnerId !== otherUserId) {
      setMessages([]);
      setLoading(true);
    }

    loadingRef.current = true;

    try {
      const res = await chatService.getConversation(otherUserId, pId, limit);
      const data = Array.isArray(res.data) ? res.data : res.data?.messages || [];

      // Vérification que l'utilisateur n'a pas changé de conversation pendant le chargement
      if (loadingRef.current) {
        setMessages(sortMessages(data));
      }
    } catch (e) {
      console.error('❌ [loadConversation] Erreur:', e);
    } finally {
      if (loadingRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [currentParkingId, activePartnerId]); // Added activePartnerId dep

  // Suivre la présence de l'utilisateur actif
  useEffect(() => {
    if (!activePartnerId) return;

    let cleanupPresence: (() => void) | undefined;

    const trackPartnerPresence = async () => {
      try {
        cleanupPresence = await subscribeToOtherUserPresence(activePartnerId, (isOnline) => {
          setUserPresence(prev => ({
            ...prev,
            [activePartnerId]: {
              ...prev[activePartnerId],
              isOnline,
              lastSeen: isOnline ? null : new Date().toISOString()
            }
          }));
        });
      } catch (error) {
        console.error('❌ [useChat] Erreur suivi présence:', error);
      }
    };

    trackPartnerPresence();

    return () => {
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, [activePartnerId]);

  /* =====================
     SEND MESSAGE
  ====================== */
  const sendMessage = useCallback(async (content: string, receiverId: number) => {
    if (!content.trim() || !userRef.current?.id) return;

    const myId = Number(userRef.current.id);

    // Assurer que le partenaire actif est correct
    if (activePartnerId !== receiverId) {
      setActivePartnerId(receiverId);
    }

    const clientTempId = Date.now().toString();

    // 1. Mise à jour Optimiste
    const optimistic: Message = {
      id: Number(clientTempId), // ID temporaire
      clientTempId,
      senderId: myId,
      receiverId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sending', // Indicateur visuel potentiel
      parkingId: currentParkingId ?? null,
    };

    // Ajouter immédiatement le message
    setMessages(prev => sortMessages([...prev, optimistic]));

    try {
      // 2. Appel API
      const { data } = await chatService.sendMessage(
        receiverId,
        content,
        currentParkingId,
        clientTempId
      );

      // 3. Mise à jour avec la réponse réelle
      setMessages(prev => {
        // Est-ce que le message existe déjà (via Pusher qui aurait été plus rapide) ?
        const alreadyReceivedViaPusher = prev.some(m => m.id === data.id);

        // Si oui, on supprime l'optimiste car le "vrai" est déjà là
        if (alreadyReceivedViaPusher) {
          return prev.filter(m => String(m.clientTempId) !== String(clientTempId));
        }

        // Sinon, on remplace l'optimiste par le vrai
        const index = prev.findIndex(m => String(m.clientTempId) === String(clientTempId));
        if (index !== -1) {
          const copy = [...prev];
          copy[index] = { ...data, clientTempId, status: 'sent' };
          return sortMessages(copy);
        }

        // Cas de secours : on ajoute le vrai si l'optimiste a disparu
        return sortMessages([...prev, { ...data, clientTempId, status: 'sent' }]);
      });

      // On rafraîchit la liste des conversations en arrière-plan
      loadConversations();

    } catch (e) {
      console.error('❌ [sendMessage] Erreur envoi API:', e);
      // Marquer le message comme échoué
      setMessages(prev =>
        prev.map(m =>
          String(m.clientTempId) === String(clientTempId) ? { ...m, status: 'failed' } : m
        )
      );
    }
  }, [currentParkingId, activePartnerId, loadConversations]);

  const retryMessage = useCallback(async (msg: Message) => {
    setMessages(prev => prev.filter(m => m.clientTempId !== msg.clientTempId));
    await sendMessage(msg.content, msg.receiverId);
  }, [sendMessage]);

  useEffect(() => {
    if (userRef.current) {
      loadConversations();
    }
  }, [loadConversations]);

  // 🔹 Filtrer les messages pour la conversation active uniquement
  const filteredMessages = useMemo(() => {
    if (!activePartnerId || !userRef.current?.id) {
      return messages;
    }

    const myId = Number(userRef.current.id);
    const partnerId = Number(activePartnerId);

    // On garde uniquement les messages échangés avec le partenaire actif
    return messages.filter(m => {
      const senderId = Number(m.senderId);
      const receiverId = Number(m.receiverId);

      return (
        (senderId === myId && receiverId === partnerId) ||
        (senderId === partnerId && receiverId === myId)
      );
    });
  }, [messages, activePartnerId]);

  // 🔹 Marquer les messages comme lus LORSQUE l'utilisateur consulte la conversation
  useEffect(() => {
    const markRead = async () => {
      const currentUser = userRef.current;
      if (!currentUser?.id || !activePartnerId || messages.length === 0) return;

      const myId = Number(currentUser.id);
      const partnerId = Number(activePartnerId);

      // Identifier les messages non lus venant du partenaire
      const unreadIds = messages
        .filter(m =>
          Number(m.senderId) === partnerId &&
          Number(m.receiverId) === myId &&
          !m.read
        )
        .map(m => m.id);

      if (unreadIds.length > 0) {
        // Mise à jour optimiste locale
        setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m));

        setConversations(prev => prev.map(c =>
          c.user.id === partnerId
            ? { ...c, unreadCount: 0, lastMessage: { ...c.lastMessage, read: true } }
            : c
        ));

        // Appel API non bloquant
        Promise.all(unreadIds.map(id => chatService.markAsRead(id)))
          .catch(e => console.log('❌ [useChat] Erreur markAsRead silencieuse:', e));
      }
    };

    markRead();
  }, [messages, activePartnerId]);

  const deleteMessage = useCallback(async (id: number) => {
    try {
      await chatService.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      loadConversations();
    } catch (e) {
      console.error('❌ Erreur suppression message:', e);
    }
  }, [loadConversations]);

  const updateMessage = useCallback(async (id: number, content: string) => {
    try {
      const { data } = await chatService.updateMessage(id, content);
      setMessages(prev => prev.map(m => (m.id === id ? data : m)));
      loadConversations();
    } catch (e) {
      console.error('❌ Erreur modification message:', e);
    }
  }, [loadConversations]);

  // Fonction pour récupérer le statut d'un utilisateur spécifique
  const getUserPresence = useCallback((userId: number) => {
    return userPresence[userId] || { isOnline: false, lastSeen: null };
  }, [userPresence]);

  return {
    messages: filteredMessages,
    conversations,
    loading,
    loadConversation,
    sendMessage,
    deleteMessage,
    updateMessage,
    retryMessage,
    setCurrentParkingId,
    currentParkingId,
    resetActivePartner: () => setActivePartnerId(null),
    pusherStatus,
    userPresence: getUserPresence,
  };
};