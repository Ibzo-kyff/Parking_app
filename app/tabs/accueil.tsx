import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../Header';
import { getVehicules, getParkings } from "../../components/services/accueil";
import Constants from 'expo-constants';
import { router } from 'expo-router';

type RootStackParamList = {
  Accueil: { firstName?: string; lastName?: string };
  tousLesMarques: undefined;
  pourVous: undefined;
  parkingDetails: { parking: string }; // Ajouté pour typer la navigation (optionnel si non utilisé)
};

type AccueilRouteProp = RouteProp<RootStackParamList, 'Accueil'>;

const Accueil: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AccueilRouteProp>();

  //  states
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);
  const [marques, setMarques] = useState<any[]>([]);
  const [loadingVehicules, setLoadingVehicules] = useState(true);
  const [loadingParkings, setLoadingParkings] = useState(true);
  const [loadingMarques, setLoadingMarques] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
  useEffect(() => {
    const fetchVehicules = async () => {
      try {
        const data = await getVehicules();
        setVehicules(data);
      } catch (error) {
        console.error("Erreur véhicules :", error);
      } finally {
        setLoadingVehicules(false);
      }
    };
    fetchVehicules();
  }, []);
  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      router.push({
        pathname: '/(Clients)/listVoiture',
        params: { selectedMarque: searchQuery.trim() } 
      });
    }
  };


  const handleSubmit = () => {
    handleSearch();
  };
  useEffect(() => {
    const fetchParkings = async () => {
      try {
        const data = await getParkings();
        setParkings(data);
      } catch (error) {
        console.error("Erreur parkings :", error);
      } finally {
        setLoadingParkings(false);
      }
    };
    fetchParkings();
  }, []);

  useEffect(() => {
    try {
      const images = [
        { source: require("../../assets/images/mercede.png"), name: "Mercedes" },
        { source: require("../../assets/images/kia.jpg"), name: "Kia" },
        { source: require("../../assets/images/renault.png"), name: "Renault" },
        { source: require("../../assets/images/toyota.jpg"), name: "Toyota" },
        { source: require("../../assets/images/audi.png"), name: "Audi" },
      ];
      setMarques(images);
    } catch (error) {
      console.error("Erreur marques locales :", error);
    } finally {
      setLoadingMarques(false);
    }
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const pourVousScrollRef = useRef<ScrollView>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPourVousIndex, setCurrentPourVousIndex] = useState(0);

  useEffect(() => {
    if (parkings.length === 0) return;
    const intervalId = setInterval(() => {
      const nextIndex = (currentIndex + 1) % parkings.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * 340, animated: true });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [currentIndex, parkings]);

  useEffect(() => {
    if (vehicules.length === 0) return;
    const intervalId = setInterval(() => {
      const nextIndex = (currentPourVousIndex + 1) % vehicules.length;
      setCurrentPourVousIndex(nextIndex);
      pourVousScrollRef.current?.scrollTo({ x: nextIndex * 180, animated: true });
    }, 3000);
    return () => clearInterval(intervalId);
  }, [currentPourVousIndex, vehicules]);

  const handleImagePress = (index: number, type: string) => {
    if (type === 'vehicule') {
      const selectedVehicule = vehicules[index];
      router.push({
        pathname: '/(Clients)/CreateListingScreen',
        params: { vehicule: JSON.stringify(selectedVehicule) }
      });
    } else if (type === 'marque') {
      const selectedMarque = marques[index];
      router.push({
        pathname: '/(Clients)/listVoiture',
        params: { selectedMarque: selectedMarque.name }
      });
    }
  };

  const handleParkingPress = (index: number) => {
    const selectedParking = parkings[index];
    router.push({
      pathname: '/(Clients)/parkingDetails', // Adaptez ce chemin à votre route réelle
      params: { parking: JSON.stringify(selectedParking) }
    });
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.mainScrollView}> {/* Nouveau ScrollView pour rendre la page scrollable */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <FontAwesome name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un modèle..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSubmit} // Valide avec Entrée
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <FontAwesome name="times-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            {/* Bouton filtre (ouvre les filtres avancés dans ListVoiture) */}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => router.push('/(Clients)/listVoiture')} // On va directement à la liste pour utiliser les filtres
            >
              <MaterialIcons name="filter-list" size={28} color="#ff7d00" />
            </TouchableOpacity>
          </View>
        </View>
      <View style={styles.carouselContainer}>
  {loadingParkings ? (
    <ActivityIndicator size="large" color="#FD6A00" />
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      ref={scrollViewRef}
      style={styles.carouselScrollView}
      scrollEventThrottle={16}
      pagingEnabled
      snapToInterval={340}
      snapToAlignment="center"
      decelerationRate="fast"
      contentContainerStyle={{
        paddingHorizontal: 10,
      }}
    >
      {parkings.map((item, index) => (
        <View
          key={item.id || index}
          style={styles.carouselItem}
        >
          <Image
            source={{
              uri: item.logo
                ? item.logo.startsWith('http')
                  ? item.logo
                  : `${BASE_URL}${item.logo}`
                : 'https://via.placeholder.com/150'
            }}
            style={styles.carouselImage}
          />

          <View style={styles.carouselOverlay}>
            <Text style={styles.carouselLabel}>
              {item.name || 'Nouveau Parking'}
            </Text>
            {item.promotion && (
              <Text style={styles.carouselPromo}>
                {item.promotion}
              </Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  )}
</View>

        <View style={styles.scrollContainer}>
          <View style={styles.scrollSection}>
            <View style={styles.scrollTitleContainer}>
              <Text style={styles.scrollTitle}>Nos marques</Text>
              <TouchableOpacity onPress={() => router.replace('(Clients)/tousLesMarques')}>
                <Text style={styles.seeAllButton}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {loadingMarques ? (
              <ActivityIndicator size="large" color="#FD6A00" />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
                contentContainerStyle={styles.scrollViewContent}
              >
                {marques.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageContainer}
                    onPress={() => handleImagePress(index, 'marque')}
                  >
                    <View style={styles.imageWrapper}>
                      <Image source={item.source} style={styles.scrollImage} />
                    </View>
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageLabel}>{item.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.scrollTitleContainer}>
              <Text style={styles.scrollTitle}>Pour vous</Text>
              <TouchableOpacity onPress={() => router.push('/(Clients)/listVoiture')}>
                <Text style={styles.seeAllButton}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {loadingVehicules ? (
              <ActivityIndicator size="large" color="#FD6A00" />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                ref={pourVousScrollRef}
                style={styles.imageScrollView}
                contentContainerStyle={styles.scrollViewContent}
              >
                {vehicules.map((item, index) => (
                  <TouchableOpacity
                    key={item.id || index}
                    style={styles.imageContainerLarge}
                    onPress={() => handleImagePress(index, 'vehicule')}
                  >
                    <View style={styles.imageWrapperLarge}>
                      <Image
                        source={{
                          uri: item.photos && item.photos.length > 0
                            ? item.photos[0].startsWith('http')
                              ? item.photos[0]
                              : `${BASE_URL}${item.photos[0]}`
                            : "https://via.placeholder.com/150"
                        }}
                        style={styles.scrollImageLarge}
                      />
                    </View>
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageLabel}>{item.marque}</Text>
                      <Text style={styles.imagePrix}>{item.prix} FCFA</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f3f3', padding: 20 },
  mainScrollView: { flex: 1 }, 
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  searchSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderTopWidth: 1,
    // borderBottomColor: '#e0e0e0',
    // borderTopColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1d1d1f',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 8,
  },
  carouselContainer: {
    height: 200, 
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 0,
  },
  carouselScrollView: {
    flex: 1,
  },
  carouselItem: {
    width: 340, 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9', 
  },
  carouselImage: {
    width: '100%',
    height: 180, 
    resizeMode: 'cover',
    borderRadius: 10,
  },
  carouselOverlay: { 
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  carouselLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselPromo: {
    color: '#FD6A00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  seeAllButton: { fontSize: 14, color: '#FD6A00', fontWeight: 'bold' },
  scrollContainer: { paddingBottom: 0, paddingTop: 20 },
  scrollSection: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginTop: -22,
  },
  scrollTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  scrollTitle: { fontSize: 18, color: 'black', fontWeight: 'bold' },
  imageScrollView: { marginTop: 0, marginBottom: 20 },
  imageContainer: {
    width: 100,
    padding: 5,
    marginTop: 10,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#F4F3F3',
  },
  imageContainerLarge: {
    width: 160,
    padding: 5,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#F4F3F3',
  },
  imageWrapper: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageWrapperLarge: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
  },
  scrollImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  scrollImageLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  imageOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5
  },
  imageLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5
  },
  imagePrix: {
    color: '#000',
    fontSize: 12,
    marginTop: 2
  }
});

export default Accueil;