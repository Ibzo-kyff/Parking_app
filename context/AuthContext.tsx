// context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, refreshToken } from '../components/services/api';
import { authService } from '../components/services/profileApi';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;  // ← AJOUT : Stockez le refreshToken
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
  refreshAuth: () => Promise<boolean>; // Ajout de refreshAuth
  // Fournir un objet `user` dérivé pour compatibilité avec le code existant
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
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthState(parsedAuth);
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

  // Ajout de la fonction refreshAuth
  const refreshAuth = async (): Promise<boolean> => {
  if (!authState.refreshToken) {
    console.error('Pas de refreshToken disponible');
    return false;
  }

  try {
    const newTokens = await authService.refreshToken(authState.refreshToken);  // ← AJOUT : Passez refreshToken
    await updateAuthState({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,  // ← AJOUT : Mettez à jour avec le nouveau refreshToken (rotation)
    });
    setAuthToken(newTokens.accessToken);
    return true;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    clearAuthState();
    return false;
  }
};

  return (
    <AuthContext.Provider value={{ 
      authState, 
      setAuthState: updateAuthState, 
      clearAuthState, 
      isLoading,
      refreshAuth // Ajout de refreshAuth
      ,
      // Dériver un objet user depuis authState pour compatibilité
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