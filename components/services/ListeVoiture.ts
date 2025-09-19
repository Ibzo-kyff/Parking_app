import axios, { AxiosError } from 'axios';

const API_URL = 'https://parkapp-pi.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getVehicules = async () => {
  try {
    const response = await api.get('/vehicules');
    return response.data; // ✅ chaque véhicule contient déjà "parking"
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
