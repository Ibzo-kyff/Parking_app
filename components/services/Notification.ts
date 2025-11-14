// services/Notification.ts
import axios, { AxiosError } from "axios";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_URL = "https://parkapp-pi.vercel.app/api/";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// === CONFIGURATION NOTIFICATIONS LOCALES ===
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// === ENVOYER NOTIFICATION LOCALE ===
export const showLocalNotification = async (title: string, message: string, data?: any) => {
  try {
    console.log('Notification locale:', title);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: data || {},
      },
      trigger: { seconds: 1 },
    });

    console.log('Notification locale envoyée');
  } catch (error) {
    console.error('Erreur notification locale:', error);
  }
};

// === CRÉER NOTIFICATION POUR LE PARKING (via backend) ===
export const createReservationNotification = async (notificationData: {
  title: string;
  message: string;
  parkingId: number;
  type?: string;
}): Promise<boolean> => {
  try {
    console.log('Envoi notification au parking ID:', notificationData.parkingId);

    const response = await api.post("/notifications", {
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "RESERVATION",
      parkingId: notificationData.parkingId,
    });

    console.log('Notification créée en DB:', response.data);
    return true;

  } catch (error: any) {
    const err = error as AxiosError;
    console.error("Échec création notification parking:", err.response?.data || err.message);
    return false;
  }
};

// === RÉCUPÉRER TOUTES LES NOTIFICATIONS ===
export const getNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data.data || response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Erreur récupération notifications:", axiosError.response?.data || axiosError.message);
    throw error;
  }
};

// === MARQUER COMME LUE ===
export const markNotificationAsRead = async (id: number) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Erreur marquage lu:", axiosError.response?.data || axiosError.message);
    throw error;
  }
};

// === SUPPRIMER NOTIFICATION ===
export const deleteNotification = async (id: number) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("Erreur suppression:", axiosError.response?.data || axiosError.message);
    throw error;
  }
};

export default api;