import axios from 'axios';

const API_URL = 'https://parkapp-pi.vercel.app/api/';

// Instance Axios avec configuration globale
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  api.defaults.headers.Authorization = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.Authorization;
};

export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, role, emailVerified } = response.data;

    if (accessToken) setAuthToken(accessToken);

    return { accessToken, role, emailVerified };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Échec de la connexion');
  }
};

export const register = async (userData: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Échec de l\'inscription');
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;
    if (accessToken) setAuthToken(accessToken);
    return accessToken;
  } catch (error: any) {
    throw new Error('Échec du rafraîchissement du token');
  }
};