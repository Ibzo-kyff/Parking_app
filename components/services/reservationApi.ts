// reservationApi.ts
import api from "./api";
import Constants from 'expo-constants';
export type Reservation = {
  id: number;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELED" | "DECLINED";
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    id: number;
    marque: string;
    model: string;
    photos: string[];
    imageUrl?: string; // Keep for internal use if needed, but UI uses photos
    prix: number;
    fuelType: string;
    mileage: number;
    parking?: {
      id: number;
      nom: string;
    };
  };
  dateDebut: string | null;
  dateFin: string | null;
  type: "ACHAT" | "LOCATION";
};

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

// 🔹 Récupérer les réservations de l'utilisateur connecté
export const getUserReservations = async (): Promise<Reservation[]> => {
  const response = await api.get("/reservations");
  return response.data.map((item: any) => {
    const imageUrl = item.vehicle.imageUrl?.startsWith("http")
      ? item.vehicle.imageUrl
      : `${BASE_URL}${item.vehicle.imageUrl}`;

    return {
      ...item,
      vehicle: {
        ...item.vehicle,
        model: item.vehicle.modele || item.vehicle.model,
        photos: item.vehicle.photos || [imageUrl],
        imageUrl: imageUrl,
        id: item.vehicle.id,
      },
      user: item.user ? {
        ...item.user,
        id: item.user.id,
      } : undefined
    };
  });
};

// 🔹 Récupérer toutes les réservations du parking connecté
export const getReservationsParking = async (): Promise<Reservation[]> => {
  const response = await api.get("/reservations/parking/all");
  return response.data.map((item: any) => {
    const imageUrl = item.vehicle.imageUrl?.startsWith("http")
      ? item.vehicle.imageUrl
      : `${BASE_URL}${item.vehicle.imageUrl}`;

    return {
      ...item,
      vehicle: {
        ...item.vehicle,
        model: item.vehicle.modele || item.vehicle.model,
        photos: item.vehicle.photos || [imageUrl],
        imageUrl: imageUrl,
        id: item.vehicle.id,
      },
      user: item.user ? {
        ...item.user,
        id: item.user.id,
      } : undefined
    };
  });
};

// 🔹 Mettre à jour le statut d'une réservation (utilisé pour accept, reject, cancel)
export const updateReservationStatusApi = async (
  id: number,
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELED" | "DECLINED",
  reason?: string
): Promise<void> => {
  await api.put(`/reservations/${id}/status`, { status, reason });
};

// 🔹 Fonctions utilitaires
export const acceptReservationApi = async (id: number): Promise<void> => {
  return updateReservationStatusApi(id, "ACCEPTED");
};

export const declineReservationApi = async (id: number): Promise<void> => {
  return updateReservationStatusApi(id, "CANCELED", "Rejetée par le parking");
};

export const cancelReservationApi = async (id: number): Promise<void> => {
  return updateReservationStatusApi(id, "CANCELED", "Annulée par le client");
};

export const cancelReservationParkingApi = async (id: number): Promise<void> => {
  return updateReservationStatusApi(id, "CANCELED", "Annulée par le parking");
};