import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const getVehicules = async () => {
  try {
    const response = await api.get('/Vehicules');
    return response.data; 
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      console.error('Erreur API:', axiosError.response.data);
    } else {
      console.error('Erreur réseau:', axiosError.message);
    }
    throw error;
  }
};

export default api;