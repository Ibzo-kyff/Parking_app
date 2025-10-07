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
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../Header';
import { getVehicules, getParkings, API_URL } from "../../components/services/accueil"; 
import { router } from 'expo-router';

type RootStackParamList = {
  Accueil: { firstName?: string; lastName?: string };
  tousLesMarques: undefined;
  pourVous: undefined;
};

type AccueilRouteProp = RouteProp<RootStackParamList, 'Accueil'>;

const Accueil: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AccueilRouteProp>();

  // ✅ states
  const [vehicules, setVehicules] = useState<any[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);
  const [marques, setMarques] = useState<any[]>([]);
  const [loadingVehicules, setLoadingVehicules] = useState(true);
  const [loadingParkings, setLoadingParkings] = useState(true);
  const [loadingMarques, setLoadingMarques] = useState(true);

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
      scrollViewRef.current?.scrollTo({ x: nextIndex * 300, animated: true });
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
      // Navigation vers l'écran de détails avec les informations du véhicule
      router.push({
        pathname: '/(Clients)/CreateListingScreen',
        params: { vehicule: JSON.stringify(selectedVehicule) }
      });
    } else {
      console.log(`Pressed on ${type} image at index: ${index}`);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.searchBarContainer}>
        <FontAwesome name="search" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchBar}
          placeholder="Recherche..."
          placeholderTextColor="#999"
        />
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
            snapToInterval={320} 
            snapToAlignment="center" 
            decelerationRate="fast" 
            contentContainerStyle={{
              paddingHorizontal: 10,
            }}
          >
            {parkings.map((item, index) => (
              <View key={item.id || index} style={styles.carouselItem}>
                <Image 
                  source={{ 
                    uri: item.logo 
                      ? item.logo.startsWith('http') 
                        ? item.logo
                        : `${API_URL}${item.logo}`
                      : 'https://via.placeholder.com/150'
                  }} 
                  style={styles.carouselImage} 
                />
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
                            : `${API_URL}${item.photos[0]}` 
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f3f3', padding: 20 },
  scrollViewContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginBottom: 20,
    marginTop: 25,
  },
  searchIcon: { marginRight: 10 },
  searchBar: { flex: 1 },
 carouselContainer: {
    height: 150,
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
    width: 320, 
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2, 
  },
  carouselImage: { 
    width: '100%',
    height: 130, 
    resizeMode: 'cover', 
    borderRadius: 10,
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