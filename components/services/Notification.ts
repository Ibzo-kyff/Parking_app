import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
const api = axios.create({
  baseURL: BASE_URL,
});

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: "réservation" | "paiement" | "mise à jour" | "RESERVATION" | "RESERVATION_CONFIRMATION";
  louee?: boolean;
  userId?: number;
  parkingId?: number;
}

// 🔐 Récupérer le token depuis AsyncStorage
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Essayer d'abord avec authState (pour compatibilité avec useAuth)
    const authState = await AsyncStorage.getItem("authState");
    if (authState) {
      const parsedAuth = JSON.parse(authState);
      if (parsedAuth.accessToken) {
        console.log(`🔐 Token récupéré depuis authState`);
        return parsedAuth.accessToken;
      }
    }

    // Fallback sur userToken (ancien système)
    const userToken = await AsyncStorage.getItem("userToken");
    if (userToken) {
      console.log(`🔐 Token récupéré depuis userToken`);
      return userToken;
    }

    console.log("🔐 Aucun token trouvé");
    return null;
  } catch (error) {
    console.error("❌ Erreur récupération token :", error);
    return null;
  }
};

// 🔐 Configuration des headers avec token
const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return token ? {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {};
};

// ✅ Récupérer les notifications
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
    console.log(` ${response.data.data?.length || 0} notifications récupérées`);
    
    const notifications = response.data.data || response.data || [];

    // Déduplication
    const uniqueNotifications = notifications.filter((notification: NotificationData, index: number, self: NotificationData[]) => {
      const key = `${notification.title}_${notification.message}_${notification.type}`;
      const firstIndex = self.findIndex(n =>
        `${n.title}_${n.message}_${n.type}` === key
      );
      return firstIndex === index;
    });

    console.log(`✅ ${uniqueNotifications.length} notifications uniques sur ${notifications.length} totales`);

    return uniqueNotifications;
  } catch (error) {
    const axiosError = error as AxiosError;

    // Log détaillé de l'erreur
    if (axiosError.response) {
      console.error(
        "❌ Erreur API GET notifications :",
        `Status: ${axiosError.response.status}`,
        `Data: ${JSON.stringify(axiosError.response.data)}`
      );
    } else if (axiosError.request) {
      console.error("❌ Pas de réponse du serveur:", axiosError.request);
    } else {
      console.error("❌ Erreur configuration requête:", axiosError.message);
    }

    if (axiosError.response?.status === 401) {
      console.log(" Token expiré ou invalide - déconnexion recommandée");
    }

    return [];
  }
};

// ✅ Créer une notification
export const createNotification = async (notificationData: {
  title: string;
  message: string;
  type: string;
  userId?: number;
  parkingId?: number;
}): Promise<NotificationData | null> => {
  try {
    console.log("📤 Création notification:", notificationData);

    // Validation
    if (!notificationData.userId && !notificationData.parkingId) {
      console.error("❌ Notification sans destinataire spécifique");
      return null;
    }

    const headers = await getAuthHeaders();

    if (!headers.Authorization) {
      console.error("❌ Pas de token pour créer la notification");
      return null;
    }

    const response = await api.post("/notifications", notificationData, { headers });

    console.log("✅ Notification créée avec succès:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "❌ Erreur API POST notification :",
      axiosError.response ? {
        status: axiosError.response.status,
        data: axiosError.response.data
      } : axiosError.message
    );
    return null;
  }
};

// ✅ Fonction spéciale pour les réservations
export const createReservationNotification = async (notificationData: {
  title: string;
  message: string;
  parkingId: number;
  type?: string;
}): Promise<boolean> => {
  try {
    console.log(" Création notification réservation pour parking:", notificationData.parkingId);

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

// ✅ Fonction pour envoyer une notification de message chat - MODIFIÉE
export const sendChatNotification = async (
  senderName: string,
  messageContent: string,
  receiverId?: number,
  parkingId?: number,
  options?: {
    hideMessageContent?: boolean;
    maxPreviewLength?: number;
  }
): Promise<boolean> => {
  try {
    // Options par défaut : cacher le contenu du message
    const hideContent = options?.hideMessageContent ?? true;
    const maxLength = options?.maxPreviewLength ?? 30;
    
    let notificationMessage: string;
    
    if (hideContent) {
      // Version sécurisée : ne pas afficher le contenu du message
      notificationMessage = `Vous avez reçu un nouveau message`;
    } else {
      // Version avec aperçu limité (optionnel)
      const preview = messageContent.length > maxLength 
        ? `${messageContent.substring(0, maxLength)}...` 
        : messageContent;
      notificationMessage = `${senderName}: ${preview}`;
    }
    
    const notification = await createNotification({
      title: `💬 ${senderName}`,
      message: notificationMessage,
      type: "MESSAGE",
      userId: receiverId,
      parkingId: parkingId
    });

    return !!notification;
  } catch (error) {
    console.error("❌ Erreur sendChatNotification:", error);
    return false;
  }
};

// ✅ Fonction pour envoyer une notification de réservation au parking
export const sendParkingReservationNotification = async (
  userInfo: any,
  vehicleInfo: any,
  parkingId: number,
  reservationType: 'LOCATION' | 'ACHAT'
): Promise<boolean> => {
  try {
    const message = `${userInfo.prenom || 'Utilisateur'} ${userInfo.nom || ''} a réservé ${vehicleInfo.marqueRef?.name || ''} ${vehicleInfo.model || ''} pour ${reservationType.toLowerCase()}. Prix: ${vehicleInfo.prix ? `${vehicleInfo.prix.toLocaleString()} FCFA` : ''}`;

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

// ✅ Marquer une notification comme lue
export const markNotificationAsRead = async (
  id: number
): Promise<NotificationData | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await api.patch(`/notifications/${id}/read`, {}, { headers });
    return response.data.data || response.data;
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

// ✅ Fonction pour les notifications locales (Expo Notifications)
export const showLocalNotification = async (
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
    console.log("✅ Notification locale envoyée");
  } catch (error) {
    console.error("❌ Erreur envoi notification locale:", error);
  }
};

// ✅ Fonction de debug pour l'authentification
export const debugAuth = async (): Promise<void> => {
  try {
    const authState = await AsyncStorage.getItem("authState");
    const userToken = await AsyncStorage.getItem("userToken");
    const userId = await AsyncStorage.getItem("userId");
    const parkingId = await AsyncStorage.getItem("parkingId");
    const userRole = await AsyncStorage.getItem("userRole");

    console.log("🔍 DEBUG AUTH:");
    console.log("authState:", authState);
    console.log("userToken:", userToken);
    console.log("userId:", userId);
    console.log("parkingId:", parkingId);
    console.log("userRole:", userRole);

    if (authState) {
      try {
        const parsed = JSON.parse(authState);
        console.log("Parsed authState:", {
          accessToken: parsed.accessToken ? "PRÉSENT" : "MANQUANT",
          role: parsed.role,
          userId: parsed.userId,
          parkingId: parsed.parkingId
        });
      } catch (e) {
        console.error("Erreur parsing authState:", e);
      }
    }
  } catch (error) {
    console.error("❌ Debug auth error:", error);
  }
};

// ✅ Vérifier les permissions de notification
export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error(" Erreur vérification permissions notifications:", error);
    return false;
  }
};

export default api;