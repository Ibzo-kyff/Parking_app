import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from './api';

const api = axios.create({
  baseURL: API_URL,
});

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: "réservation" | "paiement" | "mise à jour";
  louee?: boolean;
  userId?: number;
  parkingId?: number;
}

const getAuthToken = async (): Promise<string | null> => {
  try {
    const authState = await AsyncStorage.getItem("authState");
    if (authState) {
      const parsedAuth = JSON.parse(authState);
      if (parsedAuth.accessToken) {
        return parsedAuth.accessToken;
      }
    }
    
    const token = await AsyncStorage.getItem("userToken");
    return token;
  } catch (error) {
    console.error("❌ Erreur récupération token :", error);
    return null;
  }
};

const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return token ? { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {};
};

// ✅ Récupérer les notifications avec déduplication des doublons
export const getNotifications = async (
  userId?: number,
  parkingId?: number
): Promise<NotificationData[]> => {
  try {
    const headers = await getAuthHeaders();
    
    let url = "/notifications";
    const params = new URLSearchParams();
    
    if (userId) {
      params.append("userId", userId.toString());
    } 
    if (parkingId) {
      params.append("parkingId", parkingId.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url, { headers });
    const notifications = response.data.data || response.data || [];
    
    // FILTRAGE DES DOUBLONS : Garder seulement les notifications uniques par titre + message
    const uniqueNotifications = notifications.filter((notification: NotificationData, index: number, self: NotificationData[]) => {
      // Créer une clé unique basée sur le titre et le message
      const key = `${notification.title}_${notification.message}`;
      // Trouver le premier index avec cette clé
      const firstIndex = self.findIndex(n => `${n.title}_${n.message}` === key);
      // Garder seulement si c'est la première occurrence
      return firstIndex === index;
    });
    
    console.log(`✅ ${uniqueNotifications.length} notifications uniques sur ${notifications.length} totales`);
    
    return uniqueNotifications;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API GET notifications :",
      axiosError.response?.status,
      axiosError.response?.data || axiosError.message
    );
    
    return [];
  }
};

// ✅ Marquer une notification comme lue
export const markNotificationAsRead = async (
  id: number
): Promise<NotificationData | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.patch(`/notifications/${id}/read`, {}, { headers });
    
    console.log(`✅ Notification ${id} marquée comme lue`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API PATCH notification :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    return null;
  }
};

// ✅ Supprimer une notification
export const deleteNotification = async (
  id: number
): Promise<{ success: boolean }> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.delete(`/notifications/${id}`, { headers });
    
    console.log(`✅ Notification ${id} supprimée`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API DELETE notification :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    return { success: false };
  }
};

// ✅ Fonction pour les notifications locales (Expo Notifications)
export const showLocalNotification = async (
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    const { scheduleNotificationAsync } = await import('expo-notifications');
    
    await scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
    console.log('📱 Notification locale affichée');
  } catch (error) {
    console.warn('⚠️ Erreur notification locale:', error);
  }
};

export default api;