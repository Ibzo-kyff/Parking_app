import axios, { AxiosError } from "axios";

const API_URL = "https://parkapp-pi.vercel.app/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: "reservation" | "paiement" | "update";
  louee?: boolean;
  userId: number;
}

// ✅ Récupérer uniquement les notifications d’un utilisateur
export const getNotifications = async (userId: number): Promise<NotificationData[]> => {
  try {
    const response = await api.get(`/notifications?userId=${userId}`);
    return response.data.data; // { success: true, data: [...] }
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API GET notifications :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

// ✅ Créer une notification
export const createNotification = async (notificationData: {
  title: string;
  message: string;
  type: string;
  userId?: number;
  parkingId?: number;
}): Promise<NotificationData> => {
  try {
    const response = await api.post("/notifications", notificationData);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API POST notification :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

// ✅ Marquer une notification comme lue
export const markNotificationAsRead = async (id: number): Promise<NotificationData> => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API PATCH notification :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

// ✅ Supprimer une notification
export const deleteNotification = async (id: number): Promise<{ success: boolean }> => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API DELETE notification :",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

export default api;
