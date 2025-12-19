import Constants from 'expo-constants';
interface ApiResponse<T> {
  data?: T;
  error?: string;
}
const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
export const apiService = {
  // Récupérer les informations de l'utilisateur
  async getUserInfo(accessToken: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/auth/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Erreur lors de la récupération des informations de l'utilisateur" };
      }
      return { data };
    } catch (err) {
      return { error: "Erreur réseau : impossible de contacter le serveur" };
    }
  },

  // Rafraîchir le token
  async refreshToken(): Promise<ApiResponse<string>> {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: "Échec du rafraîchissement du token" };
      }
      return { data: data.accessToken };
    } catch (err) {
      return { error: "Erreur lors du rafraîchissement du token" };
    }
  },

  // Créer un véhicule
  async createVehicle(formData: FormData, accessToken: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/vehicules`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Impossible de créer le véhicule" };
      }
      return { data };
    } catch (err) {
      return { error: "Erreur serveur : vérifiez votre backend ou votre connexion" };
    }
  },

  // Modifier un véhicule
  async updateVehicle(vehicleId: string, formData: FormData, accessToken: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/vehicules/${vehicleId}`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Impossible de modifier le véhicule" };
      }
      return { data };
    } catch (err) {
      return { error: "Erreur serveur lors de la modification du véhicule" };
    }
  },

  // Supprimer un véhicule
  async deleteVehicle(vehicleId: string, accessToken: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/vehicules/${vehicleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || "Impossible de supprimer le véhicule" };
      }
      
      // Pour les requêtes DELETE, on peut retourner un objet vide si c'est un succès
      return { data: { success: true, message: "Véhicule supprimé avec succès" } };
    } catch (err) {
      return { error: "Erreur serveur lors de la suppression du véhicule" };
    }
  },

  // Récupérer un véhicule par son ID
  async getVehicleById(vehicleId: string, accessToken: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/vehicules/${vehicleId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || "Impossible de récupérer les données du véhicule" };
      }
      return { data };
    } catch (err) {
      return { error: "Erreur réseau lors de la récupération du véhicule" };
    }
  },
};