import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
export const viewsService = {
  // Fonction pour incrémenter les vues via votre endpoint existant
  incrementViews: async (vehicleId: number): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/vehicules/${vehicleId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Complètement silencieux - aucun log
    } catch (error) {
      // Complètement silencieux - aucun log
    }
  },
};