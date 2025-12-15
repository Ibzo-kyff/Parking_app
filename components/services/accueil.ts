// Services/accueil.ts
import axios from "axios";
import { Marque } from "../../app/(Clients)/tousLesMarques";
import { BASE_URL } from "../../config/env";


// Récupérer les véhicules
export const getVehicules = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/vehicules`);
    return response.data;
  } catch (error) {
    console.error("Erreur véhicules :", error);
    throw error;
  }
};

// Récupérer les parkings
export const getParkings = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/parkings`);
    return response.data;
  } catch (error) {
    console.error("Erreur parkings :", error);
    throw error;
  }
};

// Récupérer les Marques
export const getMarques = async (): Promise<Marque[]> => {
  try {
    const response = await fetch(`${BASE_URL}/marques`);
    if (!response.ok) {
      throw new Error('Erreur réseau');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur getMarques:', error);
    throw error;
  }
};