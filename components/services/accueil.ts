// Services/accueil.ts
import axios from "axios";

export const API_URL = "https://parkapp-pi.vercel.app";

// ✅ Récupérer les véhicules
export const getVehicules = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/vehicules`);
    return response.data;
  } catch (error) {
    console.error("Erreur véhicules :", error);
    throw error;
  }
};

// ✅ Récupérer les parkings
export const getParkings = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/parkings`);
    return response.data;
  } catch (error) {
    console.error("Erreur parkings :", error);
    throw error;
  }
};

// ✅ Récupérer les Marques
export const getMarques = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/vehicules/marques`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des marques :", error);
    throw error;
  }
};