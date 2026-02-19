// src/app/utils/pusher.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredAccessToken } from '../../components/services/api';
import Constants from 'expo-constants';
import Pusher from 'pusher-js/react-native';

let pusherInstance: Pusher | null = null;
let initializationPromise: Promise<Pusher> | null = null;
let connectionState: string = 'disconnected';
const stateListeners: ((state: string) => void)[] = [];

// Registre central pour tous les canaux afin d'éviter les doublons de souscription
const channelRegistry: Map<string, any> = new Map();
const presenceCallbacks: Map<number, Set<(isOnline: boolean) => void>> = new Map();

const notifyListeners = (state: string) => {
  connectionState = state;
  stateListeners.forEach((listener) => listener(state));
};

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

/**
 * Initialise Pusher (Singleton avec protection contre appels parallèles)
 */
export const initializePusher = async (userId: number): Promise<Pusher> => {
  if (pusherInstance) return pusherInstance;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      console.log('📡 [Pusher] Initialisation pour utilisateur:', userId);

      pusherInstance = new Pusher('4ae0add35ba25c29e453', {
        cluster: 'mt1',
        authorizer: (channel: any) => {
          return {
            authorize: async (socketId: string, callback: (error: any, data: any) => void) => {
              try {
                const freshToken = await getStoredAccessToken();
                if (!freshToken) {
                  console.error('❌ [Pusher] Auth: Aucun token trouvé');
                  return callback(new Error('No token'), null);
                }

                const response = await fetch(`${BASE_URL}/auth/pusher`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}`,
                  },
                  body: JSON.stringify({
                    socket_id: socketId,
                    channel_name: channel.name,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  console.error(`❌ [Pusher] Auth Error ${response.status}:`, errorData);
                  return callback(new Error(`Status ${response.status}`), null);
                }

                const data = await response.json();
                callback(null, data);
              } catch (error) {
                console.error('❌ [Pusher] Auth Exception:', error);
                callback(error, null);
              }
            },
          };
        },
        enabledTransports: ['ws', 'wss'],
        forceTLS: true,
        activityTimeout: 60000,
        pongTimeout: 30000,
      });

      // Écouter les événements de connexion
      pusherInstance.connection.bind('connected', () => {
        console.log('✅ [Pusher] Connecté');
        notifyListeners('connected');
      });

      pusherInstance.connection.bind('connecting', () => {
        console.log('🔄 [Pusher] Connexion en cours...');
        notifyListeners('connecting');
      });

      pusherInstance.connection.bind('disconnected', () => {
        console.log('🔌 [Pusher] Déconnecté');
        notifyListeners('disconnected');
      });

      pusherInstance.connection.bind('error', (err: any) => {
        // Filtragge des erreurs non-fatales de souscription
        const message = err?.message || err?.data?.message || "";
        if (message.includes("No current subscription") || message.includes("subscription in progress")) {
          console.warn('⚠️ [Pusher] Avertissement souscription:', message);
          return; // On ne passe pas le statut global à 'failed' pour ça
        }

        console.error('❌ [Pusher] Erreur connexion:', err);
        notifyListeners('failed');
      });

      return pusherInstance;
    } catch (error) {
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * S'abonner à un canal via le registre (évite les erreurs de souscription en cours)
 */
export const subscribeToChannel = (channelName: string) => {
  if (!pusherInstance) return null;

  if (channelRegistry.has(channelName)) {
    return channelRegistry.get(channelName);
  }

  const channel = pusherInstance.subscribe(channelName);
  channelRegistry.set(channelName, channel);
  return channel;
};

/**
 * S'abonner au Presence Channel de l'utilisateur
 */
export const subscribeToUserPresence = async (userId: number) => {
  if (!pusherInstance) return null;

  const channelName = `presence-user-${userId}`;
  const channel = subscribeToChannel(channelName);
  if (!channel) return null;

  console.log(`📡 [Pusher] Configuration Presence Channel: ${channelName}`);

  try {
    // Unbind avant de re-bind pour éviter les doublons lors des re-subscriptions
    channel.unbind('pusher:subscription_succeeded');
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      console.log(`✅ [Pusher] Abonné à ${channelName}, membres: ${members.count}`);
    });

    channel.unbind('pusher:member_added');
    channel.bind('pusher:member_added', (member: any) => {
      console.log(`👤 [Pusher] Membre ajouté: ${member.id}`);
      const memberId = parseInt(member.id);
      const callbacks = presenceCallbacks.get(memberId);
      if (callbacks) callbacks.forEach(cb => cb(true));
    });

    channel.unbind('pusher:member_removed');
    channel.bind('pusher:member_removed', (member: any) => {
      console.log(`👋 [Pusher] Membre retiré: ${member.id}`);
      const memberId = parseInt(member.id);
      const callbacks = presenceCallbacks.get(memberId);
      if (callbacks) callbacks.forEach(cb => cb(false));
    });

    return channel;
  } catch (error) {
    console.error(`❌ [Pusher] Erreur configuration ${channelName}:`, error);
    return null;
  }
};

/**
 * Suivre la présence d'un autre utilisateur
 */
export const subscribeToOtherUserPresence = async (
  userId: number,
  callback: (isOnline: boolean) => void
): Promise<() => void> => {
  if (!pusherInstance) return () => { };

  const channelName = `presence-user-${userId}`;

  // Gestion multi-callbacks
  if (!presenceCallbacks.has(userId)) {
    presenceCallbacks.set(userId, new Set());
  }
  presenceCallbacks.get(userId)?.add(callback);

  const channel = subscribeToChannel(channelName);
  if (channel) {
    // Si déjà abonné, on notifie immédiatement
    if (channel.subscribed) {
      const isOnline = channel.members?.count > 0;
      callback(isOnline);
    }

    // Re-bind des événements de succès
    channel.unbind('pusher:subscription_succeeded');
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      const isOnline = (members?.count || 0) > 0;
      const callbacks = presenceCallbacks.get(userId);
      if (callbacks) callbacks.forEach(cb => cb(isOnline));
    });
  }

  return () => {
    const callbacks = presenceCallbacks.get(userId);
    if (callbacks) {
      callbacks.delete(callback);
    }
  };
};

/**
 * Nettoyage total (Logout uniquement)
 */
export const cleanupPusher = () => {
  if (pusherInstance) {
    console.log('🔌 [Pusher] Déconnexion complète');

    channelRegistry.forEach((channel, name) => {
      try {
        channel.unbind_all();
        pusherInstance?.unsubscribe(name);
      } catch (err) { }
    });

    channelRegistry.clear();
    presenceCallbacks.clear();

    pusherInstance.disconnect();
    pusherInstance = null;
    initializationPromise = null;
    notifyListeners('disconnected');
  }
};

// Getters
export const getPusherInstance = (): Pusher | null => pusherInstance;
export const getPusherConnectionState = (): string => connectionState;

export const subscribeToPusherConnection = (listener: (state: string) => void) => {
  stateListeners.push(listener);
  listener(connectionState);
  return () => {
    const index = stateListeners.indexOf(listener);
    if (index > -1) stateListeners.splice(index, 1);
  };
};