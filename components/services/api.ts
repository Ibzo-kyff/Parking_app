// components/services/api.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'https://parkapp-pi.vercel.app/api/';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Essentiel pour envoyer les cookies
});

let authToken: string | null = null;

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    
    if (error.response?.status === 403 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tentative de rafraîchissement du token
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true // Important pour envoyer le cookie refreshToken
        });
        
        const { accessToken } = response.data;
        if (accessToken) {
          await setAuthToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Erreur lors du rafraîchissement du token:', refreshError);
        await clearAuthToken();
        await AsyncStorage.removeItem('authState');
        // Vous pouvez rediriger vers la page de login ici si nécessaire
      }
    }
    
    return Promise.reject(error);
  }
);

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

    // Le refreshToken n'est plus dans la réponse, il est dans un cookie HTTP-only
    const { accessToken, role, emailVerified, nom, prenom, id, parkingId } = response.data || {};

    // Stocker accessToken
    if (accessToken) await setAuthToken(accessToken);

    // Stocker infos utilisateur
    await AsyncStorage.setItem('role', role || '');
    await AsyncStorage.setItem('emailVerified', emailVerified ? 'true' : 'false');
    await AsyncStorage.setItem('nom', nom || 'Inconnu');
    await AsyncStorage.setItem('prenom', prenom || 'Inconnu');

    // Stocker id et parkingId
    if (id) await AsyncStorage.setItem('userId', String(id));
    if (parkingId) await AsyncStorage.setItem('parkingId', String(parkingId));

    // Mettre à jour le state d'authentification
    const authState = {
      accessToken,
      refreshToken: null, // Plus besoin de stocker le refreshToken côté client
      role,
      userId: id ? String(id) : null,
      parkingId: parkingId ? String(parkingId) : null,
      emailVerified: emailVerified || false,
      nom,
      prenom
    };
    
    await AsyncStorage.setItem('authState', JSON.stringify(authState));

    return { accessToken, role, emailVerified, nom, prenom, id, parkingId };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de la connexion');
  }
};

// Les autres fonctions restent largement inchangées...
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

// Cette fonction n'est plus nécessaire car le rafraîchissement se fait automatiquement via l'intercepteur
export const refreshToken = async (): Promise<string> => {
  try {
    const response = await api.post('/auth/refresh', {}, {
      withCredentials: true
    });
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
    await api.post('/auth/logout', {}, {
      withCredentials: true
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status !== 401) {
      console.error('Logout error (non-401):', error);
    }
  } finally {
    await clearAuthToken();
    await AsyncStorage.multiRemove([
      'accessToken', 
      'role', 
      'emailVerified', 
      'nom', 
      'prenom',
      'userId',
      'parkingId',
      'authState'
    ]);
  }
};

// Les autres fonctions restent inchangées...
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