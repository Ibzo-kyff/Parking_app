import axios from 'axios';

const API_URL = ' http://192.168.22.71:5000/api'; // Remplacez par votre URL

export const login = async (credentials: { email: string; password: string }) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials);
  return response.data;
};

export const register = async (userData: { email: string; password: string }) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

// Ajoutez d'autres fonctions API au besoin