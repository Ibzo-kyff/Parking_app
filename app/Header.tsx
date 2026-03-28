// components/Header.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { logout } from '../components/services/api';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationAsRead } from '../components/services/Notification';

interface Notification {
  id: number;
  title: string;
  read: boolean;
  createdAt: string;
}

const Header: React.FC = () => {
  const router = useRouter();
  const { authState, clearAuthState, refreshAuth } = useAuth();

  const [prenom, setPrenom] = useState('User');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  
  // Référence pour éviter les appels multiples
  const isMounted = useRef(true);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const token = authState.accessToken;
  const userId = authState.userId ? Number(authState.userId) : null;
  const parkingId = authState.parkingId ? Number(authState.parkingId) : null;
  const role = authState.role;

  useEffect(() => {
    isMounted.current = true;
    
    if (authState.prenom) {
      setPrenom(authState.prenom);
    }

    // Nettoyage
    return () => {
      isMounted.current = false;
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [authState.prenom]);

  const getLastSeenKey = useCallback(() => {
    if (role === 'PARKING' && parkingId) {
      return `LAST_NOTIFICATION_SEEN_PARKING_${parkingId}`;
    }
    if (role === 'CLIENT' && userId) {
      return `LAST_NOTIFICATION_SEEN_USER_${userId}`;
    }
    return null;
  }, [role, parkingId, userId]);

  const processNotifications = useCallback(async (allNotifications: Notification[]) => {
    if (!isMounted.current) return;

    try {
      const storageKey = getLastSeenKey();
      if (!storageKey) return;

      const lastSeen = await AsyncStorage.getItem(storageKey);
      const lastSeenDate = lastSeen ? new Date(lastSeen) : null;

      const newNotifications = allNotifications.filter((n) => {
        if (!n.createdAt) return false;
        const notifDate = new Date(n.createdAt);
        return n.read === false && (!lastSeenDate || notifDate > lastSeenDate);
      });

      if (isMounted.current) {
        setNotifications(newNotifications);
        setBadgeCount(newNotifications.length);
      }
    } catch (error) {
      console.error('Erreur processNotifications:', error);
    }
  }, [getLastSeenKey]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    if (!userId && !parkingId) return;

    try {
      let allNotifications: Notification[] = [];
      
      if (role === 'PARKING' && parkingId) {
        allNotifications = await getNotifications(undefined, parkingId);
      } else if (role === 'CLIENT' && userId) {
        allNotifications = await getNotifications(userId, undefined);
      }

      if (isMounted.current) {
        await processNotifications(allNotifications);
      }
    } catch (error) {
      console.error('Erreur fetchNotifications:', error);
      // L'interceptor va gérer les erreurs d'auth
    }
  }, [token, role, userId, parkingId, processNotifications]);

  // Setup polling
  useEffect(() => {
    if (!token || !(userId || parkingId)) return;

    // Premier fetch
    fetchNotifications();

    // Polling toutes les 30 secondes
    pollingInterval.current = setInterval(fetchNotifications, 30000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [token, userId, parkingId, fetchNotifications]);

  const handleOpenNotifications = async () => {
    const storageKey = getLastSeenKey();
    if (storageKey) {
      await AsyncStorage.setItem(storageKey, new Date().toISOString());
    }
    
    if (isMounted.current) {
      setBadgeCount(0);
    }
    
    router.push('/(Clients)/Notifications');
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            await clearAuthState();
            if (isMounted.current) {
              setBadgeCount(0);
            }
            router.replace('/(auth)/LoginScreen');
          }
        },
      },
    ]);
  };

  if (!token) {
    return null; // Ne rien afficher si non authentifié
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={22} color="white" />
      </TouchableOpacity>

      <Text style={styles.userName}>Bienvenue {prenom} 👋</Text>

      <TouchableOpacity
        style={styles.notificationWrapper}
        onPress={handleOpenNotifications}
      >
        <FontAwesome name="bell-o" size={22} color="white" />
        {badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    elevation: 8,
  },
  logoutIcon: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ff7d00',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FD6A00',
    flex: 1,
    textAlign: 'center',
  },
  notificationWrapper: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ff7d00',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E0245E',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;