// services/back.ts
import axios from "axios";

const API_URL = "https://parkapp-pi.vercel.app/api";

// Crée une instance axios
const api = axios.create({
  baseURL: API_URL,
});

// Middleware pour ajouter automatiquement le token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// ✅ Récupérer les données de gestion du parking
export const getParkingManagementData = async () => {
  try {
    const response = await api.get(`/vehicules/parking/management`);
    return response.data;
  } catch (error: any) {
    console.error("Erreur récupération données gestion:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Récupérer un véhicule spécifique
export const getParkingVehicleById = async (vehicleId: string) => {
  try {
    const response = await api.get(`/vehicules/parking/my-vehicles/${vehicleId}`);
    return response.data;
  } catch (error: any) {
    console.error("Erreur récupération véhicule:", error.response?.data || error.message);
    throw error;
  }
};

export default api;