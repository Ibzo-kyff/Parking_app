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

// ✅ Récupérer les voitures de l'utilisateur connecté
// services/back.ts
export const getUserCars = async (userId: string) => {
  try {
    const response = await api.get(`vehicules/parking/my-vehicles/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Erreur récupération voitures :", error.response?.data || error.message);
    throw error;
  }
};

export default api;
