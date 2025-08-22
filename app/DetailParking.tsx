// screens/DetailParking.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';



// Définition des paramètres attendus pour la route
type DetailParkingRouteParams = {
  DetailParking: { profile: string };
};


const DetailParking: React.FC = () => {
  const route = useRoute<RouteProp<DetailParkingRouteParams, 'DetailParking'>>();
  const navigation = useNavigation();
  const { profile } = route.params;


  return (
    <View style={styles.container}>
      {/* Bouton Retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>


      {/* En-tête du profil */}
      <View style={styles.profileHeader}>
        <Image
          source={require('../assets/images/carrousel1.png')}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{profile}</Text>
      </View>


      {/* Informations du parking */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={24} color="black" />
          <Text style={styles.infoText}>email@example.com</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={24} color="black" />
          <Text style={styles.infoText}>+123 456 7890</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={24} color="black" />
          <Text style={styles.infoText}>123 Rue Example, Ville</Text>
        </View>
      </View>


      {/* Bouton Nos Voitures */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.nosVoituresButton}
          onPress={() => navigation.navigate('NosVoitures' as never)}
        >
          <Text style={styles.buttonText}>Nos Voitures</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


// Styles identiques à ton code original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  nosVoituresButton: {
    backgroundColor: '#FD6A00',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});


export default DetailParking;
