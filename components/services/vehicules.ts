// components/services/carsAPI.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://parkapp-pi.vercel.app/api/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export type vehicules = {
  id: number;
  userOwnerId?: number;
  parkingId?: number;
  marque: string;
  model: string;
  prix: number;
  description?: string;
  photos: string[];
  garantie: boolean;
  dureeGarantie?: number;
  documents: string[];
  chauffeur: boolean;
  assurance?: string;
  dureeAssurance?: number;
  carteGrise?: string;
  vignette?: string;
  status: 'DISPONIBLE' | 'EN_LOCATION' | 'VENDU';
  fuelType: 'ESSENCE' | 'DIESEL' | 'ELECTRIQUE' | 'HYBRIDE';
  mileage?: number;
};

// 📌 Récupérer tous les véhicules
export const getAllvehicules = async (): Promise<vehicules[]> => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Erreur lors du chargement des véhicules');
  }
};

// 📌 Récupérer un véhicule par ID
export const getvehiculesById = async (id: number): Promise<vehicules> => {
  try {
    const response = await api.get(`/${id}`);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Erreur lors du chargement du véhicules');
  }
};

// 📌 Créer un véhicule
export const createvehicules = async (vehiculesData: Partial<vehicules>): Promise<vehicules> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.post('/', vehiculesData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Erreur lors de la création du vehicules');
  }
};

// 📌 Mettre à jour un véhicule
export const updatevehicules = async (id: number, vehiculesData: Partial<vehicules>): Promise<vehicules> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const response = await api.put(`/${id}`, vehiculesData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour du véhicule');
  }
};

// 📌 Supprimer un véhicule
export const deletevehicules = async (id: number): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    await api.delete(`/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Erreur lors de la suppression du véhicule');
  }
};

export default api;
