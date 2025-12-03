import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../components/services/api';
import axios from 'axios';
import { API_URL } from '../components/services/api';

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
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
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
      const storedUserToken = await AsyncStorage.getItem('userToken');
      
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        const newAuthState = {
          ...parsedAuth,
          refreshToken: storedRefreshToken || parsedAuth.refreshToken,
          accessToken: storedUserToken || parsedAuth.accessToken,
        };
        setAuthState(newAuthState);
        if (newAuthState.accessToken) {
          setAuthToken(newAuthState.accessToken);
        }
      } else if (storedUserToken) {
        const newAuthState = {
          accessToken: storedUserToken,
          refreshToken: storedRefreshToken,
          role: null,
          userId: null,
          parkingId: null,
          emailVerified: false,
          nom: null,
          prenom: null,
        };
        setAuthState(newAuthState);
        setAuthToken(storedUserToken);
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
      
      if (newState.accessToken) {
        await AsyncStorage.setItem('userToken', newState.accessToken);
        setAuthToken(newState.accessToken);
      } else {
        await AsyncStorage.removeItem('userToken');
      }
      
      if (newState.refreshToken) {
        await AsyncStorage.setItem('refreshToken', newState.refreshToken);
      }
      
      console.log("✅ AuthState mis à jour et token stocké");
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
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      setAuthToken(null);
    } catch (error) {
      console.error('Erreur lors de la suppression des données d\'authentification:', error);
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    if (!authState.refreshToken) {
      console.error('Pas de refreshToken disponible');
      return false;
    }

    try {
      const response = await axios.post(`${API_URL}auth/refresh`, 
        { refreshToken: authState.refreshToken }, 
        { withCredentials: true }
      );
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await updateAuthState({
        accessToken,
        refreshToken: newRefreshToken || authState.refreshToken,
      });
      
      console.log('✅ Token rafraîchi avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error);
      await clearAuthState();
      return false;
    }
  };

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = authState.accessToken;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 403) {
      console.log('🔄 Token expiré, tentative de rafraîchissement...');
      
      const refreshSuccess = await refreshAuth();
      if (refreshSuccess) {
        token = authState.accessToken;
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } else {
        throw new Error('Impossible de rafraîchir le token');
      }
    }

    return response;
  };

  const contextValue: AuthContextType = {
    authState,
    setAuthState: updateAuthState,
    clearAuthState,
    isLoading,
    refreshAuth,
    authFetch,
    user: authState.userId ? {
      id: authState.userId ? Number(authState.userId) : null,
      nom: authState.nom,
      prenom: authState.prenom,
      role: authState.role,
    } : null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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