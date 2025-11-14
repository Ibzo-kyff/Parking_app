// services/api/reservationApi.ts
import api from "./api";
import { createReservationNotification, showLocalNotification } from "../../components/services/Notification";

// === TYPES ===
export type Reservation = {
  id: number;
  user: {
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    id: number;
    marque: string;
    modele: string;
    imageUrl: string;
    parking?: {
      id: number;
      nom: string;
    };
    prix: number;
    fuelType: string;
    mileage: number;
    description?: string;
    status?: string;
  };
  dateDebut: string | null;
  dateFin: string | null;
  type: "ACHAT" | "LOCATION";
};

const BASE_URL = "https://parkapp-pi.vercel.app/api";

// === FONCTION DE NOTIFICATION (utilisée après création/annulation) ===
const sendReservationNotifications = async (
  reservation: Reservation,
  isCancellation = false
) => {
  const userName = "Vous";
  const vehicleName = `${reservation.vehicle.marque} ${reservation.vehicle.modele}`;
  const parkingId = reservation.vehicle.parking?.id;

  if (!parkingId) {
    console.warn("Aucun parking associé à cette réservation");
    return;
  }

  // === 1. NOTIFICATION LOCALE À L'UTILISATEUR ===
  try {
    await showLocalNotification(
      isCancellation ? "Réservation annulée" : "Réservation confirmée !",
      isCancellation
        ? `Votre ${reservation.type.toLowerCase()} de ${vehicleName} a été annulée.`
        : `Votre ${reservation.type.toLowerCase()} de ${vehicleName} est confirmée !`,
      {
        type: isCancellation ? "CANCEL" : "RESERVATION",
        reservationId: reservation.id,
      }
    );
  } catch (err) {
    console.warn("Échec notification locale:", err);
  }

  // === 2. PUSH AU PARKING VIA BACKEND ===
  try {
    const success = await createReservationNotification({
      title: isCancellation ? "RÉSERVATION ANNULÉE" : "NOUVELLE RÉSERVATION !",
      message: isCancellation
        ? `${userName} a annulé sa réservation pour ${vehicleName}.`
        : `${userName} a réservé ${vehicleName} pour ${reservation.type.toLowerCase()}. Prix: ${reservation.vehicle.prix.toLocaleString()} FCFA`,
      parkingId,
      type: isCancellation ? "CANCEL" : "RESERVATION",
    });

    if (!success) {
      console.warn("Push parking échoué");
    }
  } catch (err) {
    console.error("Erreur push parking:", err);
  }
};

// === 1. RÉCUPÉRER LES RÉSERVATIONS DE L'UTILISATEUR CONNECTÉ ===
export const getUserReservations = async (): Promise<Reservation[]> => {
  try {
    const response = await api.get("/reservations");
    return response.data.map((item: any) => ({
      ...item,
      vehicle: {
        ...item.vehicle,
        imageUrl: item.vehicle.imageUrl?.startsWith("http")
          ? item.vehicle.imageUrl
          : `${BASE_URL}${item.vehicle.imageUrl}`,
      },
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Erreur récupération réservations");
  }
};

// === 2. RÉCUPÉRER TOUTES LES RÉSERVATIONS DU PARKING CONNECTÉ ===
export const getReservationsParking = async (): Promise<Reservation[]> => {
  try {
    const response = await api.get("/reservations/parking/all");
    return response.data.map((item: any) => ({
      ...item,
      vehicle: {
        ...item.vehicle,
        imageUrl: item.vehicle.imageUrl?.startsWith("http")
          ? item.vehicle.imageUrl
          : `${BASE_URL}${item.vehicle.imageUrl}`,
      },
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Erreur récupération parking");
  }
};

// === 3. RÉCUPÉRER PAR ID DE PARKING (ADMIN) ===
export const getReservationsByParkingId = async (parkingId: number): Promise<Reservation[]> => {
  try {
    const response = await api.get(`/reservations/parking/${parkingId}`);
    return response.data.map((item: any) => ({
      ...item,
      vehicle: {
        ...item.vehicle,
        imageUrl: item.vehicle.imageUrl?.startsWith("http")
          ? item.vehicle.imageUrl
          : `${BASE_URL}${item.vehicle.imageUrl}`,
      },
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Erreur récupération par parking");
  }
};

// === 4. CRÉER UNE RÉSERVATION (appelée depuis CarDetailScreen) ===
export const createReservation = async (data: {
  vehicleId: number;
  dateDebut?: string;
  dateFin?: string;
  type: "ACHAT" | "LOCATION";
}): Promise<Reservation> => {
  try {
    const response = await api.post("/reservations", data);
    const newReservation = response.data;

    // === ENVOYER NOTIFICATIONS APRÈS CRÉATION ===
    await sendReservationNotifications(newReservation, false);

    return newReservation;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Échec création réservation");
  }
};

// === 5. ANNULER UNE RÉSERVATION ===
export const cancelReservationApi = async (id: number): Promise<void> => {
  try {
    // Récupérer la réservation avant suppression pour notification
    const reservation = await getReservationById(id);
    await api.delete(`/reservations/${id}`);

    // === NOTIFICATION D'ANNULATION ===
    await sendReservationNotifications(reservation, true);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Échec annulation");
  }
};

// === 6. RÉCUPÉRER UNE RÉSERVATION PAR ID (interne) ===
const getReservationById = async (id: number): Promise<Reservation> => {
  try {
    const response = await api.get(`/reservations/${id}`);
    const item = response.data;
    return {
      ...item,
      vehicle: {
        ...item.vehicle,
        imageUrl: item.vehicle.imageUrl?.startsWith("http")
          ? item.vehicle.imageUrl
          : `${BASE_URL}${item.vehicle.imageUrl}`,
      },
    };
  } catch (error: any) {
    throw new Error("Réservation introuvable");
  }
};

export default {
  getUserReservations,
  getReservationsParking,
  getReservationsByParkingId,
  createReservation,
  cancelReservationApi,
};