// components/services/api.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://parkapp-pi.vercel.app/api/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let authToken: string | null = null;

// Helper type pour les erreurs API
type ApiError = {
  message: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

export const setAuthToken = async (token: string): Promise<void> => {
  authToken = token;
  api.defaults.headers.Authorization = `Bearer ${token}`;
  await AsyncStorage.setItem('accessToken', token);
};

export const clearAuthToken = async (): Promise<void> => {
  authToken = null;
  delete api.defaults.headers.Authorization;
  await AsyncStorage.removeItem('accessToken');
};

export const login = async (credentials: { email: string; password: string }): Promise<{
  accessToken?: string;
  role?: string;
  emailVerified?: boolean;
  nom?: string;
  prenom?: string;
  id?: number;
  parkingId?: number;
}> => {
  try {
    const response = await api.post('/auth/login', credentials);

    // ✅ inclure id & parkingId dans la destructuration
    const { accessToken, role, emailVerified, nom, prenom, id, parkingId } = response.data || {};

    // ✅ stocker accessToken
    if (accessToken) await setAuthToken(accessToken);

    // ✅ stocker infos utilisateur
    await AsyncStorage.setItem('role', role || '');
    await AsyncStorage.setItem('emailVerified', emailVerified ? 'true' : 'false');
    await AsyncStorage.setItem('nom', nom || 'Inconnu');
    await AsyncStorage.setItem('prenom', prenom || 'Inconnu');

    // ✅ stocker id et parkingId
    if (id) await AsyncStorage.setItem('userId', String(id));
    if (parkingId) await AsyncStorage.setItem('parkingId', String(parkingId));

    return { accessToken, role, emailVerified, nom, prenom, id, parkingId };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de la connexion');
  }
};

export const register = async (userData: {
  email: string;
  password: string;
  confirmPassword?: string;
  nom?: string;
  prenom?: string;
  phone?: string;
  address?: string;
  role?: string;
}): Promise<{
  message: string;
  accessToken?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  role?: string;
  emailVerified?: boolean;
}> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de l\'inscription');
  }
};

export const refreshToken = async (refreshToken: string): Promise<string> => {
  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data || {};
    if (accessToken) {
      await setAuthToken(accessToken);
      return accessToken;
    }
    throw new Error('No access token received');
  } catch (error) {
    throw new Error('Échec du rafraîchissement du token');
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Essayer de déconnecter proprement du serveur
    await api.post('/auth/logout');
  } catch (error) {
    const axiosError = error as AxiosError;
    // L'erreur 401 est attendue si le token est déjà expiré/invalide
    if (axiosError.response?.status !== 401) {
      console.error('Logout error (non-401):', error);
    }
    // On continue quand même le cleanup local même en cas d'erreur
  } finally {
    // Nettoyage local garantie dans tous les cas
    await clearAuthToken();
    await AsyncStorage.multiRemove([
      'accessToken', 
      'refreshToken', 
      'role', 
      'emailVerified', 
      'nom', 
      'prenom',
      'user'
    ]);
  }
};

export const getStoredAccessToken = (): Promise<string | null> => {
  return AsyncStorage.getItem('accessToken');
};

export const sendPasswordResetOTP = async (email: string): Promise<any> => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Failed to send OTP');
  }
};

export const resetPassword = async (
  email: string, 
  otp: string, 
  newPassword: string
): Promise<any> => {
  try {
    const response = await api.post('/auth/reset-password', { 
      email, 
      otp, 
      password: newPassword 
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de la réinitialisation du mot de passe');
  }
};

export const verifyResetOTP = async (email: string, otp: string): Promise<any> => {
  try {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Invalid OTP');
  }
};
export const verifyEmailWithOTP = async (email: string, otp: string): Promise<any> => {
  try {
    const response = await api.post('/auth/verify-email-otp', { email, otp });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Code OTP invalide');
  }
};

export const sendVerificationEmail = async (email: string): Promise<any> => {
  try {
    const response = await api.post('/auth/send-verification-email', { email });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de l\'envoi du code OTP');
  }
};

export default api;