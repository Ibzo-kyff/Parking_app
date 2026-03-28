// components/services/api.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let authToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Intercepteur de requête
api.interceptors.request.use(
  async (config) => {
    // Éviter la boucle sur /auth/refresh
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }
    
    if (!authToken) {
      authToken = await AsyncStorage.getItem('accessToken');
    }
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse CORRIGÉ
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Si 401 ou 403 et pas encore retryé
    if ((error.response?.status === 401 || error.response?.status === 403) && 
        originalRequest && 
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh')) {
      
      originalRequest._retry = true;

      // Si déjà en train de refresh, on attend
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refreshToken available');
        }

        console.log('🔄 Tentative de refresh avec token:', storedRefreshToken.slice(0, 20) + '...');

        // IMPORTANT: Utiliser /auth/refresh (pas /auth/refresh-token)
        const response = await axios.post(`${BASE_URL}/auth/refresh`, 
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        if (!accessToken) {
          throw new Error('No access token received');
        }

        console.log(' Refresh réussi');

        // Mettre à jour les tokens
        await setAuthToken(accessToken);
        
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        // Récupérer l'authState et le mettre à jour
        const authStateStr = await AsyncStorage.getItem('authState');
        if (authStateStr) {
          const authState = JSON.parse(authStateStr);
          authState.accessToken = accessToken;
          if (newRefreshToken) {
            authState.refreshToken = newRefreshToken;
          }
          await AsyncStorage.setItem('authState', JSON.stringify(authState));
        }

        // Notifier les subscribers
        onRefreshed(accessToken);
        isRefreshing = false;

        // Retry la requête originale
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error(' Erreur refresh:', refreshError);
        
        isRefreshing = false;
        refreshSubscribers = [];
        
        // Clear tout
        await clearAuthToken();
        await AsyncStorage.multiRemove([
          'accessToken',
          'refreshToken',
          'authState',
          'role',
          'userId',
          'parkingId'
        ]);
        
        return Promise.reject(error);
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

// Login CORRIGÉ
export const login = async (credentials: { email: string; password: string }): Promise<{
  accessToken?: string;
  refreshToken?: string;
  role?: string;
  emailVerified?: boolean;
  nom?: string;
  prenom?: string;
  id?: number;
  parkingId?: number;
}> => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, role, emailVerified, nom, prenom, id, parkingId } = response.data || {};

    if (accessToken) {
      await setAuthToken(accessToken);
    }

    // Stocker refreshToken
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    // Stocker les infos user
    await AsyncStorage.setItem('role', role || '');
    await AsyncStorage.setItem('emailVerified', emailVerified ? 'true' : 'false');
    await AsyncStorage.setItem('nom', nom || '');
    await AsyncStorage.setItem('prenom', prenom || '');
    if (id) await AsyncStorage.setItem('userId', String(id));
    if (parkingId) await AsyncStorage.setItem('parkingId', String(parkingId));

    // Créer authState complet
    const authState = {
      accessToken,
      refreshToken,
      role,
      userId: id ? String(id) : null,
      parkingId: parkingId ? String(parkingId) : null,
      emailVerified: emailVerified || false,
      nom,
      prenom
    };

    await AsyncStorage.setItem('authState', JSON.stringify(authState));

    console.log(' Login réussi, refreshToken stored:', refreshToken?.slice(0, 20) + '...');

    return { accessToken, refreshToken, role, emailVerified, nom, prenom, id, parkingId };
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    console.error(' Login error:', err.response?.data);
    throw new Error(err.response?.data?.message || 'Échec de la connexion');
  }
};

// Fonction de refresh manuelle (optionnelle)
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      throw new Error('No refresh token');
    }

    const response = await axios.post(`${BASE_URL}/auth/refresh`, 
      { refreshToken: storedRefreshToken },
      { withCredentials: true }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    if (accessToken) {
      await setAuthToken(accessToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
      }
      return accessToken;
    }
    return null;
  } catch (error) {
    console.error(' Refresh manuel échoué:', error);
    return null;
  }
};

// Logout CORRIGÉ
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout', {}, { withCredentials: true });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearAuthToken();
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'authState',
      'role',
      'emailVerified',
      'nom',
      'prenom',
      'userId',
      'parkingId'
    ]);
  }
};

// Les autres fonctions...
export const register = async (userData: any): Promise<any> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de l\'inscription');
  }
};

export const forgotPassword = async (email: string): Promise<any> => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de l\'envoi');
  }
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<any> => {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      password: newPassword
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de la réinitialisation');
  }
};

export const verifyResetOTP = async (email: string, otp: string): Promise<any> => {
  try {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Code OTP invalide');
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

export const sendVerificationEmail = async (): Promise<any> => {
  try {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de l\'envoi');
  }
};

export const getCurrentUser = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/users/me');
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw new Error(err.response?.data?.message || 'Échec de récupération');
  }
};

export const getStoredAccessToken = (): Promise<string | null> => {
  return AsyncStorage.getItem('accessToken');
};

export default api;