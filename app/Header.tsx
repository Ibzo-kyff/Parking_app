import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { logout } from '../components/services/api';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../components/services/Notification';

const Header: React.FC = () => {
  const router = useRouter();
  const { authState, clearAuthState } = useAuth();

  const [prenom, setPrenom] = useState('User');
  const [unreadCount, setUnreadCount] = useState(0);

  const token = authState.accessToken;
  const userId = authState.userId ? Number(authState.userId) : null;
  const parkingId = authState.parkingId ? Number(authState.parkingId) : null;
  const role = authState.role;

  useEffect(() => {
    if (authState.prenom) {
      setPrenom(authState.prenom);
    }
  }, [authState.prenom]);

  // 🔔 Récupération des notifications non lues (badge)
  const fetchUnreadNotifications = async () => {
    if (!token) return;

    try {
      let data: any[] = [];

      if (role === 'PARKING' && parkingId) {
        data = await getNotifications(undefined, parkingId);
      } else if ((role === 'CLIENT' || role === 'USER') && userId) {
        data = await getNotifications(userId, undefined);
      }

      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log('Erreur badge notification:', error);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 15000); // ⏱️ 15s comme Instagram
    return () => clearInterval(interval);
  }, [token, role, userId, parkingId]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          await logout();
          clearAuthState();
          router.replace('/(auth)/LoginScreen');
        },
      },
    ]);
  };

  const handleOpenNotifications = () => {
    setUnreadCount(0); // 👈 badge disparaît immédiatement
    router.push('/(Clients)/Notifications');
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

        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
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
    backgroundColor: '#E0245E', // 🔴 Instagram-like
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
