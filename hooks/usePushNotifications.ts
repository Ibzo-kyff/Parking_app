import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user, refreshAuth } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // On ne s'enregistre que si l'utilisateur est connecté
    if (!user || !user.id) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      // Sur simulateur, on ne peut pas avoir de token push expo
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    try {
      // Remplacez par votre vrai projectId si nécessaire dans app.json
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📡 [Push] Token obtenu:', token);

      // Envoyer le token au backend
      await sendPushTokenToBackend(token);
      return token;
    } catch (e) {
      console.error('❌ [Push] Erreur obtention token:', e);
      return null;
    }
  }

  async function sendPushTokenToBackend(token: string) {
    let retryAfterRefresh = false;

    const attemptSend = async () => {
      try {
        const { default: api } = await import('../components/services/api');
        const authToken = await getAuthToken(); // Assurez-vous que getAuthToken est importé ou défini ici si nécessaire
        const headers = authToken ? {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        } : {};

        console.log('📤 [Push] Enregistrement du token sur le serveur...');

        // Tentative principale sur /auth/push-token
        await api.post('/auth/push-token', { token }, { headers });
        console.log('✅ [Push] Token enregistré (/auth/push-token)');
        return true;
      } catch (e: any) {
        if (e.response?.status === 404 || e.response?.status === 403) {
          console.log(`⚠️  [Push] Échec sur /auth/push-token (${e.response.status}), tentative sur /users/push-token...`);
          try {
            const { default: api } = await import('../components/services/api');
            const authToken = await getAuthToken();
            const headers = authToken ? {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            } : {};

            await api.post('/users/push-token', { token }, { headers });
            console.log('✅ [Push] Token enregistré (/users/push-token)');
            return true;
          } catch (fallbackError: any) {
            throw fallbackError;
          }
        } else {
          throw e;
        }
      }
    };

    try {
      await attemptSend();
    } catch (error: any) {
      if ((error.response?.status === 401 || error.response?.status === 403) && !retryAfterRefresh) {
        retryAfterRefresh = true;
        const refreshed = await refreshAuth();
        if (refreshed) {
          // Réessayer après refresh
          try {
            await attemptSend();
            return;
          } catch (retryError) {
            console.error('❌ [Push] Erreur après refresh:', retryError);
          }
        }
      }
      console.error('❌ [Push] Erreur registration serveur:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  }

  // Fonction pour obtenir le token d'auth (dupliquée ici pour autonomie, idéalement importer depuis Notification.ts)
  async function getAuthToken(): Promise<string | null> {
    try {
      const authState = await AsyncStorage.getItem("authState");
      if (authState) {
        const parsedAuth = JSON.parse(authState);
        if (parsedAuth.accessToken) {
          return parsedAuth.accessToken;
        }
      }
      const userToken = await AsyncStorage.getItem("userToken");
      if (userToken) {
        return userToken;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  function handleNotificationReceived(notification: Notifications.Notification) {
    console.log('🔔 [Push] Notification reçue en premier plan:', notification);
  }

  function handleNotificationResponse(response: Notifications.NotificationResponse) {
    console.log('👆 [Push] Notification cliquée:', response);
  }

  return { expoPushToken, handleNotificationReceived };
};