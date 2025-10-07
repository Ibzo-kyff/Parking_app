import axios, { AxiosError } from "axios";

const API_URL = "https://parkapp-pi.vercel.app/api/";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// 🔔 Récupérer toutes les notifications
export const getNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "Erreur API:",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

// 🔔 Créer une notification
export const createNotification = async (notificationData: {
  title: string;
  message: string;
  type: string;
  userId?: number;
  parkingId?: number;
}) => {
  try {
    const response = await api.post("/notifications", notificationData);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "Erreur API:",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

// 🔔 Marquer comme lue (PATCH)
export const markNotificationAsRead = async (id: number) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "Erreur API:",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

// 🔔 Supprimer une notification
export const deleteNotification = async (id: number) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "Erreur API:",
      axiosError.response ? axiosError.response.data : axiosError.message
    );
    throw error;
  }
};

export default api;