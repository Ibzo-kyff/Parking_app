import axios from "axios";
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

// Crée une instance axios
const api = axios.create({
  baseURL: BASE_URL,
});

// Middleware pour ajouter automatiquement le token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Types pour la réponse API
type ApiVehicule = {
  id: string;
  marqueRef: {
    name: string;
  };
  model: string;
  status: string;
  photos: string[];
  prix: number;
  forSale: boolean;
  forRent: boolean;
  stats?: {
    vues: number;
    reservations: number;
    favoris: number;
    reservationsActives: number;
  };
  nextReservation?: {
    type: string;
    date: string;
    client: string;
  };
  // NOUVEAUX CHAMPS À AJOUTER
  dureeGarantie?: number;
  mileage?: number;
  fuelType?: string;
  carteGrise?: boolean;
  assurance?: boolean;
  vignette?: boolean;
  description?: string;
};

type ApiParkingData = {
  parking: {
    id: string;
    name: string;
    address: string;
    phone: string;
    logo: string;
  };
  statistics: {
    total: number;
    vendus: number;
    enLocation: number;
    disponibles: number;
    enMaintenance: number;
    indisponibles: number;
    totalVues: number;
    totalReservations: number;
    totalFavoris: number;
    reservationsActives: number;
    monthlySales: number;
    monthlyRentals: number;
  };
  vehicles: ApiVehicule[];
  charts: {
    monthlyData: {
      labels: string[];
      sales: number[];
      rentals: number[];
    };
    statusDistribution: {
      labels: string[];
      data: number[];
    };
  };
};

// ✅ Récupérer les données de gestion du parking avec transformation des données
export const getParkingManagementData = async (): Promise<ApiParkingData> => {
  try {
    console.log('🔄 Appel API: /vehicules/parking/management');
    const response = await api.get(`/vehicules/parking/management`);
    
    // DEBUG: Afficher la structure complète de la réponse
    console.log('✅ Réponse API complète:', response.data);
    console.log('📊 Structure véhicules:', response.data.vehicles?.map((v: any) => ({
      id: v.id,
      marque: v.marqueRef?.name,
      model: v.model,
      prix: v.prix,
      status: v.status,
      forSale: v.forSale,
      forRent: v.forRent,
      // Vérifier les champs supplémentaires
      dureeGarantie: v.dureeGarantie,
      mileage: v.mileage,
      fuelType: v.fuelType,
      carteGrise: v.carteGrise,
      assurance: v.assurance,
      vignette: v.vignette,
      description: v.description
    })));
    
    return response.data;
  } catch (error: any) {
    console.error("❌ Erreur récupération données gestion:", error.response?.data || error.message);
    
    if (error.response?.status === 403 && error.response?.data?.message === "Token invalide ou expiré.") {
      console.log("🔄 Tentative de rafraîchissement du token...");
      throw error;
    }
    throw error;
  }
};

// ✅ Récupérer un véhicule spécifique avec tous les détails
export const getParkingVehicleById = async (vehicleId: string) => {
  try {
    const response = await api.get(`/vehicules/parking/my-vehicles/${vehicleId}`);
    
    // DEBUG
    console.log('✅ Véhicule détaillé:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("❌ Erreur récupération véhicule:", error.response?.data || error.message);
    throw error;
  }
};

export default api;