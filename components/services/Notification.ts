import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from './api';

const api = axios.create({
  baseURL: API_URL,
});

interface NotificationData {
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
    console.log(`🔐 Token récupéré: ${token ? "OUI" : "NON"}`);
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
    
    console.log(`📋 Fetch notifications URL: ${url}`);
    
    const response = await api.get(url, { headers });
    console.log(`✅ ${response.data.data?.length || 0} notifications récupérées`);
    
    return response.data.data || response.data || [];
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API GET notifications :",
      axiosError.response?.status,
      axiosError.response?.data || axiosError.message
    );
    
    if (axiosError.response?.status === 401) {
      console.log("🔄 Token expiré ou invalide");
    }
    
    return [];
  }
};

export const createNotification = async (notificationData: {
  title: string;
  message: string;
  type: string;
  userId?: number;
  parkingId?: number;
}): Promise<NotificationData | null> => {
  try {
    console.log("📤 Création notification:", notificationData);
    
    if (!notificationData.userId && !notificationData.parkingId) {
      console.error("❌ Notification sans destinataire spécifique");
      return null;
    }
    
    const headers = await getAuthHeaders();
    const response = await api.post("/notifications", notificationData, { headers });
    
    console.log("✅ Notification créée avec succès");
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API POST notification :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    return null;
  }
};

export const createReservationNotification = async (notificationData: {
  title: string;
  message: string;
  parkingId: number;
  type?: string;
}): Promise<boolean> => {
  try {
    console.log("🚀 Création notification réservation pour parking:", notificationData.parkingId);

    if (!notificationData.parkingId) {
      console.error("❌ Notification réservation sans parkingId");
      return false;
    }

    const notification = await createNotification({
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "RESERVATION",
      parkingId: notificationData.parkingId
    });

    console.log("✅ Notification réservation créée:", !!notification);
    return !!notification;

  } catch (error) {
    console.error("❌ Erreur création notification réservation:", error);
    return false;
  }
};

export const sendParkingReservationNotification = async (
  userInfo: any,
  vehicleInfo: any,
  parkingId: number,
  reservationType: 'LOCATION' | 'ACHAT'
): Promise<boolean> => {
  try {
    const message = `${userInfo.prenom} ${userInfo.nom} a réservé ${vehicleInfo.marqueRef?.name || ''} ${vehicleInfo.model || ''} pour ${reservationType.toLowerCase()}. Prix: ${vehicleInfo.prix ? `${vehicleInfo.prix.toLocaleString()} FCFA` : ''}`;

    return await createReservationNotification({
      title: "🚗 NOUVELLE RÉSERVATION !",
      message: message,
      parkingId: parkingId,
      type: "RESERVATION"
    });
  } catch (error) {
    console.error("❌ Erreur sendParkingReservationNotification:", error);
    return false;
  }
};

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

export const debugAuth = async (): Promise<void> => {
  try {
    const authState = await AsyncStorage.getItem("authState");
    const userToken = await AsyncStorage.getItem("userToken");
    
    console.log("🔍 DEBUG AUTH:");
    console.log("authState:", authState);
    console.log("userToken:", userToken);
    
    if (authState) {
      const parsed = JSON.parse(authState);
      console.log("Parsed authState:", {
        accessToken: parsed.accessToken ? "PRÉSENT" : "MANQUANT",
        role: parsed.role,
        userId: parsed.userId,
        parkingId: parsed.parkingId
      });
    }
  } catch (error) {
    console.error("❌ Debug auth error:", error);
  }
};

export default api;