import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../config/env";

const api = axios.create({
  baseURL: BASE_URL,
});

// 🔐 Récupérer le token depuis AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    console.log(`🔐 Token récupéré: ${token ? "OUI" : "NON"}`);
    return token;
  } catch (error) {
    console.error("❌ Erreur récupération token :", error);
    return null;
  }
};

// 🔐 Configuration des headers avec token
const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

// ✅ Récupérer les notifications avec authentification
export const getNotifications = async (
  userId?: number,
  parkingId?: number
): Promise<NotificationData[]> => {
  try {
    const headers = await getAuthHeaders();
    
    let url = "/notifications";
    const params = new URLSearchParams();
    
    // Ajouter les paramètres de filtrage
    if (userId) {
      params.append("userId", userId.toString());
    } 
    if (parkingId) {
      params.append("parkingId", parkingId.toString());
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log(`📋 Récupération notifications: ${url}`);
    
    const response = await api.get(url, { headers });
    console.log("✅ Réponse API notifications:", response.data);
    
    return response.data.data || response.data || [];
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API GET notifications :",
      axiosError.response?.status,
      axiosError.response?.data
    );
    
    return [];
  }
};

// ✅ Créer une notification (route publique)
export const createNotification = async (notificationData: {
  title: string;
  message: string;
  type: string;
  userId?: number;
  parkingId?: number;
}): Promise<NotificationData | null> => {
  try {
    console.log("📤 Création notification:", notificationData);
    
    const response = await api.post("/notifications", notificationData);
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

// ✅ Fonction spéciale pour les réservations (ENVOYÉE AU PARKING)
export const createReservationNotification = async (notificationData: {
  title: string;
  message: string;
  parkingId: number;
  type?: string;
}): Promise<boolean> => {
  try {
    console.log("🚀 Création notification réservation pour parking:", notificationData.parkingId);

    const notification = await createNotification({
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "RESERVATION",
      parkingId: notificationData.parkingId
    });

    console.log("✅ Notification réservation créée:", notification);
    return !!notification;

  } catch (error) {
    console.error("❌ Erreur création notification réservation:", error);
    return false;
  }
};

// ✅ Marquer une notification comme lue
export const markNotificationAsRead = async (
  id: number
): Promise<NotificationData | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.patch(`/notifications/${id}/read`, {}, { headers });
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

export default api;