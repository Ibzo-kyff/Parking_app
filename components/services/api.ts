import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Pour compatibilité web, mais mobile ignore souvent
});

let authToken: string | null = null;

// Intercepteur de requête : Attache le token automatiquement
api.interceptors.request.use(
  async (config) => {
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

// Intercepteur de réponse : Gère l'expiration du token (401 ou 403)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Si 401 (Unauthorized) ou 403 (Forbidden), on tente un refresh
    if ((error.response?.status === 401 || error.response?.status === 403) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refreshToken available');
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: storedRefreshToken }, {
          withCredentials: true
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data; // ← AJOUT : Extrait newRefreshToken si présent (rotation)
        if (accessToken) {
          await setAuthToken(accessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken); // ← AJOUT : Mise à jour refreshToken
            // Optionnel : Mise à jour authState si needed, mais context gère
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Erreur lors du rafraîchissement du token:', refreshError);
        await clearAuthToken();
        await AsyncStorage.removeItem('authState');
        await AsyncStorage.removeItem('refreshToken'); // ← AJOUT : Clear refresh
        // Rediriger vers login si dans un component, mais ici c'est global
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

// Login : Déjà bon, mais ajoute log
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

    if (accessToken) await setAuthToken(accessToken);

    await AsyncStorage.setItem('role', role || '');
    await AsyncStorage.setItem('emailVerified', emailVerified ? 'true' : 'false');
    await AsyncStorage.setItem('nom', nom || 'Inconnu');
    await AsyncStorage.setItem('prenom', prenom || 'Inconnu');
    if (id) await AsyncStorage.setItem('userId', String(id));
    if (parkingId) await AsyncStorage.setItem('parkingId', String(parkingId));

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

    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    console.log('Login API: refreshToken stored', refreshToken); // ← AJOUT : Log pour debug

    return { accessToken, refreshToken, role, emailVerified, nom, prenom, id, parkingId };
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
// Si needed ailleurs, aligne-la :
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, {
      withCredentials: true
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (accessToken) {
      await setAuthToken(accessToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
      }
      return { accessToken, refreshToken: newRefreshToken };
    }
    throw new Error('No access token received');
  } catch (error) {
    throw new Error('Échec du rafraîchissement du token');
  }
};

// Logout : Bon, ajoute remove refreshToken
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
      'authState',
      'refreshToken' // ← AJOUT
    ]);

    try {
      const { cleanupPusher } = require('../../app/utils/pusher');
      cleanupPusher();
    } catch (e) {
      // Ignorer si échec require
    }
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