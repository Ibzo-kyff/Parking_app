import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      alert('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }

    const projectId = 'your-expo-project-id'; // Remplacez par votre Expo Project ID
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);

    // Envoyer le token au backend pour l'associer à l'utilisateur
    await sendPushTokenToBackend(token);

    return token;
  }

  async function sendPushTokenToBackend(token: string) {
    // Utilisez votre API pour stocker le token (voir backend)
    try {
      await fetch('/api/user/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourAuthToken}`, // Utilisez useAuth
        },
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      console.error('Erreur envoi token:', error);
    }
  }

  function handleNotificationReceived(notification: Notifications.Notification) {
    console.log('Notification reçue:', notification);
    // Optionnel : Mettre à jour l'état du chat ou afficher une badge
  }

  function handleNotificationResponse(response: Notifications.NotificationResponse) {
    console.log('Notification cliquée:', response);
    // Naviguer vers le chat si l'utilisateur clique
    const messageId = response.notification.request.content.data?.messageId;
    if (messageId) {
      // Utilisez Expo Router pour naviguer : router.push(`/chat/${messageId}`);
    }
  }

  return { expoPushToken, handleNotificationReceived };
};