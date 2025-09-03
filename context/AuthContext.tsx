import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { setAuthToken } from '../components/services/api';
import { API_URL } from '../components/services/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null; // Ajout du refresh token
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
  refreshAuth: () => Promise<void>; // Nouvelle méthode pour rafraîchir
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
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthState(parsedAuth);
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
    } catch (error) {
      console.error('Erreur lors de la suppression des données d\'authentification:', error);
    }
  };

  const refreshAuth = async () => {
    try {
      if (authState.refreshToken) {
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: authState.refreshToken });
        const { accessToken, refreshToken } = response.data;
        await updateAuthState({ accessToken, refreshToken });
        setAuthToken(accessToken); // Mettre à jour le token dans axios
      } else {
        console.error('Aucun refresh token disponible');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      clearAuthState(); // Forcer une reconnexion si le refresh échoue
    }
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState: updateAuthState, clearAuthState, isLoading, refreshAuth }}>
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