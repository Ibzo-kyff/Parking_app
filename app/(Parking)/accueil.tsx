import Header from '../Header';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// 🔹 Types
type Voiture = {
  createdAt: string | number | Date;
  id: string;
  marque: string;
  model: string;
  photos: string[];
  status: string;
  stats: {
    vues: number;
    reservations: number;
    favoris: number;
    reservationsActives: number;
  };
  nextReservation?: {
    type: string;
    date: string;
    client: string;
  };
  marqueRef: {
    id: number;
    name: string;
    logoUrl: string;
  };
};

type ParkingData = {
  parking: {
    id: string;
    name: string;
    address: string;
    phone: string;
    logo: string | null;
  };
  statistics: {
    total: number;
    vendus: number;
    enLocation: number;
    disponibles: number;
    enMaintenance: number;
    indisponibles: number;
    totalVues: number;
    totalReservations: number;
    totalFavoris: number;
    reservationsActives: number;
    monthlySales: number;
    monthlyRentals: number;
  };
  vehicles: Voiture[];
  charts: {
    monthlyData: {
      labels: string[];
      sales: number[];
      rentals: number[];
    };
    statusDistribution: {
      labels: string[];
      data: number[];
    };
  };
  filters: {
    currentStatus: string;
    currentSearch: string;
  };
};

const AccueilParking = () => {
  const { authState, refreshAuth } = useAuth();
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const fetchParkingData = async (isRetry = false) => {
    try {
      const response = await axios.get('http://192.168.1.24:5000/api/vehicules/parking/management', {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      });
      
      // Préfixer les URLs des photos sans ajouter de doublon
      const dataWithFixedPhotos = {
        ...response.data,
        vehicles: response.data.vehicles.map((v: Voiture) => ({
          ...v,
          photos: v.photos.map((photo: string) =>
            photo.startsWith('http') ? photo : `https://parkapp-pi.vercel.app${photo}`
          ),
        })),
      };
      setParkingData(dataWithFixedPhotos);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403 && !isRetry && retryCount < 2) {
        const success = await refreshAuth();
        if (success) {
          setRetryCount(prev => prev + 1);
          await fetchParkingData(true);
          return;
        }
      }
      
      setError('Erreur lors de la récupération des données du parking');
      console.error('Erreur API:', err);
      
      if (err.response?.status === 403) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.',
          [
            {
              text: 'Se reconnecter',
              onPress: () => {
                router.replace('/(auth)/LoginScreen');
              }
            }
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.accessToken) {
      fetchParkingData();
    } else {
      setError('Aucun token d\'authentification disponible');
      setLoading(false);
    }
  }, [authState.accessToken]);

  // 🔹 Navigation / actions
  const handleAjouterVoiture = () => router.navigate('/(ParkingDetail)/AjoutParking');
  const handleHistorique = () => router.navigate('/historique');
  const handleVoirTout = () => router.navigate('/voitures/populaires');

  const handleSelectMarque = (marque: string) => {
    router.push(`/voitures/marque/${marque}`);
  };

  const handleSelectVoiture = (voiture: Voiture) => {
    router.push(`/voitures/details/${voiture.id}`);
  };

  // 🔹 Renders
  const renderVoitureItem = ({ item }: { item: Voiture }) => (
    <TouchableOpacity style={styles.voitureCard} onPress={() => handleSelectVoiture(item)}>
      <Image
        source={{ uri: item.photos[0] || 'https://via.placeholder.com/100x70' }}
        style={styles.voitureImage}
      />
      <Text style={styles.voitureText}>{item.marque} {item.model}</Text>
    </TouchableOpacity>
  );

  const renderMarqueItem = ({ item }: { item: { id: number; name: string; logoUrl: string } }) => (
    <TouchableOpacity style={styles.marqueCard} onPress={() => handleSelectMarque(item.name)}>
      <Image
        source={{ uri: item.logoUrl || 'https://via.placeholder.com/40x40' }}
        style={styles.marqueLogo}
      />
      <Text style={styles.marqueNom}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <Header />
        <ActivityIndicator size="large" color="#FD6A00" style={{ marginTop: 50 }} />
      </View>
    );
  }

  if (error || !parkingData) {
    return (
      <View style={styles.mainContainer}>
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Aucune donnée disponible'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchParkingData();
            }}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Trier les véhicules par vues pour les "plus vus"
  const voituresPopulaires = [...parkingData.vehicles]
    .sort((a, b) => (b.stats?.vues || 0) - (a.stats?.vues || 0))
    .slice(0, 3);

  // Trier par date de création pour les "récemment ajoutées"
  const voituresRecentes = [...parkingData.vehicles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Extraire les marques distinctes avec leurs logos
  const marques = [...new Set(parkingData.vehicles.map(v => v.marqueRef))]
    .filter((marque): marque is { id: number; name: string; logoUrl: string } => marque !== null)
    .slice(0, 5); // Limiter à 5 marques

  return (
    <View style={styles.mainContainer}>
      {/* Header fixe */}
      <Header />
      
      {/* Contenu scrollable */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color="#888" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchPlaceholder}
            placeholder="Rechercher une voiture..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => console.log("Filtre cliqué")}>
            <Ionicons name="filter" size={24} color="#FD6A00" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>

        {/* Carousel Marques */}
        <View style={styles.marquesSection}>
          <Text style={styles.sectionTitle}>Marques</Text>
          <FlatList
            data={marques}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderMarqueItem}
          />
        </View>

        {/* Carousel voitures récentes */}
        <View style={styles.recentesSection}>
          <Text style={styles.sectionTitle}>Récemment ajoutées</Text>
          <View style={{ height: 200 }}>
            <Swiper autoplay autoplayTimeout={3} showsPagination={true} dotColor="#ccc" activeDotColor="#FD6A00">
              {voituresRecentes.map((v) => (
                <TouchableOpacity key={v.id} style={styles.recentCard} onPress={() => handleSelectVoiture(v)}>
                  <Image
                    source={{ uri: v.photos[0] || 'https://via.placeholder.com/100x150' }}
                    style={styles.recentImage}
                  />
                  <Text style={styles.recentText}>{v.marque} {v.model}</Text>
                </TouchableOpacity>
              ))}
            </Swiper>
          </View>
        </View>

        {/* Populaires */}
        <View style={styles.populairesSection}>
          <View style={styles.populairesHeader}>
            <Text style={styles.sectionTitle}>Voitures les plus vues</Text>
            <TouchableOpacity onPress={handleVoirTout}>
              <Text style={styles.voirTout}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={voituresPopulaires}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderVoitureItem}
          />
        </View>

        {/* Statistiques */}
        <View style={styles.statsSection}>
          <TouchableOpacity style={styles.quickLink} onPress={handleAjouterVoiture}>
            <Ionicons name="add-circle" size={24} color="#FD6A00" />
            <Text style={styles.quickLinkText}>Ajouter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickLink} onPress={() => router.navigate('/voitures/vendues')}>
            <Ionicons name="car-sport" size={24} color="#FD6A00" />
            <Text style={styles.quickLinkText}>Vendues</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickLink} onPress={() => router.navigate('/voitures/louees')}>
            <Ionicons name="time" size={24} color="#FD6A00" />
            <Text style={styles.quickLinkText}>Louées</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// 🔹 Styles (inchangés)
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 25,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: { 
    color: '#888', 
    fontSize: 16, 
    flex: 1 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#FD6A00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marquesSection: { 
    marginHorizontal: 16, 
    marginBottom: 20 
  },
  marqueCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: 10,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  marqueLogo: { 
    width: 40, 
    height: 40, 
    resizeMode: 'contain', 
    marginBottom: 5 
  },
  marqueNom: { 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  recentesSection: { 
    marginHorizontal: 16, 
    marginBottom: 20 
  },
  recentCard: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  recentImage: { 
    width: '100%', 
    height: 150, 
    borderRadius: 8 
  },
  recentText: { 
    marginTop: 5, 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333' 
  },
  populairesSection: { 
    marginHorizontal: 16, 
    marginBottom: 20 
  },
  populairesHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  voirTout: { 
    fontSize: 14, 
    color: '#FD6A00', 
    fontWeight: 'bold' 
  },
  voitureCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 10,
    width: 140,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  voitureImage: { 
    width: 100, 
    height: 70, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  voitureText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333', 
    textAlign: 'center' 
  },
  quickLink: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  quickLinkText: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
});

export default AccueilParking;