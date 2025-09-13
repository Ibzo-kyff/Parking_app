export const API_URL = "https://parkapp-pi.vercel.app";

export interface Parking {
  id: number;
  userId: number;
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string | null;
  description: string | null;
  capacity: number;
  hoursOfOperation: string | null;
  status: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
  };
  vehicles?: any[];
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