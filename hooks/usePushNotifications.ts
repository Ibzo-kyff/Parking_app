import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth(); // On retire refreshAuth : géré globalement maintenant
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
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
    if (!Device.isDevice) return null;

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
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(' [Push] Token obtenu:', token);

      await sendPushTokenToBackend(token);
      return token;
    } catch (e) {
      console.error('❌ [Push] Erreur obtention token:', e);
      return null;
    }
  }

  async function sendPushTokenToBackend(token: string) {
    try {
      const { default: api } = await import('../components/services/api'); // Garde pour lazy load si besoin
      const authToken = await getAuthToken(); // Dupliqué OK pour l'instant

      console.log('📤 [Push] Enregistrement du token sur le serveur...');

      // **CORRECTION : Bon path backend**
      await api.post('/auth/users/push-token', { token }, {
        headers: authToken ? {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        } : {}
      });
      console.log('✅ [Push] Token enregistré (/auth/users/push-token)');
    } catch (error: any) {
      console.error('❌ [Push] Erreur registration serveur:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
  }

  async function getAuthToken(): Promise<string | null> {
    try {
      const authState = await AsyncStorage.getItem("authState");
      if (authState) {
        const parsedAuth = JSON.parse(authState);
        return parsedAuth.accessToken || null;
      }
      return await AsyncStorage.getItem("userToken");
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