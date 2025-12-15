import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../components/services/api'; // Import setAuthToken
import axios from 'axios'; // Pour refresh direct
import { BASE_URL } from "../config/env";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  userId: string | null;
  parkingId: string | null;
  emailVerified: boolean;
  nom: string | null;
  prenom: string | null;
}

interface AuthContextType {
  authState: AuthState;
  setAuthState: (state: Partial<AuthState>) => void;
  clearAuthState: () => void;
  isLoading: boolean;
  refreshAuth: () => Promise<boolean>; 
  user: {
    id: number | null;
    nom: string | null;
    prenom: string | null;
    role: string | null;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    role: null,
    userId: null,
    parkingId: null,
    emailVerified: false,
    nom: null,
    prenom: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem('authState');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthState({
          ...parsedAuth,
          refreshToken: storedRefreshToken || parsedAuth.refreshToken,
        });
        if (parsedAuth.accessToken) {
          setAuthToken(parsedAuth.accessToken);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAuthState = async (state: Partial<AuthState>) => {
    const newState = { ...authState, ...state };
    setAuthState(newState);
    try {
      await AsyncStorage.setItem('authState', JSON.stringify(newState));
      if (newState.refreshToken) {
        await AsyncStorage.setItem('refreshToken', newState.refreshToken);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données d\'authentification:', error);
    }
  };

  const clearAuthState = async () => {
    setAuthState({
      accessToken: null,
      refreshToken: null,
      role: null,
      userId: null,
      parkingId: null,
      emailVerified: false,
      nom: null,
      prenom: null,
    });
    try {
      await AsyncStorage.removeItem('authState');
      await AsyncStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Erreur lors de la suppression des données d\'authentification:', error);
    }
  };

  // refreshAuth corrigée : Utilise axios direct, met à jour refreshToken
  const refreshAuth = async (): Promise<boolean> => {
    if (!authState.refreshToken) {
      console.error('Pas de refreshToken disponible');
      return false;
    }

    try {
      const response = await axios.post(`${BASE_URL}auth/refresh`, { refreshToken: authState.refreshToken }, {
        withCredentials: true
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data; // ← AJOUT : Gère rotation

      await updateAuthState({
        accessToken,
        refreshToken: newRefreshToken || authState.refreshToken, // Si pas de nouveau, garde ancien
      });
      setAuthToken(accessToken);
      console.log('Refresh réussi, new refreshToken:', newRefreshToken);
      return true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      await clearAuthState();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      authState, 
      setAuthState: updateAuthState, 
      clearAuthState, 
      isLoading,
      refreshAuth,
      user: authState && authState.userId ? {
        id: authState.userId ? Number(authState.userId) : null,
        nom: authState.nom,
        prenom: authState.prenom,
        role: authState.role,
      } : null,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};