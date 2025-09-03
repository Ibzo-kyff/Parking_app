import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getVehicules } from '../../components/services/ListeVoiture';

const BASE_URL = 'https://parkapp-pi.vercel.app';

interface Parking {
  id: number;
  nom?: string;
  logo?: string;
}

interface Vehicule {
  id: number;
  marque: string;
  model: string;
  prix: number;
  photos: string[] | string;
  parking?: Parking;
}

const PourVous = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiculesData = await getVehicules();
        setVehicules(vehiculesData);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPhotoUrl = (photos: string[] | string | undefined) => {
    if (!photos) return null;
    const photo = Array.isArray(photos) ? photos[0] : photos;
    return photo.startsWith('http') ? photo : `${BASE_URL}${photo}`;
  };

  const navigateToDetails = (vehicule: Vehicule) => {
    navigation.navigate('CarsDetails', { vehicule });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {vehicules.map((item) => {
        const photoUrl = getPhotoUrl(item.photos);
        const parkingLogoUrl = item.parking?.logo
          ? item.parking.logo.startsWith('http')
            ? item.parking.logo
            : `${BASE_URL}${item.parking.logo}`
          : null;
        const parkingName = item.parking?.nom || 'Parking inconnu';

        return (
          <View key={item.id} style={styles.card}>
            {/* Logo et nom du parking */}
            <View style={styles.parkingHeader}>
              {parkingLogoUrl ? (
                <Image source={{ uri: parkingLogoUrl }} style={styles.parkingLogo} />
              ) : (
                <FontAwesome name="building" size={30} color="gray" />
              )}
              <Text style={styles.parkingName}>{parkingName}</Text>
            </View>

            {/* Image véhicule + infos */}
            <View style={styles.vehiculeContainer}>
              <TouchableOpacity onPress={() => navigateToDetails(item)}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.carImage} />
                ) : (
                  <FontAwesome name="car" size={100} color="gray" />
                )}
              </TouchableOpacity>

              <View style={styles.vehiculeInfo}>
                <Text style={styles.carTitle}>
                  {item.marque} {item.model}
                </Text>
                <Text style={styles.carPrice}>Prix: {item.prix} FCFA</Text>

                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => navigateToDetails(item)}
                >
                  <Text style={styles.infoButtonText}>Infos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    elevation: 3,
  },
  parkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  parkingLogo: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  parkingName: { fontSize: 16, fontWeight: '600' },

  vehiculeContainer: { flexDirection: 'row', alignItems: 'center' },
  carImage: { width: 120, height: 80, borderRadius: 10 },
  vehiculeInfo: { flex: 1, paddingLeft: 15, justifyContent: 'center' },
  carTitle: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
  carPrice: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  infoButton: {
    backgroundColor: 'orange',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  infoButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default PourVous;
