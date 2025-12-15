import axios, { AxiosError } from 'axios';
import { BASE_URL } from "../../config/env";


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