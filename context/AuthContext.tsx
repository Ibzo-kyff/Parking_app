import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../components/services/api'; 
import api from '../components/services/api'; // Import de l'instance Axios par défaut (pour les interceptors)
import axios from 'axios'; 
import Constants from 'expo-constants';
import { useRouter } from 'expo-router'; // Pour la redirection en cas d'échec de refresh

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
  refreshAuth: () => Promise<string | false>; // Changé pour retourner le nouveau token ou false
  user: {
    id: number | null;
    nom: string | null;
    prenom: string | null;
    role: string | null;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter(); // Pour rediriger en cas d'échec de refresh global
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

  // Lock pour refresh concurrent (évite les race conditions et multiples appels)
  const isRefreshingRef = useRef(false);
  const refreshSubscribersRef = useRef<((token: string) => void)[]>([]);

  // Fonctions pour gérer les abonnés au refresh (pour les requêtes en attente)
  const subscribeTokenRefresh = (cb: (token: string) => void) => {
    refreshSubscribersRef.current.push(cb);
  };

  const onRefreshed = (token: string) => {
    refreshSubscribersRef.current.forEach((cb) => cb(token));
    refreshSubscribersRef.current = [];
  };

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

  // Fonction helper pour récupérer le token (utilisée par les interceptors)
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const authStateStr = await AsyncStorage.getItem('authState');
      if (authStateStr) {
        const parsed = JSON.parse(authStateStr);
        return parsed.accessToken || null;
      }
      // Fallback ancien système
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Erreur getAuthToken:', error);
      return null;
    }
  };

  // **INTERCEPTORS AXIOS GLOBAUX : Rafraîchissement automatique sur 401/403**
  // Cela gère TOUS les appels API (notifications, push, etc.) de manière transparente
  useEffect(() => {
    // Interceptor pour les requêtes (ajoute le token automatiquement)
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        const token = await getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor pour les réponses (gère les erreurs token expiré)
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si 401 ou 403 et pas déjà retryé
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          // Si un refresh est déjà en cours, on attend
          if (isRefreshingRef.current) {
            return new Promise((resolve) => {
              subscribeTokenRefresh((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(api(originalRequest));
              });
            });
          }

          // Lock pour refresh
          isRefreshingRef.current = true;

          try {
            const newAccessToken = await refreshAuth();
            if (newAccessToken) {
              // Notifie les autres requêtes en attente
              onRefreshed(newAccessToken);
              // Retry la requête originale avec le nouveau token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              isRefreshingRef.current = false;
              return api(originalRequest);
            } else {
              // Refresh échoué : déconnexion propre
              isRefreshingRef.current = false;
              await clearAuthState();
              router.replace('/(auth)/LoginScreen');
            }
          } catch (refreshError) {
            console.error('Erreur refresh dans interceptor:', refreshError);
            isRefreshingRef.current = false;
            await clearAuthState();
            router.replace('/(auth)/LoginScreen');
          }
        }

        // Autres erreurs : on les propage
        return Promise.reject(error);
      }
    );

    // Nettoyage des interceptors à la destruction du provider
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [authState.accessToken]); // Relance si le token change (sécurité)

  // **refreshAuth mis à jour : Retourne le nouveau token ou false**
  // + Gestion robuste du refreshToken
  const refreshAuth = async (): Promise<string | false> => {
    let currentRefreshToken = authState.refreshToken;

    if (!currentRefreshToken) {
      currentRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (!currentRefreshToken) {
        console.error('Pas de refreshToken disponible dans state ou storage');
        return false;
      }
      // Mettre à jour le state pour cohérence
      await updateAuthState({ refreshToken: currentRefreshToken });
    }

    try {
      console.log('🔄 Tentative de refresh avec token:', currentRefreshToken?.slice(0, 20) + '...'); // Debug utile
      const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: currentRefreshToken }, {
        withCredentials: true
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await updateAuthState({
        accessToken,
        refreshToken: newRefreshToken || currentRefreshToken,
      });
      setAuthToken(accessToken);
      console.log('✅ Refresh réussi, new refreshToken:', newRefreshToken);
      return accessToken; // Retourne le nouveau token pour les interceptors
    } catch (error: any) {
      console.error('❌ Erreur lors du rafraîchissement du token:', error);
      // Si 403 ou erreur critique, déconnexion
      if (error.response?.status === 403) {
        console.warn('RefreshToken invalide côté serveur - déconnexion');
      }
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