// components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { logout } from '../components/services/api';

type HeaderProps = {
  firstName?: string;
  lastName?: string;
};

const Header: React.FC<HeaderProps> = ({ firstName = 'User' }) => {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            await logout();                      
            router.replace('(auth)/LoginScreen');     
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Bouton Déconnexion */}
      <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
        <FontAwesome name="sign-out" size={24} color="white"/>
      </TouchableOpacity>

      <Text style={styles.userName}>Bienvenue👋 {firstName}</Text>

      {/* Exemple autre bouton (notifications) */}
      <TouchableOpacity
        style={styles.notificationIcon}
        onPress={() => router.push('/notifications')}
      >
        <FontAwesome name="bell-o" size={24} color="white" />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    marginHorizontal: 15,
  },
  notificationIcon: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ff7d00',
  },
});

export default Header;
