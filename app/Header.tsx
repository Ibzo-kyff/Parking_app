import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

type HeaderProps = {
  firstName: string;
  lastName: string;
};

const Header: React.FC<HeaderProps> = ({ firstName, lastName }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require('../assets/images/blanc.jpg')} style={styles.logo} />

      {/* Message de salutation */}
      <Text style={styles.userName}>👋 Fanta, {firstName} {lastName}</Text>

      {/* Icône de notification */}
      <TouchableOpacity style={styles.notificationIcon} onPress={() => navigation.navigate('Notifications')}>
        <FontAwesome name="bell-o" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  notificationIcon: {
    padding: 5,
  },
});

export default Header;
