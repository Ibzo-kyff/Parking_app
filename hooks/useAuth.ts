// app/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export function useAuth() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const role = await AsyncStorage.getItem('role');
      setUserRole(role);
      setLoading(false);
      
      // Redirection automatique si déjà connecté
      if (role === 'CLIENT') router.replace('/tabs/accueil');
      if (role === 'PARKING') router.replace('/(Parking)/accueil');
    };

    checkAuth();
  }, []);

  const logout = async () => {
    await AsyncStorage.clear();
    setUserRole(null);
    router.replace('/login');
  };

  return { userRole, loading, logout };
}