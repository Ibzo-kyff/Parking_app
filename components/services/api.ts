// components/services/api.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.196.71:5000/api/';

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
}> => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, role, emailVerified } = response.data || {};
    if (accessToken) await setAuthToken(accessToken);
    return { accessToken, role, emailVerified };
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
}): Promise<any> => {
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
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearAuthToken();
    await AsyncStorage.multiRemove(['refreshToken', 'user', 'role']);
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

export default api;