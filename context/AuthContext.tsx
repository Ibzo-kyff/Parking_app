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
  getValidToken: () => Promise<string | null>; // NOUVEAU
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
        const newAuthState = {
          ...parsedAuth,
          refreshToken: storedRefreshToken || parsedAuth.refreshToken,
        };
        setAuthState(newAuthState);
        if (newAuthState.accessToken) {
          setAuthToken(newAuthState.accessToken);
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
      if (newState.accessToken) {
        setAuthToken(newState.accessToken);
        // Stocker aussi dans userToken pour compatibilité avec les services
        await AsyncStorage.setItem('userToken', newState.accessToken);
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
      await AsyncStorage.removeItem('userToken');
      setAuthToken(null);
    } catch (error) {
      console.error('Erreur lors de la suppression des données d\'authentification:', error);
    }
  };

  // Fonction pour vérifier si un token JWT est expiré
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000; // Temps en secondes
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Erreur vérification token:', error);
      return true; // Si erreur, considérer comme expiré
    }
  };

  // Fonction pour obtenir un token valide (rafraîchi si nécessaire)
  const getValidToken = async (): Promise<string | null> => {
    let token = authState.accessToken;
    
    // Si pas de token, retourner null
    if (!token) return null;
    
    // Vérifier si le token est expiré
    if (isTokenExpired(token)) {
      console.log('🔄 Token expiré, rafraîchissement en cours...');
      
      const refreshSuccess = await refreshAuth();
      if (refreshSuccess) {
        token = authState.accessToken; // Nouveau token après rafraîchissement
        console.log('✅ Token rafraîchi avec succès');
      } else {
        console.error('❌ Échec du rafraîchissement du token');
        return null;
      }
    }
    
    return token;
  };

  const refreshAuth = async (): Promise<boolean> => {
    const currentRefreshToken = authState.refreshToken;
    
    if (!currentRefreshToken) {
      console.error('Pas de refreshToken disponible');
      return false;
    }

    try {
      console.log('🔄 Tentative de rafraîchissement du token...');
      
      const response = await axios.post(`${API_URL}auth/refresh`, 
        { refreshToken: currentRefreshToken }, 
        { 
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await updateAuthState({
        accessToken,
        refreshToken: newRefreshToken || currentRefreshToken,
      });
      
      console.log('✅ Token rafraîchi avec succès');
      return true;
    } catch (error: any) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error.message);
      
      // Si le refresh token est invalide, déconnecter l'utilisateur
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🔒 Refresh token invalide, déconnexion...');
        await clearAuthState();
      }
      
      return false;
    }
  };

  const contextValue: AuthContextType = {
    authState,
    setAuthState: updateAuthState,
    clearAuthState,
    isLoading,
    refreshAuth,
    getValidToken, // Ajout de la nouvelle fonction
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