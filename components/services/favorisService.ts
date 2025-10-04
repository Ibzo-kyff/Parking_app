// services/favorisService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORIS_KEY = 'user_favoris';

export interface FavorisVehicule {
  id: number;
  userOwnerId: number | null;
  parkingId: number;
  marqueId: number;
  model: string;
  year: number;
  prix: number;
  description: string;
  photos: string[] | string;
  garantie: boolean;
  dureeGarantie: number;
  chauffeur: boolean;
  assurance: boolean;
  dureeAssurance: number;
  carteGrise: boolean;
  vignette: boolean;
  forSale: boolean;
  forRent: boolean;
  status: string;
  fuelType: string;
  mileage: number;
  parking: {
    id: number;
    userId: number;
    name: string;
    address: string;
    phone: string;
    description: string;
    capacity: number;
    hoursOfOperation: string;
    status: string;
    logo: string;
    city: string;
    email: string;
  };
  marqueRef: {
    id: number;
    name: string;
    logoUrl: string;
    isCustom: boolean;
  };
  stats: {
    id: number;
    vehicleId: number;
    vues: number;
    reservations: number;
  };
  favorites: any[];
  addedAt: string;
}

export const favorisService = {
  // Récupérer tous les favoris
  async getFavoris(): Promise<FavorisVehicule[]> {
    try {
      const favorisJson = await AsyncStorage.getItem(FAVORIS_KEY);
      return favorisJson ? JSON.parse(favorisJson) : [];
    } catch (error) {
      console.error('Erreur récupération favoris:', error);
      return [];
    }
  },

  // Ajouter un véhicule aux favoris
  async addToFavoris(vehicule: any): Promise<boolean> {
    try {
      const favoris = await this.getFavoris();
      
      // Vérifier si le véhicule est déjà dans les favoris
      const exists = favoris.some(fav => fav.id === vehicule.id);
      if (exists) {
        return false;
      }

      const favorisVehicule: FavorisVehicule = {
        ...vehicule,
        addedAt: new Date().toISOString()
      };

      favoris.push(favorisVehicule);
      await AsyncStorage.setItem(FAVORIS_KEY, JSON.stringify(favoris));
      return true;
    } catch (error) {
      console.error('Erreur ajout favoris:', error);
      return false;
    }
  },

  // Retirer un véhicule des favoris
  async removeFromFavoris(vehiculeId: number): Promise<boolean> {
    try {
      const favoris = await this.getFavoris();
      const updatedFavoris = favoris.filter(fav => fav.id !== vehiculeId);
      await AsyncStorage.setItem(FAVORIS_KEY, JSON.stringify(updatedFavoris));
      return true;
    } catch (error) {
      console.error('Erreur suppression favoris:', error);
      return false;
    }
  },

  // Vérifier si un véhicule est dans les favoris
  async isInFavoris(vehiculeId: number): Promise<boolean> {
    try {
      const favoris = await this.getFavoris();
      return favoris.some(fav => fav.id === vehiculeId);
    } catch (error) {
      console.error('Erreur vérification favoris:', error);
      return false;
    }
  },

  // Vider tous les favoris
  async clearFavoris(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(FAVORIS_KEY);
      return true;
    } catch (error) {
      console.error('Erreur suppression favoris:', error);
      return false;
    }
  }
};