// reservationApi.ts
import api from "./api";
import { BASE_URL } from "../../config/env";
export type Reservation = {
  id: number;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELED";
  user: {
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    marque: string;
    modele: string;
    imageUrl: string;
    prix?: number;
    fuelType?: string;
    mileage?: number;
    parking?: {
      nom: string;
    };
  };
  dateDebut: string | null;
  dateFin: string | null;
  type?: "ACHAT" | "LOCATION";
};



// 🔹 Récupérer les réservations de l'utilisateur connecté
export const getUserReservations = async (): Promise<Reservation[]> => {
  const response = await api.get("/reservations");
  return response.data.map((item: Reservation) => ({
    ...item,
    vehicle: {
      ...item.vehicle,
      imageUrl: item.vehicle.imageUrl?.startsWith("http")
        ? item.vehicle.imageUrl
        : `${BASE_URL}${item.vehicle.imageUrl}`,
    },
  }));
};

// 🔹 Récupérer toutes les réservations du parking connecté
export const getReservationsParking = async (): Promise<Reservation[]> => {
  const response = await api.get("/reservations/parking/all");
  return response.data.map((item: Reservation) => ({
    ...item,
    vehicle: {
      ...item.vehicle,
      imageUrl: item.vehicle.imageUrl?.startsWith("http")
        ? item.vehicle.imageUrl
        : `${BASE_URL}${item.vehicle.imageUrl}`,
    },
  }));
};

// 🔹 Mettre à jour le statut d'une réservation (utilisé pour accept, reject, cancel)
export const updateReservationStatusApi = async (
  id: number, 
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELED", 
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