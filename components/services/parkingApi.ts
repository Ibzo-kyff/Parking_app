import { BASE_URL } from "../../config/env";
export interface Parking {
  id: number;
  userId: number;
  nom: string;
  adresse: string;
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
  const res = await fetch(`${BASE_URL}/parkings`);
  if (!res.ok) throw new Error("Erreur lors du chargement des parkings");
  return res.json();
};

// Récupérer un parking par ID
export const getParkingById = async (
  id: string | number,
  accessToken?: string | null
): Promise<Parking> => {
  const res = await fetch(`${BASE_URL}/parkings/${id}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) throw new Error("Erreur lors du chargement du parking");
  return res.json();
};
export const getMyParking = async (token: string) => {
  const response = await fetch(`${BASE_URL}/parkings/me`, { // Note: Ajoutez la route /my-parking dans le router backend pointant vers getMyParking
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de la récupération du parking');
  }

  return response.json();
};

export const updateParking = async (token: string, id: number, data: any, logoUri?: string) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  if (logoUri) {
    const fileName = logoUri.split('/').pop() || 'logo.jpg';
    const fileType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    formData.append('logo', {
      uri: logoUri,
      name: fileName,
      type: fileType,
    } as any);
  }

  const response = await fetch(`${BASE_URL}/parkings/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erreur lors de la mise à jour du parking');
  }

  return response.json();
};