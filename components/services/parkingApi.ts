export const API_URL = "https://parkapp-pi.vercel.app";

export interface Parking {
  id: number;
  name: string;
  city: string;
  email: string;
  phone: string;
  logo?: string;
  image?: string;
}

// Récupérer tous les parkings
export const getParkings = async (): Promise<Parking[]> => {
  const res = await fetch(`${API_URL}/api/parkings`);
  if (!res.ok) throw new Error("Erreur lors du chargement des parkings");
  return res.json();
};

// Récupérer un parking par ID
export const getParkingById = async (
  id: string | number,
  accessToken?: string | null
): Promise<Parking> => {
  const res = await fetch(`${API_URL}/api/parkings/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) throw new Error("Erreur lors du chargement du parking");
  return res.json();
};
