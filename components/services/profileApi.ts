import { Platform } from 'react-native';
import { BASE_URL } from "../../config/env";

// Interface pour les données utilisateur
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  address?: string;
  phone?: string;
  image?: string;
  emailVerified?: boolean;
  parkingId?: string;
}

// Interface pour la réponse de l'API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Gestionnaire des erreurs API
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Service API principal
export const apiService = {
  // Méthode générique pour les requêtes
  async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  let headers: HeadersInit = { ...options.headers }; // Commence sans default

  // Ajoutez Content-Type JSON seulement si PAS FormData
  if (!(options.body instanceof FormData)) {
    headers = {
      ...headers,
      'Content-Type': 'application/json',
    };
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

    try {
      const response = await fetch(url, config);
      
      // Gestion des erreurs HTTP
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Si la réponse n'est pas du JSON, on utilise le texte brut
          const text = await response.text();
          if (text) errorMessage = text;
        }
        
        throw new ApiError(errorMessage, response.status);
      }

      // Tentative de parsing JSON
      try {
        const data = await response.json();
        return data;
      } catch (e) {
        // Si pas de JSON, retourner une réponse vide
        return {} as T;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Erreur réseau'
      );
    }
  },

  // Méthode pour les requêtes authentifiées
  async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return this.request<T>(endpoint, {
      ...options,
      headers,
    });
  },
};

// Service d'authentification
export const authService = {

  // Mot de passe oublié
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiService.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
   // Rafraîchir le token
  async refreshToken(refreshToken: string): Promise<{ 
    accessToken: string; 
    refreshToken: string;
  }> {
    return apiService.request<{ 
      accessToken: string; 
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }), // ← IMPORTANT: envoyer dans le body
    });
  },

  // Déconnexion
  async logout(token: string): Promise<{ message: string }> {
    return apiService.authenticatedRequest<{ message: string }>('/auth/logout', token, {
      method: 'POST',
    });
  },

  // Réinitialisation du mot de passe
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiService.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

// Service utilisateur
export const userService = {
  // Récupérer les informations de l'utilisateur connecté
 async getCurrentUser(token: string): Promise<User> {
    return apiService.authenticatedRequest<User>('/auth/users/me', token, {
      method: 'GET',
    });
  },

  // Récupérer les informations détaillées de l'utilisateur
  async getUserDetails(token: string): Promise<User> {
    return apiService.authenticatedRequest<User>('/auth/users/me', token, {
      method: 'GET',
    });
  },

  // Mettre à jour les informations utilisateur
  async updateUserDetails(
    token: string,
    userData: Partial<{
      nom: string;
      prenom: string;
      address: string;
      phone: string;
      email: string;
      motdepasse?: string;
    }>
  ): Promise<User> {
    return apiService.authenticatedRequest<User>('/auth/users/me', token, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  // Mettre à jour le profil utilisateur
  async updateProfile(
    token: string,
    userData: Partial<{
      nom: string;
      prenom: string;
      email: string;
    }>
  ): Promise<User> {
    return apiService.authenticatedRequest<User>('/auth/users/me', token, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Mettre à jour la photo de profil
  async updateProfileImage(token: string, imageUri: string): Promise<User> {
    const formData = new FormData();

    const filename = imageUri.split('/').pop() || `profile_${Date.now()}.jpg`;
    const ext = filename.split('.').pop() || 'jpg';
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('image', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: filename,
      type,
    } as any);

    return apiService.authenticatedRequest<User>('/auth/users/me', token, {
      method: 'PUT',
      // ⚠️ Ne pas forcer Content-Type ici !
      body: formData,
    });
  },


  // Changer le mot de passe
  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return apiService.authenticatedRequest<{ message: string }>(
      '/auth/change-password',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );
  },

 // Supprimer le compte
  async deleteAccount(token: string): Promise<{ message: string }> {
    return apiService.authenticatedRequest<{ message: string }>(
      '/auth/users/me',
      token,
      {
        method: 'DELETE',
      }
    );
  },
};

export default apiService;