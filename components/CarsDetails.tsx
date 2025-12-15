import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { FontAwesome5, MaterialIcons, Ionicons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { favorisService } from './services/favorisService';
import { viewsService } from './services/viewsService';
import axios from 'axios';
import { createReservationNotification } from './services/Notification';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

interface Marque {
  id: number;
  name: string;
  logoUrl?: string;
  isCustom?: boolean;
}

interface Vehicule {
  id: number;
  marqueRef?: Marque;
  marque?: string;
  model: string;
  prix: number;
  photos: string[] | string;
  dureeGarantie?: number;
  mileage?: number;
  fuelType?: string;
  carteGrise?: boolean;
  assurance?: boolean;
  vignette?: boolean;
  forRent?: boolean;
  forSale?: boolean;
  description?: string;
  stats?: {
    id: number;
    vehicleId: number;
    vues: number;
    reservations: number;
    createdAt: string;
    updatedAt: string;
  };
  parking?: {
    id: number;
    nom: string;
    logo?: string;
  };
  garantie?: boolean;
  chauffeur?: boolean;
  dureeAssurance?: number;
  year?: number;
}

const { width } = Dimensions.get('window');

const PRIMARY_COLOR = '#ff7d00';
const SECONDARY_COLOR = '#2c3e50';
const BACKGROUND_COLOR = '#f8f9fa';
const CARD_BACKGROUND = '#ffffff';

function CarDetailScreen() {
  const route = useRoute<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // États pour la réservation
  const [modalVisible, setModalVisible] = useState(false);
  const [reservationType, setReservationType] = useState<'LOCATION' | 'ACHAT' | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // États pour le favoris
  const [isFavorite, setIsFavorite] = useState(false);

  // Vérifier si c'est le parking qui consulte
  const [isParkingView, setIsParkingView] = useState(false);

  // États pour le menu de modification/suppression
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  const { authState, user } = useAuth();

  // Nouvel état pour les données complètes du véhicule
  const [vehicule, setVehicule] = useState<Vehicule | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  // Parsing initial du véhicule passé en params
  let initialVehicule: Vehicule | null = null;

  if (route.params?.vehicule) {
    try {
      if (typeof route.params.vehicule === 'string') {
        initialVehicule = JSON.parse(route.params.vehicule);
      } else {
        initialVehicule = route.params.vehicule;
      }
    } catch (error) {
      console.error('Erreur parsing véhicule:', error);
    }
  }

  // Vérifier si c'est le parking qui consulte
  useEffect(() => {
    if (route.params?.isParkingView) {
      setIsParkingView(route.params.isParkingView === 'true');
    }
    
    if (authState.role === 'PARKING') {
      setIsParkingView(true);
    }
  }, [route.params, authState.role]);

  // Fetch des détails complets du véhicule via API
  useEffect(() => {
    const fetchFullVehicle = async () => {
      if (!initialVehicule?.id) {
        setVehicule(initialVehicule);
        setLoadingVehicle(false);
        return;
      }
      setLoadingVehicle(true);
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (authState.accessToken) {
          headers.Authorization = `Bearer ${authState.accessToken}`;
        }
        const response = await axios.get(`${BASE_URL}/vehicules/${initialVehicule.id}`, { headers });
        setVehicule(response.data);
      } catch (error) {
        console.error('Erreur lors du fetch des détails véhicule:', error);
        setVehicule(initialVehicule);
      } finally {
        setLoadingVehicle(false);
      }
    };
    fetchFullVehicle();
  }, [initialVehicule?.id, authState.accessToken]);

  // Incrémenter les vues au chargement de la page
  useEffect(() => {
    if (initialVehicule?.id && route.params?.fromParking !== 'true') {
      viewsService.incrementViews(initialVehicule.id);
    }
  }, [initialVehicule?.id, route.params?.fromParking]);

  // Setup notifications
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get permission for notifications!');
        return;
      }
    } else {
      alert('Must use physical device for Notifications');
    }
  }

  async function showLocalNotification(title: string, body: string, data: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  }

  // Fonction pour vérifier l'état favoris
  const checkFavoriteStatus = async () => {
    if (!vehicule?.id || isParkingView) return;
    
    try {
      const favorite = await favorisService.isInFavoris(vehicule.id);
      setIsFavorite(favorite);
    } catch (error) {
      console.error('Erreur vérification favoris:', error);
      setIsFavorite(false);
    }
  };

  useEffect(() => {
    checkFavoriteStatus();
  }, [vehicule?.id, isParkingView]);

  useFocusEffect(
    React.useCallback(() => {
      if (vehicule?.id && !isParkingView) {
        checkFavoriteStatus();
      }
    }, [vehicule?.id, isParkingView])
  );

  const toggleFavorite = async () => {
    if (!vehicule || isParkingView) return;

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    try {
      if (!newFavoriteState) {
        await favorisService.removeFromFavoris(vehicule.id);
      } else {
        await favorisService.addToFavoris(vehicule);
      }
    } catch (error) {
      setIsFavorite(!newFavoriteState);
      console.error('Erreur gestion favoris:', error);
    }
  };

  // Fonction améliorée pour gérer les photos
  const getPhotoUrls = (photos: string[] | string | undefined): string[] => {
    if (!photos) return [];
    
    try {
      if (Array.isArray(photos)) {
        return photos
          .filter(photo => photo && photo !== "" && photo !== null)
          .map(photo => {
            if (photo.startsWith('http')) return photo;
            if (photo.startsWith('file://')) return photo;
            return `${BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
          });
      }
      
      if (typeof photos === 'string') {
        const photoArray = photos.split(',').filter(p => p && p !== "");
        return photoArray.map(photo => {
          if (photo.startsWith('http')) return photo;
          if (photo.startsWith('file://')) return photo;
          return `${BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
        });
      }
      
      return [];
    } catch (error) {
      console.error('Erreur formatage photos:', error);
      return [];
    }
  };

  const photoUrls = getPhotoUrls(vehicule?.photos);

  // Animation de l'image header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (photoUrls.length > 1 && !loadingVehicle) {
      const interval = setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % photoUrls.length;
        setCurrentImageIndex(nextIndex);
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentImageIndex, photoUrls.length, loadingVehicle]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} M FCFA`;
    } else if (price >= 1000) {
      return `${Math.round(price / 1000)} K FCFA`;
    }
    return `${price.toLocaleString()} FCFA`;
  };

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(1)}K km`;
    }
    return `${mileage} km`;
  };

  const getFuelIcon = (fuelType: string | undefined) => {
    switch(fuelType) {
      case 'Essence':
        return <Ionicons name="flame" size={20} color={PRIMARY_COLOR} />;
      case 'Diesel':
        return <FontAwesome5 name="oil-can" size={20} color={PRIMARY_COLOR} />;
      case 'Électrique':
        return <MaterialCommunityIcons name="lightning-bolt" size={20} color={PRIMARY_COLOR} />;
      case 'Hybride':
        return <MaterialCommunityIcons name="leaf" size={20} color={PRIMARY_COLOR} />;
      case 'GPL':
        return <FontAwesome5 name="gas-pump" size={20} color={PRIMARY_COLOR} />;
      default:
        return <FontAwesome5 name="car" size={20} color={PRIMARY_COLOR} />;
    }
  };

  const handleDelete = () => {
    setActionMenuVisible(false);
    if (!vehicule) return;

    Alert.alert(
      "Supprimer le véhicule",
      `Êtes-vous sûr de vouloir supprimer ${vehicule.marqueRef?.name || vehicule.marque || 'Marque'} ${vehicule.model || 'Modèle'} ? Cette action est irréversible.`,
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!vehicule?.id) return;

    try {
      const token = authState.accessToken;
      if (!token) {
        Alert.alert('Erreur', 'Token d\'authentification manquant');
        return;
      }

      setIsLoading(true);
      
      const response = await fetch(`${BASE_URL}/vehicules/${vehicule.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert(
          'Succès ✅',
          'Véhicule supprimé avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/Accueil');
                }
              }
            }
          ]
        );
      } else {
        const errorText = await response.text();
        let errorMessage = 'Erreur lors de la suppression';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Erreur complète suppression:', error);
      Alert.alert('Erreur ❌', error.message || 'Erreur lors de la suppression du véhicule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = () => {
    setActionMenuVisible(false);
    if (!vehicule) return;
    
    const vehicleDataForEdit = {
      id: vehicule.id,
      marque: vehicule.marqueRef ? {
        id: vehicule.marqueRef.id,
        name: vehicule.marqueRef.name,
        logoUrl: vehicule.marqueRef.logoUrl,
        isCustom: vehicule.marqueRef.isCustom
      } : vehicule.marque || '',
      model: vehicule.model,
      prix: vehicule.prix,
      photos: vehicule.photos,
      dureeGarantie: vehicule.dureeGarantie,
      mileage: vehicule.mileage,
      fuelType: vehicule.fuelType,
      carteGrise: vehicule.carteGrise,
      assurance: vehicule.assurance,
      vignette: vehicule.vignette,
      forRent: vehicule.forRent,
      forSale: vehicule.forSale,
      description: vehicule.description,
      garantie: vehicule.garantie,
      chauffeur: vehicule.chauffeur,
      dureeAssurance: vehicule.dureeAssurance,
      year: vehicule.year
    };

    router.push({
      pathname: "/AjoutParking",
      params: { 
        vehicleToEdit: JSON.stringify(vehicleDataForEdit),
        mode: 'edit'
      }
    } as any);
  };

  if (loadingVehicle || !vehicule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Chargement des détails du véhicule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderFeatureItem = (icon: React.ReactNode, label: string, value: any, condition: boolean = true) => {
    if (!condition) return null;
    
    const displayValue = value === undefined || value === null || value === '' 
      ? 'Non spécifié' 
      : (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value);
    
    return (
      <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
          {icon}
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={styles.featureLabel}>{label}</Text>
          <Text style={[
            styles.featureValue,
            (value === undefined || value === null || value === '') && styles.unknownValue
          ]}>
            {displayValue}
          </Text>
        </View>
      </View>
    );
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image 
        source={{ uri: item }} 
        style={styles.carImage} 
        resizeMode="cover"
        onError={(error) => console.log('Erreur chargement image:', error.nativeEvent.error)}
      />
    </View>
  );

  const renderPagination = () => {
    if (photoUrls.length <= 1) return null;
    return (
      <View style={styles.pagination}>
        {photoUrls.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.paginationDot, 
              index === currentImageIndex && styles.paginationDotActive
            ]} 
          />
        ))}
      </View>
    );
  };

  const handleReservePress = () => {
    if (isParkingView) return;
    setModalVisible(true);
  };

  const selectType = (type: 'LOCATION' | 'ACHAT') => {
    setReservationType(type);
    if (type === 'ACHAT') {
      setStartDate(null);
      setEndDate(null);
    } else {
      const today = new Date();
      setStartDate(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEndDate(tomorrow);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate && selectedDate >= endDate) {
        const newEnd = new Date(selectedDate);
        newEnd.setDate(newEnd.getDate() + 1);
        setEndDate(newEnd);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate && startDate && selectedDate > startDate) {
      setEndDate(selectedDate);
    } else if (selectedDate) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début');
    }
  };

  const confirmReservation = async () => {
    if (!reservationType) return Alert.alert('Erreur', 'Sélectionnez un type de réservation');
    if (reservationType === 'LOCATION' && (!startDate || !endDate)) {
      return Alert.alert('Erreur', 'Les dates sont requises pour la location');
    }
    if (reservationType === 'LOCATION' && !vehicule.forRent) {
      return Alert.alert('Erreur', 'Ce véhicule n\'est pas disponible à la location');
    }
    if (reservationType === 'ACHAT' && !vehicule.forSale) {
      return Alert.alert('Erreur', 'Ce véhicule n\'est pas disponible à l\'achat');
    }

    const token = authState.accessToken;
    if (!token) {
      return Alert.alert(
        'Connexion requise', 
        'Vous devez vous connecter pour réserver ce véhicule',
        [{ text: 'OK', style: 'cancel' }]
      );
    }

    setIsLoading(true);

    try {
      const body = {
        vehicleId: vehicule.id,
        dateDebut: reservationType === 'LOCATION' ? startDate?.toISOString() : null,
        dateFin: reservationType === 'LOCATION' ? endDate?.toISOString() : null,
        type: reservationType,
      };

      const response = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: 'Erreur réseau ou serveur' };
        }
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const newReservation = await response.json();

      // Notification locale
      try {
        await showLocalNotification(
          "🎉 Réservation confirmée !",
          `Votre ${reservationType.toLowerCase()} de ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''} est confirmée.`,
          {
            type: 'RESERVATION_CONFIRMATION',
            vehicleId: vehicule.id,
            reservationType: reservationType
          }
        );
      } catch (notificationError) {
        console.warn('⚠️ Notification locale échouée:', notificationError);
      }

      // Notification au parking
      if (vehicule?.parking?.id) {
        try {
          const userInfo = user || { prenom: 'Utilisateur', nom: '', id: 0 };
          
          const parkingMessage = `${userInfo.prenom} ${userInfo.nom} a réservé ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''} pour ${reservationType.toLowerCase()}. Prix: ${vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : ''}`;

          await createReservationNotification({
            title: "🚗 NOUVELLE RÉSERVATION !",
            message: parkingMessage,
            parkingId: vehicule.parking.id,
            type: "RESERVATION"
          });
        } catch (notificationError) {
          console.error("❌ Erreur notification parking:", notificationError);
        }
      }

      Alert.alert(
        'Succès 🎉', 
        `Réservation ${reservationType.toLowerCase()} confirmée !\n\nLe parking a été notifié de votre réservation.`,
        [{ text: 'OK', onPress: () => {
          setModalVisible(false);
        }}]
      );
      
    } catch (error: any) {
      console.error('❌ Erreur réservation:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionMenu = () => {
    if (!isParkingView) return null;

    return (
      <View style={styles.actionMenuContainer}>
        <TouchableOpacity 
          style={styles.actionMenuButton}
          onPress={() => setActionMenuVisible(true)}
        >
          <Feather name="more-vertical" size={24} color={SECONDARY_COLOR} />
        </TouchableOpacity>

        <Modal
          transparent
          visible={actionMenuVisible}
          animationType="fade"
          onRequestClose={() => setActionMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.actionMenuOverlay}
            activeOpacity={1}
            onPress={() => setActionMenuVisible(false)}
          >
            <View style={styles.actionMenuContent}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleModify}
              >
                <Feather name="edit-2" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.menuItemText}>Modifier</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FF4444" />
                ) : (
                  <>
                    <Feather name="trash-2" size={20} color="#FF4444" />
                    <Text style={[styles.menuItemText, styles.deleteText]}>Supprimer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[
        styles.headerOverlay,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        {/* {!isParkingView && (
          <TouchableOpacity 
            style={styles.headerFavoriteButton}
            onPress={toggleFavorite}
          >
            <FontAwesome 
              name="heart" 
              size={20} 
              color={isFavorite ? "#FF3B30" : "#fff"} 
              solid={isFavorite}
            />
          </TouchableOpacity>
        )} */}
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          {photoUrls.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={photoUrls}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(newIndex);
                }}
              />
              {renderPagination()}
              
              {/* Image counter */}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {photoUrls.length}
                </Text>
              </View>
            </>
          ) : (
            <View style={[styles.imageContainer, styles.placeholderImage]}>
              <FontAwesome5 name="car" size={60} color="#ddd" />
              <Text style={styles.noImageText}>Aucune photo disponible</Text>
            </View>
          )}
        </View>

        {/* Header Card with Floating Design */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <View style={styles.titleRow}>
              <Text style={styles.carName}>
                {vehicule.marqueRef?.name || vehicule.marque || 'Marque'} {vehicule.model || 'Modèle'}
              </Text>
              {!isParkingView && (
                <TouchableOpacity 
                  style={styles.floatingFavoriteButton}
                  onPress={toggleFavorite}
                >
                  <FontAwesome 
                    name="heart" 
                    size={20} 
                    color={isFavorite ? "#FF3B30" : "#ccc"} 
                    solid={isFavorite}
                  />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.priceValue}>{formatPrice(vehicule.prix)}</Text>
            
            {/* Badges */}
            <View style={styles.badgesContainer}>
              {vehicule.year && (
                <View style={styles.badge}>
                  <Ionicons name="calendar" size={12} color="#fff" />
                  <Text style={styles.badgeText}>{vehicule.year}</Text>
                </View>
              )}
              {vehicule.mileage && (
                <View style={styles.badge}>
                  <Feather name="activity" size={12} color="#fff" />
                  <Text style={styles.badgeText}>{formatMileage(vehicule.mileage)}</Text>
                </View>
              )}
              {vehicule.fuelType && (
                <View style={styles.badge}>
                  {getFuelIcon(vehicule.fuelType)}
                  <Text style={styles.badgeText}>{vehicule.fuelType}</Text>
                </View>
              )}
            </View>

            {/* Transaction Type Badges */}
            <View style={styles.transactionContainer}>
              {vehicule.forSale && (
                <View style={[styles.transactionBadge, styles.saleBadge]}>
                  <FontAwesome5 name="tag" size={12} color="#fff" />
                  <Text style={styles.transactionBadgeText}>À vendre</Text>
                </View>
              )}
              {vehicule.forRent && (
                <View style={[styles.transactionBadge, styles.rentBadge]}>
                  <FontAwesome5 name="clock" size={12} color="#fff" />
                  <Text style={styles.transactionBadgeText}>En location</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Info Cards */}
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoRow}>
            <View style={styles.quickInfoCard}>
              <Ionicons name="shield-checkmark" size={24} color="#28a745" />
              <Text style={styles.quickInfoLabel}>Garantie</Text>
              <Text style={styles.quickInfoValue}>
                {vehicule.dureeGarantie ? `${vehicule.dureeGarantie} mois` : 'Non incluse'}
              </Text>
            </View>
            <View style={styles.quickInfoCard}>
              <Feather name="file-text" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.quickInfoLabel}>Assurance</Text>
              <Text style={styles.quickInfoValue}>
                {vehicule.assurance ? 'Incluse' : 'Non incluse'}
              </Text>
            </View>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Caractéristiques</Text>
            {renderActionMenu()}
          </View>
          
          <View style={styles.featuresGrid}>
            {renderFeatureItem(
              <Ionicons name="calendar" size={24} color={PRIMARY_COLOR} />,
              'Année',
              vehicule.year,
              !!vehicule.year
            )}
            
            {renderFeatureItem(
              <Feather name="activity" size={24} color={PRIMARY_COLOR} />,
              'Kilométrage',
              vehicule.mileage ? formatMileage(vehicule.mileage) : null,
              vehicule.mileage !== undefined
            )}
            
            {renderFeatureItem(
              getFuelIcon(vehicule.fuelType),
              'Carburant',
              vehicule.fuelType,
              !!vehicule.fuelType
            )}
            
            {renderFeatureItem(
              <FontAwesome5 name="user-tie" size={22} color={PRIMARY_COLOR} />,
              'Chauffeur',
              vehicule.chauffeur,
              vehicule.chauffeur !== undefined
            )}
            
            {renderFeatureItem(
              <MaterialCommunityIcons name="license" size={24} color={PRIMARY_COLOR} />,
              'Carte Grise',
              vehicule.carteGrise,
              vehicule.carteGrise !== undefined
            )}
            
            {renderFeatureItem(
              <Ionicons name="document-text" size={24} color={PRIMARY_COLOR} />,
              'Vignette',
              vehicule.vignette,
              vehicule.vignette !== undefined
            )}
          </View>
        </View>

        {/* Description */}
        {vehicule.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>{vehicule.description}</Text>
          </View>
        )}

        {/* Stats */}
        {vehicule.stats && (
          <View style={styles.statsCard}>
            <View style={styles.sectionHeader}>
              <Feather name="bar-chart-2" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.sectionTitle}>Statistiques</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 125, 0, 0.1)' }]}>
                  <Feather name="eye" size={20} color={PRIMARY_COLOR} />
                </View>
                <Text style={styles.statValue}>{vehicule.stats.vues || 0}</Text>
                <Text style={styles.statLabel}>Vues</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <Feather name="calendar" size={20} color="#34C759" />
                </View>
                <Text style={styles.statValue}>{vehicule.stats.reservations || 0}</Text>
                <Text style={styles.statLabel}>Réservations</Text>
              </View>
            </View>
          </View>
        )}

        {/* Parking Info */}
        {/* {vehicule.parking && (
          <View style={styles.parkingCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.sectionTitle}>Parking</Text>
            </View>
            <View style={styles.parkingInfo}>
              <View style={styles.parkingLogoContainer}>
                {vehicule.parking.logo ? (
                  <Image 
                    source={{ uri: vehicule.parking.logo.startsWith('http') ? vehicule.parking.logo : `${BASE_URL}${vehicule.parking.logo}` }}
                    style={styles.parkingLogo}
                  />
                ) : (
                  <View style={styles.parkingLogoPlaceholder}>
                    <Ionicons name="business" size={24} color={PRIMARY_COLOR} />
                  </View>
                )}
              </View>
              <Text style={styles.parkingName}>{vehicule.parking.nom}</Text>
            </View>
          </View>
        )} */}

        {/* Spacer for FAB */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      {!isParkingView && (
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.fabButton}
            onPress={handleReservePress}
          >
            <FontAwesome5 name="calendar-check" size={20} color="#fff" />
            <Text style={styles.fabText}>Réserver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reservation Modal */}
      {!isParkingView && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Réserver ce véhicule</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={SECONDARY_COLOR} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Type de réservation</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[styles.typeButton, reservationType === 'ACHAT' && styles.typeButtonSelected]}
                    onPress={() => selectType('ACHAT')}
                  >
                    <FontAwesome5 
                      name="shopping-cart" 
                      size={20} 
                      color={reservationType === 'ACHAT' ? '#fff' : PRIMARY_COLOR} 
                    />
                    <Text style={[styles.typeButtonText, reservationType === 'ACHAT' && styles.typeButtonTextSelected]}>
                      Achat
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, reservationType === 'LOCATION' && styles.typeButtonSelected]}
                    onPress={() => selectType('LOCATION')}
                  >
                    <FontAwesome5 
                      name="calendar-alt" 
                      size={20} 
                      color={reservationType === 'LOCATION' ? '#fff' : PRIMARY_COLOR} 
                    />
                    <Text style={[styles.typeButtonText, reservationType === 'LOCATION' && styles.typeButtonTextSelected]}>
                      Location
                    </Text>
                  </TouchableOpacity>
                </View>

                {reservationType === 'LOCATION' && (
                  <View style={styles.dateSection}>
                    <View style={styles.dateRow}>
                      <View style={styles.dateInput}>
                        <Text style={styles.dateLabel}>Date de début</Text>
                        <TouchableOpacity 
                          style={styles.dateButton}
                          onPress={() => setShowStartPicker(true)}
                        >
                          <Feather name="calendar" size={18} color="#666" />
                          <Text style={styles.dateButtonText}>
                            {startDate ? startDate.toLocaleDateString('fr-FR') : 'Sélectionner'}
                          </Text>
                        </TouchableOpacity>
                        {showStartPicker && (
                          <DateTimePicker
                            value={startDate || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onStartDateChange}
                            minimumDate={new Date()}
                          />
                        )}
                      </View>
                      <View style={styles.dateInput}>
                        <Text style={styles.dateLabel}>Date de fin</Text>
                        <TouchableOpacity 
                          style={styles.dateButton}
                          onPress={() => setShowEndPicker(true)}
                        >
                          <Feather name="calendar" size={18} color="#666" />
                          <Text style={styles.dateButtonText}>
                            {endDate ? endDate.toLocaleDateString('fr-FR') : 'Sélectionner'}
                          </Text>
                        </TouchableOpacity>
                        {showEndPicker && (
                          <DateTimePicker
                            value={endDate || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onEndDateChange}
                            minimumDate={startDate ? new Date(startDate.getTime() + 86400000) : new Date()}
                          />
                        )}
                      </View>
                    </View>
                    <View style={styles.chauffeurMessageCard}>
                      <FontAwesome5 name="user-tie" size={20} color={PRIMARY_COLOR} />
                      <Text style={styles.chauffeurMessageText}>
                        Note : La location inclut un chauffeur fourni par le parking.
                      </Text>
                    </View>
                  </View>
                )}

                {reservationType && (
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                      <Ionicons name="information-circle" size={20} color={PRIMARY_COLOR} />
                      <Text style={styles.summaryTitle}>Récapitulatif</Text>
                    </View>
                    <Text style={styles.summaryText}>
                      {reservationType === 'ACHAT' 
                        ? `Achat de ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''} pour ${formatPrice(vehicule.prix)}`
                        : `Location de ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''}`
                      }
                    </Text>
                  </View>
                )}

                <View style={styles.notificationCard}>
                  <Ionicons name="notifications" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.notificationText}>
                    Une confirmation de réservation vous sera envoyée
                  </Text>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.confirmButton, 
                    (!reservationType || (reservationType === 'LOCATION' && (!startDate || !endDate))) && styles.confirmButtonDisabled
                  ]} 
                  onPress={confirmReservation}
                  disabled={!reservationType || (reservationType === 'LOCATION' && (!startDate || !endDate)) || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>
                        Confirmer 
                        {/* {reservationType === 'ACHAT' ? 'l\'achat' : 'la location'} */}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1,
    backgroundColor: BACKGROUND_COLOR
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: SECONDARY_COLOR,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerFavoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageGalleryContainer: {
    height: 300,
    backgroundColor: '#000',
  },
  imageContainer: {
    width: width,
    height: 300,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImageText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: PRIMARY_COLOR,
    width: 20,
  },
  imageCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 24,
    marginTop: -20,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  headerCardContent: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
    flex: 1,
  },
  floatingFavoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY_COLOR,
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginLeft: 4,
  },
  transactionContainer: {
    flexDirection: 'row',
  },
  transactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  saleBadge: {
    backgroundColor: '#34C759',
  },
  rentBadge: {
    backgroundColor: '#007AFF',
  },
  transactionBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickInfoContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginTop: 4,
  },
  featuresCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 24,
    margin: 16,
    marginTop: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SECONDARY_COLOR,
    marginLeft: 8,
  },
  actionMenuContainer: {
    marginLeft: 'auto',
  },
  actionMenuButton: {
    padding: 8,
    borderRadius: 20,
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuContent: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 16,
    padding: 8,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: '#FF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: '600',
    color: SECONDARY_COLOR,
  },
  unknownValue: {
    fontStyle: 'italic',
    color: '#999',
  },
  descriptionCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 24,
    margin: 16,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 24,
    margin: 16,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: SECONDARY_COLOR,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
  },
  parkingCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 24,
    margin: 16,
    marginTop: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parkingLogoContainer: {
    marginRight: 16,
  },
  parkingLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  parkingLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: SECONDARY_COLOR,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: CARD_BACKGROUND,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SECONDARY_COLOR,
  },
  modalBody: {
    padding: 24,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#fff',
    marginHorizontal: 6,
  },
  typeButtonSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 6,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    marginLeft: 12,
    flex: 1,
  },
  chauffeurMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  chauffeurMessageText: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    marginLeft: 12,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  notificationText: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    marginLeft: 12,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    marginLeft: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ffb366',
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default CarDetailScreen;