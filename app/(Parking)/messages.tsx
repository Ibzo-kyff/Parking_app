import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Reservation() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bienvenue sur l’écran Réservation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f3f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#000',
  },
});
// app/tabs/messages.tsx (si pas déjà existant, créez-le de la même façon)
// import MessagesScreen from '../../shared/MessagesScreen'; // Ajustez le chemin
// export default MessagesScreen;