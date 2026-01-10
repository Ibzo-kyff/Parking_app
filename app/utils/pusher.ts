import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredAccessToken } from '../../components/services/api';
import Constants from 'expo-constants';
import Pusher from 'pusher-js/react-native';

let pusherInstance: Pusher | null = null;

const BASE_URL =
  Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

/**
 * Initialise l'instance Pusher (temps réel uniquement)
 */
export const initializePusher = async (userId: number): Promise<Pusher> => {
  if (pusherInstance) return pusherInstance;

  console.log('📡 [Pusher] Initialisation pour utilisateur:', userId);
  console.log('📡 [Pusher] Auth endpoint:', `${BASE_URL}/auth/pusher`);

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

            console.log(`🔐 [Pusher] Tentative d'auth pour canal: ${channel.name}`);

            // On utilise axios pour l'auth car c'est plus fiable en React Native
            const response = await fetch(`${BASE_URL}/auth/pusher`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${freshToken}`,
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
            console.log(`✅ [Pusher] Auth Success pour: ${channel.name}`);
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
  });

  pusherInstance.connection.bind('connected', () => {
    console.log('✅ [Pusher] Connecté');
  });

  pusherInstance.connection.bind('state_change', (states: any) => {
    console.log('📡 [Pusher] État:', states.current);
  });

  pusherInstance.connection.bind('error', (err: any) => {
    console.error('❌ [Pusher] Erreur:', err);
  });

  return pusherInstance;
};

/**
 * Nettoyage Pusher
 */
export const cleanupPusher = () => {
  if (pusherInstance) {
    console.log('🔌 [Pusher] Déconnexion');
    pusherInstance.disconnect();
    pusherInstance = null;
  }
};
