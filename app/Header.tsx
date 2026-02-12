import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
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

  const token = authState.accessToken;
  const userId = authState.userId ? Number(authState.userId) : null;
  const parkingId = authState.parkingId ? Number(authState.parkingId) : null;
  const role = authState.role;

  // 🔑 Clé unique par compte (CLIENT / PARKING)
  const getLastSeenKey = () => {
    if (role === 'PARKING' && parkingId) {
      return `LAST_NOTIFICATION_SEEN_PARKING_${parkingId}`;
    }
    if ((role === 'CLIENT' || role === 'USER') && userId) {
      return `LAST_NOTIFICATION_SEEN_USER_${userId}`;
    }
    return 'LAST_NOTIFICATION_SEEN_UNKNOWN';
  };

  useEffect(() => {
    if (authState.prenom) setPrenom(authState.prenom);
  }, [authState.prenom]);

  // Fonction pour traiter les notifications récupérées
  const processNotifications = async (allNotifications: Notification[]) => {
    const storageKey = getLastSeenKey();
    const lastSeen = await AsyncStorage.getItem(storageKey);
    const lastSeenDate = lastSeen ? new Date(lastSeen) : null;

    // Filtrer les notifications non lues et nouvelles
    const newNotifications = allNotifications.filter((n) => {
      if (!n.createdAt) return false;
      const notifDate = new Date(n.createdAt);
      return n.read === false && (!lastSeenDate || notifDate > lastSeenDate);
    });

    setNotifications(newNotifications);
    setBadgeCount(newNotifications.length);
  };

  // 🔔 Récupérer toutes les notifications non lues
  const fetchNotificationsData = async () => {
    if (!token) return;

    let allNotifications: Notification[] = [];
    let retryAfterRefresh = false;

    try {
      if (role === 'PARKING' && parkingId) {
        allNotifications = await getNotifications(undefined, parkingId);
      } else if ((role === 'CLIENT' || role === 'USER') && userId) {
        allNotifications = await getNotifications(userId, undefined);
      }

      await processNotifications(allNotifications);
    } catch (error: any) {
      if (error.message === 'INVALID_TOKEN' && !retryAfterRefresh) {
        const refreshed = await refreshAuth();
        if (refreshed) {
          retryAfterRefresh = true;
          // Réessayer la récupération après refresh
          try {
            if (role === 'PARKING' && parkingId) {
              allNotifications = await getNotifications(undefined, parkingId);
            } else if ((role === 'CLIENT' || role === 'USER') && userId) {
              allNotifications = await getNotifications(userId, undefined);
            }
            await processNotifications(allNotifications);
            return; // Succès après retry, on sort
          } catch (retryError) {
            console.error('Erreur après refresh du token:', retryError);
          }
        }
        // Si refresh échoue ou retry échoue, déconnexion
        clearAuthState();
        router.replace('/(auth)/LoginScreen');
      } else {
        console.error('Erreur badge notification:', error);
        setNotifications([]);
        setBadgeCount(0);
      }
    }
  };

  useEffect(() => {
    fetchNotificationsData();

    const interval = setInterval(fetchNotificationsData, 15000); 
    return () => clearInterval(interval);
  }, [token, role, userId, parkingId]);

  //  Quand on ouvre une notification individuelle
  const handleReadNotification = async (notifId: number) => {
    try {
      // Mettre à jour côté serveur
      await markNotificationAsRead(notifId);

      // Retirer du tableau local
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      setBadgeCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.log('Erreur read notification:', error);
    }
  };

  // 🔔 Ouvrir la liste des notifications (toutes)
  const handleOpenNotifications = async () => {
    const storageKey = getLastSeenKey();
    await AsyncStorage.setItem(storageKey, new Date().toISOString());

    // On peut garder les notifications locales intactes ou les marquer toutes lues ici
    setBadgeCount(0);

    router.push('/(Clients)/Notifications');
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          await logout();
          clearAuthState();
          setBadgeCount(0);
          router.replace('/(auth)/LoginScreen');
        },
      },
    ]);
  };

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
    top: 10,
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