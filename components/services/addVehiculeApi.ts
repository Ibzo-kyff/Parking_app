const BASE_URL = "https://parkapp-pi.vercel.app/"; 

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const apiService = {
  // Récupérer les informations de l'utilisateur
  async getUserInfo(accessToken: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/users/me`, {
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
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
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
      const response = await fetch(`${BASE_URL}/api/vehicules`, {
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
};