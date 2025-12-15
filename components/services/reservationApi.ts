import api from "./api";
import { BASE_URL } from "../../config/env";
export type Reservation = {
  id: number;
  user: {
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    marque: string;
    modele: string;
    imageUrl: string;
  };
  dateDebut: string;
  dateFin: string;
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

// 🔹 Récupérer toutes les réservations d'un parking par son ID (ADMIN ou parking propriétaire)
export const getReservationsByParkingId = async (
  parkingId: number
): Promise<Reservation[]> => {
  const response = await api.get(`/reservations/parking/${parkingId}`);

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

// 🔹 Annuler une réservation
export const cancelReservationApi = async (id: number): Promise<void> => {
  await api.delete(`/reservations/${id}`);
};