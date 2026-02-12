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
  TextInput,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { FontAwesome5, MaterialIcons, Ionicons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { favorisService } from './services/favorisService';
import { viewsService } from './services/viewsService';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
interface Marque {
  id: number;
  name: string;
  logoUrl?: string;
  isCustom?: boolean;
}
interface Parking {
  id: number;
  name?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
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
  transmission?: string;
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
  parking?: Parking;
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
// Motifs de location disponibles
const MOTIFS_LOCATION = [
  { id: 'voyage', label: 'Voyage', icon: 'plane' },
  { id: 'mariage', label: 'Mariage', icon: 'heart' },
  { id: 'mission', label: 'Mission professionnelle', icon: 'briefcase' },
  { id: 'tourisme', label: 'Tourisme', icon: 'camera' },
  { id: 'personnel', label: 'Usage personnel', icon: 'user' },
  { id: 'autre', label: 'Autre', icon: 'more-horizontal' },
];
// Localisations disponibles
const LOCALISATIONS = [
  { id: 'bamako', label: 'À Bamako' },
  { id: 'hors_bamako', label: 'Hors Bamako' },
];
function CarDetailScreen() {
  const route = useRoute<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  // États pour la réservation
  const [modalVisible, setModalVisible] = useState(false);
  const [reservationType, setReservationType] = useState<'LOCATION' | 'ACHAT' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalPayVisible, setModalPayVisible] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
 
  // Nouveaux états pour motif et localisation
  const [selectedMotif, setSelectedMotif] = useState<string | null>(null);
  const [selectedLocalisation, setSelectedLocalisation] = useState<string | null>(null);
  const [autreMotif, setAutreMotif] = useState('');
  const [conditionsAccepted, setConditionsAccepted] = useState(false);
 
  // États pour le favoris
  const [isFavorite, setIsFavorite] = useState(false);
  // Vérifier si c'est le parking qui consulte
  const [isParkingView, setIsParkingView] = useState(false);
  // États pour le menu de modification/suppression
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const { authState, user } = useAuth();
  const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
 
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
  // NOUVEAUX ÉTATS POUR LA RÉSERVATION AVEC HEURES
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState<'start' | 'end' | null>(null);
  const [dateTimeMode, setDateTimeMode] = useState<'date' | 'time'>('date');
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [showDurationModal, setShowDurationModal] = useState(false);
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
  // Initialiser les dates au chargement du véhicule
  useEffect(() => {
    if (vehicule?.prix) {
      const now = new Date();
      const defaultStart = new Date(now);
      defaultStart.setHours(8, 0, 0, 0); // Début à 8h par défaut
     
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultEnd.getDate() + 1); // Fin le lendemain à 8h
     
      setStartDateTime(defaultStart);
      setEndDateTime(defaultEnd);
      setCalculatedPrice(vehicule.prix); // Prix pour 1 jour par défaut
    }
  }, [vehicule?.prix]);
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
  async function showLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        ...(data !== undefined ? { data } : {}),
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
  // Format de prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
  // Fonction pour naviguer vers la page du parking
  const navigateToParking = () => {
    if (vehicule?.parking) {
      router.push({
        pathname: '/(Clients)/parkingDetails',
        params: { parking: JSON.stringify(vehicule.parking) }
      });
    }
  };
  const handleReservePress = () => {
    if (isParkingView) return;
    setModalVisible(true);
  };
  const selectType = (type: 'LOCATION' | 'ACHAT') => {
    setReservationType(type);
    setSelectedMotif(null);
    setSelectedLocalisation(null);
    setAutreMotif('');
    setConditionsAccepted(false);
   
    if (type === 'ACHAT') {
      setStartDateTime(null);
      setEndDateTime(null);
    } else {
      // Initialiser les dates pour la location
      const now = new Date();
      const defaultStart = new Date(now);
      defaultStart.setHours(8, 0, 0, 0);
     
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultEnd.getDate() + 1);
     
      setStartDateTime(defaultStart);
      setEndDateTime(defaultEnd);
     
      if (vehicule?.prix) {
        setCalculatedPrice(vehicule.prix);
      }
    }
  };
  // Fonction pour calculer la durée et le prix
  const calculateDurationAndPrice = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24); // Arrondi au jour supérieur
   
    setSelectedDays(diffDays);
   
    if (vehicule?.prix) {
      const dailyPrice = vehicule.prix;
      const calculatedPrice = diffDays * dailyPrice;
      setCalculatedPrice(calculatedPrice);
    }
   
    return { diffDays, diffHours };
  };
  // Fonction pour gérer le changement de date/heure
  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate || !showDateTimePicker) return;
   
    const newDate = new Date(selectedDate);
   
    if (showDateTimePicker === 'start') {
      // Si on modifie l'heure de début, ajuster l'heure de fin
      const currentEnd = endDateTime || new Date();
      const newEnd = new Date(currentEnd);
     
      if (dateTimeMode === 'date') {
        // Si changement de date, garder la même heure
        newEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
       
        // Vérifier que la date de fin n'est pas avant la date de début
        if (newEnd.getTime() <= newDate.getTime()) {
          newEnd.setDate(newDate.getDate() + 1);
        }
      } else {
        // Si changement d'heure, mettre à jour l'heure
        const hoursDiff = newEnd.getHours() - (startDateTime?.getHours() || 8);
        newEnd.setHours(newDate.getHours() + hoursDiff, newDate.getMinutes(), 0, 0);
      }
     
      setStartDateTime(newDate);
      setEndDateTime(newEnd);
      calculateDurationAndPrice(newDate, newEnd);
     
    } else if (showDateTimePicker === 'end') {
      // Pour la fin, vérifier qu'elle est après le début
      if (startDateTime && newDate.getTime() > startDateTime.getTime()) {
        setEndDateTime(newDate);
        calculateDurationAndPrice(startDateTime, newDate);
      } else {
        Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      }
    }
   
    if (Platform.OS !== 'ios') {
      setShowDateTimePicker(null);
    }
  };
  const getIconForMotif = (motifId: string) => {
    const motif = MOTIFS_LOCATION.find(m => m.id === motifId);
    if (!motif) return <Feather name="help-circle" size={20} color={PRIMARY_COLOR} />;
   
    switch(motif.icon) {
      case 'plane': return <FontAwesome name="plane" size={20} color={PRIMARY_COLOR} />;
      case 'heart': return <Feather name="heart" size={20} color={PRIMARY_COLOR} />;
      case 'briefcase': return <Feather name="briefcase" size={20} color={PRIMARY_COLOR} />;
      case 'camera': return <Feather name="camera" size={20} color={PRIMARY_COLOR} />;
      case 'user': return <Feather name="user" size={20} color={PRIMARY_COLOR} />;
      default: return <Feather name="more-horizontal" size={20} color={PRIMARY_COLOR} />;
    }
  };
  const confirmReservation = async () => {
    if (!reservationType) return Alert.alert('Erreur', 'Sélectionnez un type de réservation');
   
    // Validation pour location
    if (reservationType === 'LOCATION') {
      if (!startDateTime || !endDateTime) {
        return Alert.alert('Erreur', 'Les dates sont requises pour la location');
      }
     
      // Vérifier que la fin est après le début
      if (endDateTime.getTime() <= startDateTime.getTime()) {
        return Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      }
     
      // Vérifier que la durée est d'au moins 1 heure
      const diffHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      if (diffHours < 1) {
        return Alert.alert('Erreur', 'La location doit être d\'au moins 1 heure');
      }
     
      if (!selectedMotif) {
        return Alert.alert('Erreur', 'Veuillez sélectionner un motif de location');
      }
     
      if (!selectedLocalisation) {
        return Alert.alert('Erreur', 'Veuillez sélectionner une localisation');
      }
     
      if (!conditionsAccepted) {
        return Alert.alert('Erreur', 'Veuillez accepter les conditions générales');
      }
     
      // Guard against vehicule being null before accessing forRent
      if (!vehicule || !vehicule.forRent) {
        return Alert.alert('Erreur', 'Ce véhicule n\'est pas disponible à la location');
      }
    }
   
    // Validation pour achat
    if (reservationType === 'ACHAT') {
      if (!vehicule || !vehicule.forSale) {
        return Alert.alert('Erreur', 'Ce véhicule n\'est pas disponible à l\'achat');
      }
    }
    const token = authState.accessToken;
    if (!token) {
      return Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour réserver ce véhicule',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
    // Déterminer le motif
    let motifFinal = null;
    if (reservationType === 'LOCATION') {
      if (selectedMotif === 'autre') {
        motifFinal = autreMotif.trim();
        if (!motifFinal) {
          return Alert.alert('Erreur', 'Veuillez préciser votre motif');
        }
      } else {
        const motifObj = MOTIFS_LOCATION.find(m => m.id === selectedMotif);
        motifFinal = motifObj ? motifObj.label : selectedMotif;
      }
    }
    // Convertir la localisation en majuscules
    const localisationFinal = reservationType === 'LOCATION'
      ? (selectedLocalisation === 'bamako' ? 'BAMAKO' : 'HORS_BAMAKO')
      : null;
    // Créer l'objet réservation temporaire avec le prix calculé
        const tempReservation = {
          vehicleId: vehicule!.id,
          dateDebut: reservationType === 'LOCATION' ? startDateTime?.toISOString() : null,
          dateFin: reservationType === 'LOCATION' ? endDateTime?.toISOString() : null,
          type: reservationType,
          motifLocation: motifFinal,
          localisation: localisationFinal,
          conditionsAcceptees: reservationType === 'LOCATION' ? conditionsAccepted : null,
          vehicule: vehicule,
          montant: reservationType === 'LOCATION' ? calculatedPrice : (vehicule?.prix ?? 0)
        };
    console.log('📝 Réservation temporaire:', tempReservation);
    // Stocker temporairement la réservation
    setCurrentReservation(tempReservation);
   
    // Ouvrir directement le modal de paiement
    setModalPayVisible(true);
    setModalVisible(false);
  };
  const processPayment = async (paymentMethod: string) => {
    if (!currentReservation || !vehicule) {
      Alert.alert('Erreur', 'Informations de réservation manquantes');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const token = authState.accessToken;
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }
      // Créer la réservation sur le serveur
      const reservationBody = {
        vehicleId: currentReservation.vehicleId,
        dateDebut: currentReservation.dateDebut,
        dateFin: currentReservation.dateFin,
        type: currentReservation.type,
        motifLocation: currentReservation.motifLocation,
        localisation: currentReservation.localisation,
        conditionsAcceptees: currentReservation.conditionsAcceptees,
      };
      console.log('📤 Envoi réservation:', reservationBody);
      const reservationResponse = await fetch(`${BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reservationBody),
      });
      if (!reservationResponse.ok) {
        const errorText = await reservationResponse.text();
        console.error('❌ Erreur réponse serveur:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: 'Erreur lors de la création de la réservation' };
        }
        throw new Error(errorData.message || `Erreur ${reservationResponse.status}`);
      }
      const newReservation = await reservationResponse.json();
      console.log('✅ Réservation créée:', newReservation);
      // Créer le paiement associé
      const paymentBody = {
        reservationId: newReservation.id,
        montant: currentReservation.montant,
        methodePaiement: paymentMethod,
        statut: paymentMethod === 'ESPECES' ? 'EN_ATTENTE' : 'COMPLETE',
      };
      const paymentResponse = await fetch(`${BASE_URL}/paiements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentBody),
      });
      if (!paymentResponse.ok) {
        console.warn('⚠️ Paiement non enregistré mais réservation créée');
      }
      // Afficher confirmation
      const message = paymentMethod === 'ESPECES'
        ? 'Votre réservation est confirmée !\n\nLe parking vous contactera bientôt pour organiser le paiement en espèces et la remise du véhicule.'
        : 'Votre réservation et paiement sont confirmés !';
      Alert.alert(
        'Succès 🎉',
        message,
        [{
          text: 'Terminer',
          onPress: () => {
            setModalPayVisible(false);
            setModalVisible(false);
            setCurrentReservation(null);
            setSelectedMotif(null);
            setSelectedLocalisation(null);
            setAutreMotif('');
            setConditionsAccepted(false);
          }
        }]
      );
      // Envoyer notification
      await showLocalNotification(
        'Réservation confirmée',
        `Votre ${currentReservation.type.toLowerCase()} de véhicule a été enregistrée`,
        { reservationId: newReservation.id }
      );
    } catch (error: any) {
      console.error('❌ Erreur lors du traitement:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la confirmation',
        [{
          text: 'Réessayer',
          onPress: () => setIsProcessingPayment(false)
        }, {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {
            setModalPayVisible(false);
            setCurrentReservation(null);
            setIsProcessingPayment(false);
          }
        }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };
  useEffect(() => {
    if (vehicule) {
      if (vehicule.forSale && !vehicule.forRent && !reservationType) {
        setReservationType('ACHAT');
      } else if (vehicule.forRent && !vehicule.forSale && !reservationType) {
        setReservationType('LOCATION');
      }
    }
  }, [vehicule, reservationType]);
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
              <MaterialCommunityIcons name="cog-transfer" size={24} color={PRIMARY_COLOR} />,
              'Boîte de vitesse',
              vehicule.transmission,
              !!vehicule.transmission
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
        {/* Carte pour le parking propriétaire */}
        {vehicule.parking && (
          <TouchableOpacity
            style={styles.parkingCard}
            onPress={navigateToParking}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <MaterialIcons name="local-parking" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.sectionTitle}>Parking</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevronIcon} />
            </View>
           
            <View style={styles.parkingInfo}>
              {vehicule.parking.logo ? (
                <Image
                  source={{ uri: vehicule.parking.logo.startsWith('http') ? vehicule.parking.logo : `${BASE_URL}${vehicule.parking.logo}` }}
                  style={styles.parkingLogo}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.parkingLogoPlaceholder}>
                  <MaterialIcons name="local-parking" size={24} color={PRIMARY_COLOR} />
                </View>
              )}
             
              <View style={styles.parkingDetails}>
                <Text style={styles.parkingName}>{vehicule.parking.name || 'Parking'}</Text>
                {vehicule.parking.address && (
                  <View style={styles.parkingDetailRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.parkingDetailText} numberOfLines={1}>
                      {vehicule.parking.address}
                    </Text>
                  </View>
                )}
              </View>
            </View>
           
            <Text style={styles.viewParkingText}>Voir les détails du parking →</Text>
          </TouchableOpacity>
        )}
        {/* Spacer for FAB */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
      {/* Floating Action Button */}
      {!isParkingView && (
        <View style={styles.fabContainer}>
          {/* Si véhicule uniquement en vente */}
          {vehicule.forSale && !vehicule.forRent && (
            <TouchableOpacity
              style={[styles.fabButton, styles.fabSaleButton]}
              onPress={() => {
                setReservationType('ACHAT');
                handleReservePress();
              }}
            >
              <FontAwesome5 name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.fabText}>Acheter</Text>
            </TouchableOpacity>
          )}
         
          {/* Si véhicule uniquement en location */}
          {vehicule.forRent && !vehicule.forSale && (
            <TouchableOpacity
              style={[styles.fabButton, styles.fabRentButton]}
              onPress={() => {
                setReservationType('LOCATION');
                handleReservePress();
              }}
            >
              <FontAwesome5 name="calendar-check" size={20} color="#fff" />
              <Text style={styles.fabText}>Louer</Text>
            </TouchableOpacity>
          )}
         
          {/* Si véhicule en vente ET location */}
          {vehicule.forSale && vehicule.forRent && (
            <TouchableOpacity
              style={styles.fabButton}
              onPress={handleReservePress}
            >
              <FontAwesome5 name="calendar-check" size={20} color="#fff" />
              <Text style={styles.fabText}>Réserver</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {/* Modal pour sélection de durée */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDurationModal}
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.durationModalOverlay}>
          <View style={styles.durationModalContent}>
            <View style={styles.durationModalHeader}>
              <Text style={styles.durationModalTitle}>Durée de location</Text>
              <TouchableOpacity onPress={() => setShowDurationModal(false)}>
                <Ionicons name="close" size={24} color={SECONDARY_COLOR} />
              </TouchableOpacity>
            </View>
           
            <View style={styles.durationModalBody}>
              <View style={styles.durationOptions}>
                {[1, 2, 3, 4, 5, 6, 7, 14, 30].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.durationOption,
                      selectedDays === days && styles.durationOptionSelected
                    ]}
                    onPress={() => {
                      if (startDateTime && vehicule?.prix) {
                        const newEnd = new Date(startDateTime);
                        newEnd.setDate(newEnd.getDate() + days);
                        setEndDateTime(newEnd);
                        setSelectedDays(days);
                        setCalculatedPrice(vehicule.prix * days);
                        setShowDurationModal(false);
                      }
                    }}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      selectedDays === days && styles.durationOptionTextSelected
                    ]}>
                      {days} {days === 1 ? 'jour' : 'jours'}
                    </Text>
                    {vehicule?.prix && (
                      <Text style={[
                        styles.durationOptionPrice,
                        selectedDays === days && styles.durationOptionPriceSelected
                      ]}>
                        {formatPrice(vehicule.prix * days)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
             
              <TouchableOpacity
                style={styles.customDurationButton}
                onPress={() => setShowDurationModal(false)}
              >
                <Feather name="edit-2" size={18} color={PRIMARY_COLOR} />
                <Text style={styles.customDurationButtonText}>
                  Personnaliser les dates
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
                <Text style={styles.modalTitle}>
                  {vehicule.forSale && !vehicule.forRent ? 'Acheter ce véhicule' :
                   vehicule.forRent && !vehicule.forSale ? 'Louer ce véhicule' :
                   'Réserver ce véhicule'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={SECONDARY_COLOR} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Afficher seulement le type correspondant ou les deux si les deux options sont disponibles */}
                  {(vehicule.forSale && vehicule.forRent) && (
                    <>
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
                    </>
                  )}
                  {/* Section pour la location seulement */}
                  {reservationType === 'LOCATION' && (
                    <>
                      {/* Section Dates simplifiée */}
                      <View style={styles.dateSection}>
                        <View style={styles.dateSectionHeader}>
                          <Text style={styles.sectionLabel}>Dates de location *</Text>
                          <TouchableOpacity
                            style={styles.durationButton}
                            onPress={() => setShowDurationModal(true)}
                          >
                            <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
                            <Text style={styles.durationButtonText}>
                              {selectedDays} {selectedDays === 1 ? 'jour' : 'jours'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                       
                        {/* Ligne unique pour date de début */}
                        <View style={styles.simpleDateRow}>
                          <View style={styles.simpleDateInput}>
                            <Text style={styles.dateLabel}>Date de début</Text>
                            <TouchableOpacity
                              style={styles.simpleDateButton}
                              onPress={() => {
                                setShowDateTimePicker('start');
                                setDateTimeMode('date');
                              }}
                            >
                              <Feather name="calendar" size={16} color="#666" />
                              <Text style={styles.simpleDateButtonText}>
                                {startDateTime ? startDateTime.toLocaleDateString('fr-FR') : 'JJ/MM/AAAA'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                         
                          <View style={styles.simpleTimeInput}>
                            <Text style={styles.dateLabel}>Heure</Text>
                            <TouchableOpacity
                              style={styles.simpleDateButton}
                              onPress={() => {
                                setShowDateTimePicker('start');
                                setDateTimeMode('time');
                              }}
                            >
                              <Feather name="clock" size={16} color="#666" />
                              <Text style={styles.simpleDateButtonText}>
                                {startDateTime ? startDateTime.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '--:--'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                       
                        {/* Ligne unique pour date de fin */}
                        <View style={[styles.simpleDateRow, { marginTop: 12 }]}>
                          <View style={styles.simpleDateInput}>
                            <Text style={styles.dateLabel}>Date de fin</Text>
                            <TouchableOpacity
                              style={styles.simpleDateButton}
                              onPress={() => {
                                setShowDateTimePicker('end');
                                setDateTimeMode('date');
                              }}
                            >
                              <Feather name="calendar" size={16} color="#666" />
                              <Text style={styles.simpleDateButtonText}>
                                {endDateTime ? endDateTime.toLocaleDateString('fr-FR') : 'JJ/MM/AAAA'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                         
                          <View style={styles.simpleTimeInput}>
                            <Text style={styles.dateLabel}>Heure</Text>
                            <TouchableOpacity
                              style={styles.simpleDateButton}
                              onPress={() => {
                                setShowDateTimePicker('end');
                                setDateTimeMode('time');
                              }}
                            >
                              <Feather name="clock" size={16} color="#666" />
                              <Text style={styles.simpleDateButtonText}>
                                {endDateTime ? endDateTime.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '--:--'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                       
                        {/* DateTimePicker */}
                        {showDateTimePicker && (
                          <DateTimePicker
                            value={
                              showDateTimePicker === 'start'
                                ? (startDateTime || new Date())
                                : (endDateTime || new Date())
                            }
                            mode={dateTimeMode}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateTimeChange}
                            minimumDate={showDateTimePicker === 'end' ? (startDateTime ?? undefined) : new Date()}
                            minuteInterval={30}
                          />
                        )}
                       
                        {/* Résumé de durée et prix */}
                        {startDateTime && endDateTime && (
                          <View style={styles.durationSummary}>
                            <View style={styles.durationSummaryItem}>
                              <Feather name="clock" size={14} color="#666" />
                              <Text style={styles.durationSummaryLabel}>Durée :</Text>
                              <Text style={styles.durationSummaryValue}>
                                {selectedDays} {selectedDays === 1 ? 'jour' : 'jours'}
                              </Text>
                            </View>
                           
                            {vehicule?.prix && (
                              <View style={styles.durationSummaryItem}>
                                <Feather name="dollar-sign" size={14} color="#666" />
                                <Text style={styles.durationSummaryLabel}>Prix total :</Text>
                                <Text style={[styles.durationSummaryValue, { color: PRIMARY_COLOR, fontWeight: 'bold' }]}>
                                  {formatPrice(calculatedPrice)}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      {/* Motif de location */}
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Motif de location *</Text>
                        <View style={styles.motifsGrid}>
                          {MOTIFS_LOCATION.map((motif) => (
                            <TouchableOpacity
                              key={motif.id}
                              style={[
                                styles.motifButton,
                                selectedMotif === motif.id && styles.motifButtonSelected
                              ]}
                              onPress={() => {
                                setSelectedMotif(motif.id);
                                if (motif.id !== 'autre') {
                                  setAutreMotif('');
                                }
                              }}
                            >
                              <View style={[
                                styles.motifIconContainer,
                                selectedMotif === motif.id && styles.motifIconContainerSelected
                              ]}>
                                {getIconForMotif(motif.id)}
                              </View>
                              <Text style={[
                                styles.motifLabel,
                                selectedMotif === motif.id && styles.motifLabelSelected
                              ]}>
                                {motif.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                       
                        {/* Champ pour autre motif */}
                        {selectedMotif === 'autre' && (
                          <View style={styles.autreMotifContainer}>
                            <TextInput
                              style={styles.autreMotifInput}
                              placeholder="Précisez votre motif..."
                              value={autreMotif}
                              onChangeText={setAutreMotif}
                              maxLength={100}
                            />
                          </View>
                        )}
                      </View>
                      {/* Localisation */}
                      <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Localisation *</Text>
                        <View style={styles.localisationContainer}>
                          {LOCALISATIONS.map((loc) => (
                            <TouchableOpacity
                              key={loc.id}
                              style={[
                                styles.localisationButton,
                                selectedLocalisation === loc.id && styles.localisationButtonSelected
                              ]}
                              onPress={() => setSelectedLocalisation(loc.id)}
                            >
                              <Ionicons
                                name="location-outline"
                                size={20}
                                color={selectedLocalisation === loc.id ? '#fff' : PRIMARY_COLOR}
                              />
                              <Text style={[
                                styles.localisationLabel,
                                selectedLocalisation === loc.id && styles.localisationLabelSelected
                              ]}>
                                {loc.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      {/* Conditions générales */}
                      <View style={styles.conditionsSection}>
                        <TouchableOpacity
                          style={styles.conditionsCheckbox}
                          onPress={() => setConditionsAccepted(!conditionsAccepted)}
                        >
                          <View style={[
                            styles.checkbox,
                            conditionsAccepted && styles.checkboxChecked
                          ]}>
                            {conditionsAccepted && (
                              <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                          </View>
                          <Text style={styles.conditionsLabel}>
                            J'accepte les conditions générales de location *
                          </Text>
                        </TouchableOpacity>
                       
                        {/* Détails des conditions */}
                        <View style={styles.conditionsDetails}>
                          <Text style={styles.conditionsTitle}>Conditions générales :</Text>
                          <View style={styles.conditionItem}>
                            <Feather name="check-circle" size={16} color="#28a745" />
                            <Text style={styles.conditionText}>
                              Le client prend en charge les frais d'essence
                            </Text>
                          </View>
                          <View style={styles.conditionItem}>
                            <Feather name="check-circle" size={16} color="#28a745" />
                            <Text style={styles.conditionText}>
                              Maximum 5 personnes dans le véhicule
                            </Text>
                          </View>
                          <View style={styles.conditionItem}>
                            <Feather name="check-circle" size={16} color="#28a745" />
                            <Text style={styles.conditionText}>
                              Véhicule doit être retourné dans l'état initial
                            </Text>
                          </View>
                          <View style={styles.conditionItem}>
                            <Feather name="check-circle" size={16} color="#28a745" />
                            <Text style={styles.conditionText}>
                              Interdiction formelle de fumer dans le véhicule
                            </Text>
                          </View>
                          <View style={styles.conditionItem}>
                            <Feather name="check-circle" size={16} color="#28a745" />
                            <Text style={styles.conditionText}>
                              Chauffeur professionnel inclus
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
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
                      {reservationType === 'LOCATION' && startDateTime && endDateTime && (
                        <>
                          <Text style={styles.summaryDetail}>
                            Du {startDateTime.toLocaleDateString('fr-FR')} à {startDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <Text style={styles.summaryDetail}>
                            Au {endDateTime.toLocaleDateString('fr-FR')} à {endDateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <Text style={styles.summaryPrice}>
                            {selectedDays} {selectedDays === 1 ? 'jour' : 'jours'} • {formatPrice(calculatedPrice)}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                  <View style={styles.notificationCard}>
                    <Ionicons name="notifications" size={20} color={PRIMARY_COLOR} />
                    <Text style={styles.notificationText}>
                      Veuillez choisir un mode de paiement pour confirmer la réservation
                    </Text>
                  </View>
                </ScrollView>
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
                    (!reservationType ||
                      (reservationType === 'LOCATION' &&
                        (!startDateTime || !endDateTime || !selectedMotif || !selectedLocalisation || !conditionsAccepted))) &&
                    styles.confirmButtonDisabled
                  ]}
                  onPress={confirmReservation}
                  disabled={!reservationType ||
                    (reservationType === 'LOCATION' &&
                      (!startDateTime || !endDateTime || !selectedMotif || !selectedLocalisation || !conditionsAccepted)) ||
                    isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>
                        {reservationType === 'ACHAT' ? 'Acheter' : 'Payer'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
     
      {/* Modal de Paiement */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalPayVisible}
        onRequestClose={() => setModalPayVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choix du paiement</Text>
              <TouchableOpacity onPress={() => setModalPayVisible(false)}>
                <Ionicons name="close" size={24} color={SECONDARY_COLOR} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {/* Section récapitulative */}
              {currentReservation && (
                <View style={styles.reservationSummaryCard}>
                  <Text style={styles.reservationSummaryTitle}>Récapitulatif de la réservation</Text>
                  <View style={styles.reservationDetailRow}>
                    <Text style={styles.reservationDetailLabel}>Véhicule :</Text>
                    <Text style={styles.reservationDetailValue}>
                      {currentReservation.vehicule?.marqueRef?.name || currentReservation.vehicule?.marque || 'Marque'} {currentReservation.vehicule?.model || 'Modèle'}
                    </Text>
                  </View>
                  {currentReservation.type === 'LOCATION' && (
                    <>
                      <View style={styles.reservationDetailRow}>
                        <Text style={styles.reservationDetailLabel}>Dates :</Text>
                        <Text style={styles.reservationDetailValue}>
                          {currentReservation.dateDebut ? new Date(currentReservation.dateDebut).toLocaleDateString('fr-FR') + ' ' +
                           new Date(currentReservation.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          {' au '}
                          {currentReservation.dateFin ? new Date(currentReservation.dateFin).toLocaleDateString('fr-FR') + ' ' +
                           new Date(currentReservation.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                      {currentReservation.motifLocation && (
                        <View style={styles.reservationDetailRow}>
                          <Text style={styles.reservationDetailLabel}>Motif :</Text>
                          <Text style={styles.reservationDetailValue}>
                            {currentReservation.motifLocation}
                          </Text>
                        </View>
                      )}
                      {currentReservation.localisation && (
                        <View style={styles.reservationDetailRow}>
                          <Text style={styles.reservationDetailLabel}>Localisation :</Text>
                          <Text style={styles.reservationDetailValue}>
                            {currentReservation.localisation === 'BAMAKO' ? 'À Bamako' : 'Hors Bamako'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  <View style={styles.reservationDetailRow}>
                    <Text style={styles.reservationDetailLabel}>Montant :</Text>
                    <Text style={[styles.reservationDetailValue, { color: PRIMARY_COLOR, fontWeight: 'bold' }]}>
                      {formatPrice(currentReservation.montant)}
                    </Text>
                  </View>
                </View>
              )}
              <Text style={styles.paymentSubtitle}>
                Sélectionnez votre mode de paiement pour confirmer la réservation
              </Text>
              {/* Option Espèces - Disponible */}
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={async () => {
                  await processPayment('ESPECES');
                }}
                disabled={isProcessingPayment}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentIconContainer}>
                    <FontAwesome5 name="money-bill-wave" size={28} color="#28a745" />
                  </View>
                  <View style={styles.paymentTextContainer}>
                    <Text style={styles.paymentOptionTitle}>Espèces</Text>
                    <Text style={styles.paymentOptionDesc}>Paiement en main propre lors de la remise</Text>
                  </View>
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#28a745" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                  )}
                </View>
              </TouchableOpacity>
              {/* Option Orange Money - Verrouillée */}
              <View style={[styles.paymentOption, styles.paymentOptionDisabled]}>
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentIconContainer}>
                    <FontAwesome5 name="mobile-alt" size={28} color="#999" />
                  </View>
                  <View style={styles.paymentTextContainer}>
                    <Text style={styles.paymentOptionTitle}>Orange Money</Text>
                    <Text style={styles.paymentOptionDesc}>Bientôt disponible</Text>
                  </View>
                  <MaterialIcons name="lock" size={24} color="#999" />
                </View>
              </View>
              {/* Option Wave - Verrouillée */}
              <View style={[styles.paymentOption, styles.paymentOptionDisabled]}>
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentIconContainer}>
                    <FontAwesome5 name="wave-square" size={28} color="#999" />
                  </View>
                  <View style={styles.paymentTextContainer}>
                    <Text style={styles.paymentOptionTitle}>Wave</Text>
                    <Text style={styles.paymentOptionDesc}>Bientôt disponible</Text>
                  </View>
                  <MaterialIcons name="lock" size={24} color="#999" />
                </View>
              </View>
              {isProcessingPayment && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <Text style={styles.processingText}>Confirmation en cours...</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  parkingCard: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 24,
    margin: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8f4ff',
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  parkingLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  parkingLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  parkingDetails: {
    flex: 1,
  },
  parkingName: {
    fontSize: 18,
    fontWeight: '700',
    color: SECONDARY_COLOR,
    marginBottom: 6,
  },
  parkingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  parkingDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  viewParkingText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'right',
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
    flex: 1,
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
  fabSaleButton: {
    // specific style for "Acheter" button; kept same primary color for consistency
    backgroundColor: PRIMARY_COLOR,
  },
  fabRentButton: {
    // specific style for "Louer" button; kept same primary color for consistency
    backgroundColor: PRIMARY_COLOR,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Nouveaux styles pour la sélection de durée
  durationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  durationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  durationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
  },
  durationModalBody: {
    paddingVertical: 10,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  durationOption: {
    width: '48%',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: PRIMARY_COLOR + '10',
    borderColor: PRIMARY_COLOR,
  },
  durationOptionText: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    marginBottom: 4,
  },
  durationOptionTextSelected: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
  },
  durationOptionPrice: {
    fontSize: 14,
    color: '#666',
  },
  durationOptionPriceSelected: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  customDurationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR + '05',
  },
  customDurationButtonText: {
    marginLeft: 8,
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  durationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: PRIMARY_COLOR + '10',
    borderRadius: 8,
  },
  durationButtonText: {
    marginHorizontal: 6,
    color: PRIMARY_COLOR,
    fontWeight: '500',
    fontSize: 14,
  },
  simpleDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  simpleDateInput: {
    flex: 2,
  },
  simpleTimeInput: {
    flex: 1,
    marginLeft: 10,
  },
  simpleDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  simpleDateButtonText: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
  },
  durationSummary: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
  },
  durationSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  durationSummaryLabel: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    color: '#666',
  },
  durationSummaryValue: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    fontWeight: '500',
  },
  summaryDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    marginTop: 8,
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
    maxHeight: 500,
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 12,
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
  motifsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  motifButton: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  motifButtonSelected: {
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    borderColor: PRIMARY_COLOR,
  },
  motifIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 125, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  motifIconContainerSelected: {
    backgroundColor: '#fff',
  },
  motifLabel: {
    fontSize: 12,
    color: SECONDARY_COLOR,
    textAlign: 'center',
  },
  motifLabelSelected: {
    color: PRIMARY_COLOR,
    fontWeight: '600',
  },
  autreMotifContainer: {
    marginTop: 8,
  },
  autreMotifInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: SECONDARY_COLOR,
  },
  localisationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  localisationButton: {
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
  localisationButtonSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  localisationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },
  localisationLabelSelected: {
    color: '#fff',
  },
  conditionsSection: {
    marginBottom: 24,
  },
  conditionsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_COLOR,
  },
  conditionsLabel: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    flex: 1,
  },
  conditionsDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  conditionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 12,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
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
  paymentSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentOption: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentOptionDisabled: {
    opacity: 0.6,
    backgroundColor: '#f8f9fa',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    marginRight: 16,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SECONDARY_COLOR,
  },
  paymentOptionDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  processingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  reservationSummaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reservationSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SECONDARY_COLOR,
    marginBottom: 12,
    textAlign: 'center',
  },
  reservationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reservationDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  reservationDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: SECONDARY_COLOR,
  },
});

export default CarDetailScreen; 

// import React, { useState, useRef, useEffect } from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   TouchableOpacity,
//   FlatList,
//   Dimensions,
//   Modal,
//   Platform,
//   Alert,
//   Animated,
// } from 'react-native';
// import { useRoute, useFocusEffect } from '@react-navigation/native';
// import { router } from 'expo-router';
// import { FontAwesome5, MaterialIcons, Ionicons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import Constants from 'expo-constants';
// import { useAuth } from '../context/AuthContext';
// import { favorisService } from './services/favorisService';
// import { viewsService } from './services/viewsService';
// import axios from 'axios';
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';

// interface Marque {
//   id: number;
//   name: string;
//   logoUrl?: string;
//   isCustom?: boolean;
// }

// interface Parking {
//   id: number;
//   name?: string;
//   logo?: string;
//   address?: string;
//   phone?: string;
//   email?: string;
// }

// interface Vehicule {
//   id: number;
//   marqueRef?: Marque;
//   marque?: string;
//   model: string;
//   prix: number;
//   photos: string[] | string;
//   dureeGarantie?: number;
//   mileage?: number;
//   transmission?: string;
//   fuelType?: string;
//   carteGrise?: boolean;
//   assurance?: boolean;
//   vignette?: boolean;
//   forRent?: boolean;
//   forSale?: boolean;
//   description?: string;
//   stats?: {
//     id: number;
//     vehicleId: number;
//     vues: number;
//     reservations: number;
//     createdAt: string;
//     updatedAt: string;
//   };
//   parking?: Parking;
//   garantie?: boolean;
//   chauffeur?: boolean;
//   dureeAssurance?: number;
//   year?: number;
// }

// const { width } = Dimensions.get('window');

// const PRIMARY_COLOR = '#ff7d00';
// const SECONDARY_COLOR = '#2c3e50';
// const BACKGROUND_COLOR = '#f8f9fa';
// const CARD_BACKGROUND = '#ffffff';

// function CarDetailScreen() {
//   const route = useRoute<any>();
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const flatListRef = useRef<FlatList>(null);
//   const scrollY = useRef(new Animated.Value(0)).current;

//   // États pour la réservation
//   const [modalVisible, setModalVisible] = useState(false);
//   const [reservationType, setReservationType] = useState<'LOCATION' | 'ACHAT' | null>(null);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [showStartPicker, setShowStartPicker] = useState(false);
//   const [showEndPicker, setShowEndPicker] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [modalPayVisible, setModalPayVisible] = useState(false);
//   const [currentReservation, setCurrentReservation] = useState<{
//     vehicleId: number;
//     dateDebut: string | null;
//     dateFin: string | null;
//     type: 'LOCATION' | 'ACHAT';
//     montant: number;
//     vehicule: Vehicule;
//   } | null>(null);
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);
//   // États pour le favoris
//   const [isFavorite, setIsFavorite] = useState(false);

//   // Vérifier si c'est le parking qui consulte
//   const [isParkingView, setIsParkingView] = useState(false);

//   // États pour le menu de modification/suppression
//   const [actionMenuVisible, setActionMenuVisible] = useState(false);

//   const { authState, user } = useAuth();
//   const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
  
//   // Nouvel état pour les données complètes du véhicule
//   const [vehicule, setVehicule] = useState<Vehicule | null>(null);
//   const [loadingVehicle, setLoadingVehicle] = useState(true);

//   // Parsing initial du véhicule passé en params
//   let initialVehicule: Vehicule | null = null;

//   if (route.params?.vehicule) {
//     try {
//       if (typeof route.params.vehicule === 'string') {
//         initialVehicule = JSON.parse(route.params.vehicule);
//       } else {
//         initialVehicule = route.params.vehicule;
//       }
//     } catch (error) {
//       console.error('Erreur parsing véhicule:', error);
//     }
//   }

//   // Vérifier si c'est le parking qui consulte
//   useEffect(() => {
//     if (route.params?.isParkingView) {
//       setIsParkingView(route.params.isParkingView === 'true');
//     }
    
//     if (authState.role === 'PARKING') {
//       setIsParkingView(true);
//     }
//   }, [route.params, authState.role]);

//   // Fetch des détails complets du véhicule via API
//   useEffect(() => {
//     const fetchFullVehicle = async () => {
//       if (!initialVehicule?.id) {
//         setVehicule(initialVehicule);
//         setLoadingVehicle(false);
//         return;
//       }
//       setLoadingVehicle(true);
//       try {
//         const headers: any = { 'Content-Type': 'application/json' };
//         if (authState.accessToken) {
//           headers.Authorization = `Bearer ${authState.accessToken}`;
//         }
//         const response = await axios.get(`${BASE_URL}/vehicules/${initialVehicule.id}`, { headers });
//         setVehicule(response.data);
//       } catch (error) {
//         console.error('Erreur lors du fetch des détails véhicule:', error);
//         setVehicule(initialVehicule);
//       } finally {
//         setLoadingVehicle(false);
//       }
//     };
//     fetchFullVehicle();
//   }, [initialVehicule?.id, authState.accessToken]);

//   // Incrémenter les vues au chargement de la page
//   useEffect(() => {
//     if (initialVehicule?.id && route.params?.fromParking !== 'true') {
//       viewsService.incrementViews(initialVehicule.id);
//     }
//   }, [initialVehicule?.id, route.params?.fromParking]);

//   // Setup notifications
//   useEffect(() => {
//     Notifications.setNotificationHandler({
//       handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: false,
//         shouldSetBadge: false,
//         shouldShowBanner: true,
//         shouldShowList: true,
//       }),
//     });

//     registerForPushNotificationsAsync();
//   }, []);

//   async function registerForPushNotificationsAsync() {
//     if (Platform.OS === 'android') {
//       await Notifications.setNotificationChannelAsync('default', {
//         name: 'default',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//       });
//     }

//     if (Device.isDevice) {
//       const { status: existingStatus } = await Notifications.getPermissionsAsync();
//       let finalStatus = existingStatus;
//       if (existingStatus !== 'granted') {
//         const { status } = await Notifications.requestPermissionsAsync();
//         finalStatus = status;
//       }
//       if (finalStatus !== 'granted') {
//         alert('Failed to get permission for notifications!');
//         return;
//       }
//     } else {
//       alert('Must use physical device for Notifications');
//     }
//   }

//   async function showLocalNotification(title: string, body: string, data?: any) {
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title,
//           body,
//           ...(data !== undefined ? { data } : {}),
//         },
//         trigger: null,
//       });
//     }

//   // Fonction pour vérifier l'état favoris
//   const checkFavoriteStatus = async () => {
//     if (!vehicule?.id || isParkingView) return;
    
//     try {
//       const favorite = await favorisService.isInFavoris(vehicule.id);
//       setIsFavorite(favorite);
//     } catch (error) {
//       console.error('Erreur vérification favoris:', error);
//       setIsFavorite(false);
//     }
//   };

//   useEffect(() => {
//     checkFavoriteStatus();
//   }, [vehicule?.id, isParkingView]);

//   useFocusEffect(
//     React.useCallback(() => {
//       if (vehicule?.id && !isParkingView) {
//         checkFavoriteStatus();
//       }
//     }, [vehicule?.id, isParkingView])
//   );

//   const toggleFavorite = async () => {
//     if (!vehicule || isParkingView) return;

//     const newFavoriteState = !isFavorite;
//     setIsFavorite(newFavoriteState);
    
//     try {
//       if (!newFavoriteState) {
//         await favorisService.removeFromFavoris(vehicule.id);
//       } else {
//         await favorisService.addToFavoris(vehicule);
//       }
//     } catch (error) {
//       setIsFavorite(!newFavoriteState);
//       console.error('Erreur gestion favoris:', error);
//     }
//   };

//   // Fonction améliorée pour gérer les photos
//   const getPhotoUrls = (photos: string[] | string | undefined): string[] => {
//     if (!photos) return [];
    
//     try {
//       if (Array.isArray(photos)) {
//         return photos
//           .filter(photo => photo && photo !== "" && photo !== null)
//           .map(photo => {
//             if (photo.startsWith('http')) return photo;
//             if (photo.startsWith('file://')) return photo;
//             return `${BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
//           });
//       }
      
//       if (typeof photos === 'string') {
//         const photoArray = photos.split(',').filter(p => p && p !== "");
//         return photoArray.map(photo => {
//           if (photo.startsWith('http')) return photo;
//           if (photo.startsWith('file://')) return photo;
//           return `${BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
//         });
//       }
      
//       return [];
//     } catch (error) {
//       console.error('Erreur formatage photos:', error);
//       return [];
//     }
//   };

//   const photoUrls = getPhotoUrls(vehicule?.photos);

//   // Animation de l'image header
//   const headerOpacity = scrollY.interpolate({
//     inputRange: [0, 100],
//     outputRange: [1, 0],
//     extrapolate: 'clamp',
//   });

//   const headerTranslateY = scrollY.interpolate({
//     inputRange: [0, 100],
//     outputRange: [0, -50],
//     extrapolate: 'clamp',
//   });

//   useEffect(() => {
//     if (photoUrls.length > 1 && !loadingVehicle) {
//       const interval = setInterval(() => {
//         const nextIndex = (currentImageIndex + 1) % photoUrls.length;
//         setCurrentImageIndex(nextIndex);
//         if (flatListRef.current) {
//           flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
//         }
//       }, 4000);
//       return () => clearInterval(interval);
//     }
//   }, [currentImageIndex, photoUrls.length, loadingVehicle]);

//   // Format de prix
//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('fr-FR', {
//       style: 'currency',
//       currency: 'XOF',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(price);
//   };

//   const formatMileage = (mileage: number) => {
//     if (mileage >= 1000) {
//       return `${(mileage / 1000).toFixed(1)}K km`;
//     }
//     return `${mileage} km`;
//   };

//   const getFuelIcon = (fuelType: string | undefined) => {
//     switch(fuelType) {
//       case 'Essence':
//         return <Ionicons name="flame" size={20} color={PRIMARY_COLOR} />;
//       case 'Diesel':
//         return <FontAwesome5 name="oil-can" size={20} color={PRIMARY_COLOR} />;
//       case 'Électrique':
//         return <MaterialCommunityIcons name="lightning-bolt" size={20} color={PRIMARY_COLOR} />;
//       case 'Hybride':
//         return <MaterialCommunityIcons name="leaf" size={20} color={PRIMARY_COLOR} />;
//       case 'GPL':
//         return <FontAwesome5 name="gas-pump" size={20} color={PRIMARY_COLOR} />;
//       default:
//         return <FontAwesome5 name="car" size={20} color={PRIMARY_COLOR} />;
//     }
//   };

//   const handleDelete = () => {
//     setActionMenuVisible(false);
//     if (!vehicule) return;

//     Alert.alert(
//       "Supprimer le véhicule",
//       `Êtes-vous sûr de vouloir supprimer ${vehicule.marqueRef?.name || vehicule.marque || 'Marque'} ${vehicule.model || 'Modèle'} ? Cette action est irréversible.`,
//       [
//         {
//           text: "Annuler",
//           style: "cancel"
//         },
//         {
//           text: "Supprimer",
//           style: "destructive",
//           onPress: confirmDelete
//         }
//       ]
//     );
//   };

//   const confirmDelete = async () => {
//     if (!vehicule?.id) return;

//     try {
//       const token = authState.accessToken;
//       if (!token) {
//         Alert.alert('Erreur', 'Token d\'authentification manquant');
//         return;
//       }

//       setIsLoading(true);
      
//       const response = await fetch(`${BASE_URL}/vehicules/${vehicule.id}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         Alert.alert(
//           'Succès ✅',
//           'Véhicule supprimé avec succès',
//           [
//             {
//               text: 'OK',
//               onPress: () => {
//                 if (router.canGoBack()) {
//                   router.back();
//                 } else {
//                   router.replace('/(tabs)/Accueil');
//                 }
//               }
//             }
//           ]
//         );
//       } else {
//         const errorText = await response.text();
//         let errorMessage = 'Erreur lors de la suppression';
        
//         try {
//           const errorData = JSON.parse(errorText);
//           errorMessage = errorData.message || errorMessage;
//         } catch (e) {
//           errorMessage = errorText || errorMessage;
//         }
        
//         throw new Error(errorMessage);
//       }
//     } catch (error: any) {
//       console.error('❌ Erreur complète suppression:', error);
//       Alert.alert('Erreur ❌', error.message || 'Erreur lors de la suppression du véhicule');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleModify = () => {
//     setActionMenuVisible(false);
//     if (!vehicule) return;
    
//     const vehicleDataForEdit = {
//       id: vehicule.id,
//       marque: vehicule.marqueRef ? {
//         id: vehicule.marqueRef.id,
//         name: vehicule.marqueRef.name,
//         logoUrl: vehicule.marqueRef.logoUrl,
//         isCustom: vehicule.marqueRef.isCustom
//       } : vehicule.marque || '',
//       model: vehicule.model,
//       prix: vehicule.prix,
//       photos: vehicule.photos,
//       dureeGarantie: vehicule.dureeGarantie,
//       mileage: vehicule.mileage,
//       fuelType: vehicule.fuelType,
//       carteGrise: vehicule.carteGrise,
//       assurance: vehicule.assurance,
//       vignette: vehicule.vignette,
//       forRent: vehicule.forRent,
//       forSale: vehicule.forSale,
//       description: vehicule.description,
//       garantie: vehicule.garantie,
//       chauffeur: vehicule.chauffeur,
//       dureeAssurance: vehicule.dureeAssurance,
//       year: vehicule.year
//     };

//     router.push({
//       pathname: "/AjoutParking",
//       params: { 
//         vehicleToEdit: JSON.stringify(vehicleDataForEdit),
//         mode: 'edit'
//       }
//     } as any);
//   };

//   // Fonction pour naviguer vers la page du parking
//   const navigateToParking = () => {
//     if (vehicule?.parking) {
//       router.push({
//         pathname: '/(Clients)/parkingDetails',
//         params: { parking: JSON.stringify(vehicule.parking) }
//       });
//     }
//   };

//   // Fonction pour réinitialiser les états de réservation
//   const resetReservationStates = () => {
//     setModalVisible(false);
//     setModalPayVisible(false);
//     setReservationType(null);
//     setStartDate(null);
//     setEndDate(null);
//     setCurrentReservation(null);
//     setIsProcessingPayment(false);
//   };

//   // Fonction pour traiter le paiement et créer la réservation
//   const processPayment = async (paymentMethod: string) => {
//     if (!currentReservation || !vehicule) {
//       Alert.alert('Erreur', 'Informations de réservation manquantes');
//       return;
//     }

//     setIsProcessingPayment(true);

//     try {
//       const token = authState.accessToken;
//       if (!token) {
//         throw new Error('Token d\'authentification manquant');
//       }

//       // 1. Créer la réservation sur le serveur
//       const reservationBody = {
//         vehicleId: currentReservation.vehicleId,
//         dateDebut: currentReservation.dateDebut,
//         dateFin: currentReservation.dateFin,
//         type: currentReservation.type,
//       };

//       console.log('📤 Envoi réservation:', reservationBody);

//       const reservationResponse = await fetch(`${BASE_URL}/reservations`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(reservationBody),
//       });

//       if (!reservationResponse.ok) {
//         const errorText = await reservationResponse.text();
//         console.error('❌ Erreur réponse serveur:', errorText);
//         let errorData;
//         try {
//           errorData = JSON.parse(errorText);
//         } catch {
//           errorData = { message: 'Erreur lors de la création de la réservation' };
//         }
//         throw new Error(errorData.message || `Erreur ${reservationResponse.status}`);
//       }

//       const newReservation = await reservationResponse.json();
//       console.log('✅ Réservation créée:', newReservation);

//       // 2. Créer le paiement associé
//       const paymentBody = {
//         reservationId: newReservation.id,
//         montant: currentReservation.montant,
//         methodePaiement: paymentMethod,
//         statut: paymentMethod === 'ESPECES' ? 'EN_ATTENTE' : 'COMPLETE',
//       };

//       const paymentResponse = await fetch(`${BASE_URL}/paiements`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(paymentBody),
//       });

//       if (!paymentResponse.ok) {
//         console.warn('⚠️ Paiement non enregistré mais réservation créée');
//       }

//       // 3. Afficher confirmation
//       const message = paymentMethod === 'ESPECES' 
//         ? 'Votre réservation est confirmée !\n\nLe parking vous contactera bientôt pour organiser le paiement en espèces et la remise du véhicule.'
//         : 'Votre réservation et paiement sont confirmés !';

//       Alert.alert(
//         'Succès 🎉', 
//         message,
//         [{
//           text: 'Terminer',
//           onPress: () => {
//             resetReservationStates();
//           }
//         }]
//       );

//       // 4. Envoyer notification
//       await showLocalNotification(
//         'Réservation confirmée',
//         `Votre ${currentReservation.type.toLowerCase()} de véhicule a été enregistrée`,
//         { reservationId: newReservation.id }
//       );

//     } catch (error: any) {
//       console.error('❌ Erreur lors du traitement:', error);
//       Alert.alert(
//         'Erreur', 
//         error.message || 'Une erreur est survenue lors de la confirmation',
//         [{
//           text: 'Réessayer',
//           onPress: () => setIsProcessingPayment(false)
//         }, {
//           text: 'Annuler',
//           style: 'cancel',
//           onPress: () => {
//             resetReservationStates();
//           }
//         }]
//       );
//     } finally {
//       setIsProcessingPayment(false);
//     }
//   };

//   const confirmReservation = async () => {
//     if (!reservationType || !vehicule) return Alert.alert('Erreur', 'Sélectionnez un type de réservation');
//     if (reservationType === 'LOCATION' && (!startDate || !endDate)) {
//       return Alert.alert('Erreur', 'Les dates sont requises pour la location');
//     }
//     if (reservationType === 'LOCATION' && !vehicule.forRent) {
//       return Alert.alert('Erreur', 'Ce véhicule n\'est pas disponible à la location');
//     }
//     if (reservationType === 'ACHAT' && !vehicule.forSale) {
//       return Alert.alert('Erreur', 'Ce véhicule n\'est pas disponible à l\'achat');
//     }

//     const token = authState.accessToken;
//     if (!token) {
//       return Alert.alert(
//         'Connexion requise', 
//         'Vous devez vous connecter pour réserver ce véhicule',
//         [{ text: 'OK', style: 'cancel' }]
//       );
//     }

//     // Créer l'objet réservation temporaire sans l'envoyer au serveur
//     const tempReservation = {
//       vehicleId: vehicule.id,
//       dateDebut: reservationType === 'LOCATION' ? startDate?.toISOString() : null,
//       dateFin: reservationType === 'LOCATION' ? endDate?.toISOString() : null,
//       type: reservationType,
//       vehicule: vehicule,
//       montant: vehicule.prix
//     };

//     // Stocker temporairement la réservation
//     setCurrentReservation(tempReservation);
    
//     // Ouvrir directement le modal de paiement
//     setModalPayVisible(true);
//     setModalVisible(false);
//   };

//   if (loadingVehicle || !vehicule) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={PRIMARY_COLOR} />
//           <Text style={styles.loadingText}>Chargement des détails du véhicule...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const renderFeatureItem = (icon: React.ReactNode, label: string, value: any, condition: boolean = true) => {
//     if (!condition) return null;
    
//     const displayValue = value === undefined || value === null || value === '' 
//       ? 'Non spécifié' 
//       : (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value);
    
//     return (
//       <View style={styles.featureItem}>
//         <View style={styles.featureIconContainer}>
//           {icon}
//         </View>
//         <View style={styles.featureTextContainer}>
//           <Text style={styles.featureLabel}>{label}</Text>
//           <Text style={[
//             styles.featureValue,
//             (value === undefined || value === null || value === '') && styles.unknownValue
//           ]}>
//             {displayValue}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   const renderImageItem = ({ item }: { item: string }) => (
//     <View style={styles.imageContainer}>
//       <Image 
//         source={{ uri: item }} 
//         style={styles.carImage} 
//         resizeMode="cover"
//         onError={(error) => console.log('Erreur chargement image:', error.nativeEvent.error)}
//       />
//     </View>
//   );

//   const renderPagination = () => {
//     if (photoUrls.length <= 1) return null;
//     return (
//       <View style={styles.pagination}>
//         {photoUrls.map((_, index) => (
//           <View 
//             key={index} 
//             style={[
//               styles.paginationDot, 
//               index === currentImageIndex && styles.paginationDotActive
//             ]} 
//           />
//         ))}
//       </View>
//     );
//   };

//   const handleReservePress = () => {
//     if (isParkingView) return;
//     setModalVisible(true);
//   };

//   const selectType = (type: 'LOCATION' | 'ACHAT') => {
//     setReservationType(type);
//     if (type === 'ACHAT') {
//       setStartDate(null);
//       setEndDate(null);
//     } else {
//       const today = new Date();
//       setStartDate(today);
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);
//       setEndDate(tomorrow);
//     }
//   };

//   const onStartDateChange = (event: any, selectedDate?: Date) => {
//     setShowStartPicker(Platform.OS === 'ios');
//     if (selectedDate) {
//       setStartDate(selectedDate);
//       if (endDate && selectedDate >= endDate) {
//         const newEnd = new Date(selectedDate);
//         newEnd.setDate(newEnd.getDate() + 1);
//         setEndDate(newEnd);
//       }
//     }
//   };

//   const onEndDateChange = (event: any, selectedDate?: Date) => {
//     setShowEndPicker(Platform.OS === 'ios');
//     if (selectedDate && startDate && selectedDate > startDate) {
//       setEndDate(selectedDate);
//     } else if (selectedDate) {
//       Alert.alert('Erreur', 'La date de fin doit être après la date de début');
//     }
//   };

//   const renderActionMenu = () => {
//     if (!isParkingView) return null;

//     return (
//       <View style={styles.actionMenuContainer}>
//         <TouchableOpacity 
//           style={styles.actionMenuButton}
//           onPress={() => setActionMenuVisible(true)}
//         >
//           <Feather name="more-vertical" size={24} color={SECONDARY_COLOR} />
//         </TouchableOpacity>

//         <Modal
//           transparent
//           visible={actionMenuVisible}
//           animationType="fade"
//           onRequestClose={() => setActionMenuVisible(false)}
//         >
//           <TouchableOpacity 
//             style={styles.actionMenuOverlay}
//             activeOpacity={1}
//             onPress={() => setActionMenuVisible(false)}
//           >
//             <View style={styles.actionMenuContent}>
//               <TouchableOpacity 
//                 style={styles.menuItem}
//                 onPress={handleModify}
//               >
//                 <Feather name="edit-2" size={20} color={PRIMARY_COLOR} />
//                 <Text style={styles.menuItemText}>Modifier</Text>
//               </TouchableOpacity>

//               <View style={styles.menuDivider} />

//               <TouchableOpacity 
//                 style={styles.menuItem}
//                 onPress={handleDelete}
//                 disabled={isLoading}
//               >
//                 {isLoading ? (
//                   <ActivityIndicator size="small" color="#FF4444" />
//                 ) : (
//                   <>
//                     <Feather name="trash-2" size={20} color="#FF4444" />
//                     <Text style={[styles.menuItemText, styles.deleteText]}>Supprimer</Text>
//                   </>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </TouchableOpacity>
//         </Modal>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <Animated.View style={[
//         styles.headerOverlay,
//         {
//           opacity: headerOpacity,
//           transform: [{ translateY: headerTranslateY }]
//         }
//       ]}>
//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="chevron-back" size={28} color="#fff" />
//         </TouchableOpacity>
//       </Animated.View>

//       <Animated.ScrollView 
//         style={styles.scrollView}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//           { useNativeDriver: true }
//         )}
//         scrollEventThrottle={16}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Image Gallery */}
//         <View style={styles.imageGalleryContainer}>
//           {photoUrls.length > 0 ? (
//             <>
//               <FlatList
//                 ref={flatListRef}
//                 data={photoUrls}
//                 renderItem={renderImageItem}
//                 keyExtractor={(item, index) => index.toString()}
//                 horizontal
//                 pagingEnabled
//                 showsHorizontalScrollIndicator={false}
//                 onMomentumScrollEnd={(event) => {
//                   const newIndex = Math.floor(event.nativeEvent.contentOffset.x / width);
//                   setCurrentImageIndex(newIndex);
//                 }}
//               />
//               {renderPagination()}
              
//               {/* Image counter */}
//               <View style={styles.imageCounter}>
//                 <Text style={styles.imageCounterText}>
//                   {currentImageIndex + 1} / {photoUrls.length}
//                 </Text>
//               </View>
//             </>
//           ) : (
//             <View style={[styles.imageContainer, styles.placeholderImage]}>
//               <FontAwesome5 name="car" size={60} color="#ddd" />
//               <Text style={styles.noImageText}>Aucune photo disponible</Text>
//             </View>
//           )}
//         </View>

//         {/* Header Card with Floating Design */}
//         <View style={styles.headerCard}>
//           <View style={styles.headerCardContent}>
//             <View style={styles.titleRow}>
//               <Text style={styles.carName}>
//                 {vehicule.marqueRef?.name || vehicule.marque || 'Marque'} {vehicule.model || 'Modèle'}
//               </Text>
//               {!isParkingView && (
//                 <TouchableOpacity 
//                   style={styles.floatingFavoriteButton}
//                   onPress={toggleFavorite}
//                 >
//                   <FontAwesome 
//                     name="heart" 
//                     size={20} 
//                     color={isFavorite ? "#FF3B30" : "#ccc"} 
//                     solid={isFavorite}
//                   />
//                 </TouchableOpacity>
//               )}
//             </View>
            
//             <Text style={styles.priceValue}>{formatPrice(vehicule.prix)}</Text>
            
//             {/* Badges */}
//             <View style={styles.badgesContainer}>
//               {vehicule.year && (
//                 <View style={styles.badge}>
//                   <Ionicons name="calendar" size={12} color="#fff" />
//                   <Text style={styles.badgeText}>{vehicule.year}</Text>
//                 </View>
//               )}
//               {vehicule.mileage && (
//                 <View style={styles.badge}>
//                   <Feather name="activity" size={12} color="#fff" />
//                   <Text style={styles.badgeText}>{formatMileage(vehicule.mileage)}</Text>
//                 </View>
//               )}
//               {vehicule.fuelType && (
//                 <View style={styles.badge}>
//                   {getFuelIcon(vehicule.fuelType)}
//                   <Text style={styles.badgeText}>{vehicule.fuelType}</Text>
//                 </View>
//               )}
//             </View>

//             {/* Transaction Type Badges */}
//             <View style={styles.transactionContainer}>
//               {vehicule.forSale && (
//                 <View style={[styles.transactionBadge, styles.saleBadge]}>
//                   <FontAwesome5 name="tag" size={12} color="#fff" />
//                   <Text style={styles.transactionBadgeText}>À vendre</Text>
//                 </View>
//               )}
//               {vehicule.forRent && (
//                 <View style={[styles.transactionBadge, styles.rentBadge]}>
//                   <FontAwesome5 name="clock" size={12} color="#fff" />
//                   <Text style={styles.transactionBadgeText}>En location</Text>
//                 </View>
//               )}
//             </View>
//           </View>
//         </View>

//         {/* Quick Info Cards */}
//         <View style={styles.quickInfoContainer}>
//           <View style={styles.quickInfoRow}>
//             <View style={styles.quickInfoCard}>
//               <Ionicons name="shield-checkmark" size={24} color="#28a745" />
//               <Text style={styles.quickInfoLabel}>Garantie</Text>
//               <Text style={styles.quickInfoValue}>
//                 {vehicule.dureeGarantie ? `${vehicule.dureeGarantie} mois` : 'Non incluse'}
//               </Text>
//             </View>
//             <View style={styles.quickInfoCard}>
//               <Feather name="file-text" size={24} color={PRIMARY_COLOR} />
//               <Text style={styles.quickInfoLabel}>Assurance</Text>
//               <Text style={styles.quickInfoValue}>
//                 {vehicule.assurance ? 'Incluse' : 'Non incluse'}
//               </Text>
//             </View>
//           </View>
//         </View>

//         {/* Features Grid */}
//         <View style={styles.featuresCard}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Caractéristiques</Text>
//             {renderActionMenu()}
//           </View>
          
//           <View style={styles.featuresGrid}>
//             {renderFeatureItem(
//               <Ionicons name="calendar" size={24} color={PRIMARY_COLOR} />,
//               'Année',
//               vehicule.year,
//               !!vehicule.year
//             )}
            
//             {renderFeatureItem(
//               <Feather name="activity" size={24} color={PRIMARY_COLOR} />,
//               'Kilométrage',
//               vehicule.mileage ? formatMileage(vehicule.mileage) : null,
//               vehicule.mileage !== undefined
//             )}
            
//             {renderFeatureItem(
//               getFuelIcon(vehicule.fuelType),
//               'Carburant',
//               vehicule.fuelType,
//               !!vehicule.fuelType
//             )}

//             {renderFeatureItem(
//               <MaterialCommunityIcons name="cog-transfer" size={24} color={PRIMARY_COLOR} />,
//               'Boîte de vitesse',
//               vehicule.transmission,
//               !!vehicule.transmission
//             )}
            
//             {renderFeatureItem(
//               <MaterialCommunityIcons name="license" size={24} color={PRIMARY_COLOR} />,
//               'Carte Grise',
//               vehicule.carteGrise,
//               vehicule.carteGrise !== undefined
//             )}
            
//             {renderFeatureItem(
//               <Ionicons name="document-text" size={24} color={PRIMARY_COLOR} />,
//               'Vignette',
//               vehicule.vignette,
//               vehicule.vignette !== undefined
//             )}
//           </View>
//         </View>

//         {/* Description */}
//         {vehicule.description && (
//           <View style={styles.descriptionCard}>
//             <View style={styles.sectionHeader}>
//               <Ionicons name="document-text" size={20} color={SECONDARY_COLOR} />
//               <Text style={styles.sectionTitle}>Description</Text>
//             </View>
//             <Text style={styles.descriptionText}>{vehicule.description}</Text>
//           </View>
//         )}

//         {/* Stats */}
//         {vehicule.stats && (
//           <View style={styles.statsCard}>
//             <View style={styles.sectionHeader}>
//               <Feather name="bar-chart-2" size={20} color={SECONDARY_COLOR} />
//               <Text style={styles.sectionTitle}>Statistiques</Text>
//             </View>
//             <View style={styles.statsContainer}>
//               <View style={styles.statItem}>
//                 <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 125, 0, 0.1)' }]}>
//                   <Feather name="eye" size={20} color={PRIMARY_COLOR} />
//                 </View>
//                 <Text style={styles.statValue}>{vehicule.stats.vues || 0}</Text>
//                 <Text style={styles.statLabel}>Vues</Text>
//               </View>
//               <View style={styles.statDivider} />
//               <View style={styles.statItem}>
//                 <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
//                   <Feather name="calendar" size={20} color="#34C759" />
//                 </View>
//                 <Text style={styles.statValue}>{vehicule.stats.reservations || 0}</Text>
//                 <Text style={styles.statLabel}>Réservations</Text>
//               </View>
//             </View>
//           </View>
//         )}

//          {/* Carte pour le parking propriétaire */}
//         {vehicule.parking && (
//           <TouchableOpacity 
//             style={styles.parkingCard}
//             onPress={navigateToParking}
//             activeOpacity={0.7}
//           >
//             <View style={styles.sectionHeader}>
//               <MaterialIcons name="local-parking" size={20} color={SECONDARY_COLOR} />
//               <Text style={styles.sectionTitle}>Parking</Text>
//               <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevronIcon} />
//             </View>
            
//             <View style={styles.parkingInfo}>
//               {vehicule.parking.logo ? (
//                 <Image 
//                   source={{ uri: vehicule.parking.logo.startsWith('http') ? vehicule.parking.logo : `${BASE_URL}${vehicule.parking.logo}` }}
//                   style={styles.parkingLogo}
//                   resizeMode="cover"
//                 />
//               ) : (
//                 <View style={styles.parkingLogoPlaceholder}>
//                   <MaterialIcons name="local-parking" size={24} color={PRIMARY_COLOR} />
//                 </View>
//               )}
              
//               <View style={styles.parkingDetails}>
//                 <Text style={styles.parkingName}>{vehicule.parking.name || 'Parking'}</Text>
//                 {vehicule.parking.address && (
//                   <View style={styles.parkingDetailRow}>
//                     <Ionicons name="location-outline" size={14} color="#666" />
//                     <Text style={styles.parkingDetailText} numberOfLines={1}>
//                       {vehicule.parking.address}
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             </View>
            
//             <Text style={styles.viewParkingText}>Voir les détails du parking →</Text>
//           </TouchableOpacity>
//         )}

//         {/* Spacer for FAB */}
//         <View style={{ height: 100 }} />
//       </Animated.ScrollView>

//       {/* Floating Action Button */}
//       {!isParkingView && (
//         <View style={styles.fabContainer}>
//           {/* Si véhicule uniquement en vente */}
//           {vehicule.forSale && !vehicule.forRent && (
//             <TouchableOpacity 
//               style={[styles.fabButton, styles.fabSaleButton]}
//               onPress={() => {
//                 setReservationType('ACHAT');
//                 handleReservePress();
//               }}
//             >
//               <FontAwesome5 name="shopping-cart" size={20} color="#fff" />
//               <Text style={styles.fabText}>Acheter</Text>
//             </TouchableOpacity>
//           )}
          
//           {/* Si véhicule uniquement en location */}
//           {vehicule.forRent && !vehicule.forSale && (
//             <TouchableOpacity 
//               style={[styles.fabButton, styles.fabRentButton]}
//               onPress={() => {
//                 setReservationType('LOCATION');
//                 handleReservePress();
//               }}
//             >
//               <FontAwesome5 name="calendar-check" size={20} color="#fff" />
//               <Text style={styles.fabText}>Louer</Text>
//             </TouchableOpacity>
//           )}
          
//           {/* Si véhicule en vente ET location */}
//           {vehicule.forSale && vehicule.forRent && (
//             <TouchableOpacity 
//               style={styles.fabButton}
//               onPress={handleReservePress}
//             >
//               <FontAwesome5 name="calendar-check" size={20} color="#fff" />
//               <Text style={styles.fabText}>Réserver</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       )}

//       {/* Reservation Modal */}
//       {!isParkingView && (
//         <Modal
//           animationType="slide"
//           transparent={true}
//           visible={modalVisible}
//           onRequestClose={() => setModalVisible(false)}
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>
//                   {vehicule.forSale && !vehicule.forRent ? 'Acheter ce véhicule' : 
//                    vehicule.forRent && !vehicule.forSale ? 'Louer ce véhicule' : 
//                    'Réserver ce véhicule'}
//                 </Text>
//                 <TouchableOpacity onPress={() => setModalVisible(false)}>
//                   <Ionicons name="close" size={24} color={SECONDARY_COLOR} />
//                 </TouchableOpacity>
//               </View>

//               <View style={styles.modalBody}>
//                 {(vehicule.forSale && vehicule.forRent) && (
//                   <>
//                     <Text style={styles.modalSubtitle}>Type de réservation</Text>
//                     <View style={styles.typeButtons}>
//                       <TouchableOpacity
//                         style={[styles.typeButton, reservationType === 'ACHAT' && styles.typeButtonSelected]}
//                         onPress={() => selectType('ACHAT')}
//                       >
//                         <FontAwesome5 
//                           name="shopping-cart" 
//                           size={20} 
//                           color={reservationType === 'ACHAT' ? '#fff' : PRIMARY_COLOR} 
//                         />
//                         <Text style={[styles.typeButtonText, reservationType === 'ACHAT' && styles.typeButtonTextSelected]}>
//                           Achat
//                         </Text>
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[styles.typeButton, reservationType === 'LOCATION' && styles.typeButtonSelected]}
//                         onPress={() => selectType('LOCATION')}
//                       >
//                         <FontAwesome5 
//                           name="calendar-alt" 
//                           size={20} 
//                           color={reservationType === 'LOCATION' ? '#fff' : PRIMARY_COLOR} 
//                         />
//                         <Text style={[styles.typeButtonText, reservationType === 'LOCATION' && styles.typeButtonTextSelected]}>
//                           Location
//                         </Text>
//                       </TouchableOpacity>
//                     </View>
//                   </>
//                 )}

//                 {/* Si seul l'achat est disponible, définir automatiquement */}
//                 {vehicule.forSale && !vehicule.forRent && !reservationType && (
//                   setReservationType('ACHAT')
//                 )}

//                 {/* Si seule la location est disponible, définir automatiquement */}
//                 {vehicule.forRent && !vehicule.forSale && !reservationType && (
//                   setReservationType('LOCATION')
//                 )}

//                 {reservationType === 'LOCATION' && (
//                   <View style={styles.dateSection}>
//                     <View style={styles.dateRow}>
//                       <View style={styles.dateInput}>
//                         <Text style={styles.dateLabel}>Date de début</Text>
//                         <TouchableOpacity 
//                           style={styles.dateButton}
//                           onPress={() => setShowStartPicker(true)}
//                         >
//                           <Feather name="calendar" size={18} color="#666" />
//                           <Text style={styles.dateButtonText}>
//                             {startDate ? startDate.toLocaleDateString('fr-FR') : 'Sélectionner'}
//                           </Text>
//                         </TouchableOpacity>
//                         {showStartPicker && (
//                           <DateTimePicker
//                             value={startDate || new Date()}
//                             mode="date"
//                             display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                             onChange={onStartDateChange}
//                             minimumDate={new Date()}
//                           />
//                         )}
//                       </View>
//                       <View style={styles.dateInput}>
//                         <Text style={styles.dateLabel}>Date de fin</Text>
//                         <TouchableOpacity 
//                           style={styles.dateButton}
//                           onPress={() => setShowEndPicker(true)}
//                         >
//                           <Feather name="calendar" size={18} color="#666" />
//                           <Text style={styles.dateButtonText}>
//                             {endDate ? endDate.toLocaleDateString('fr-FR') : 'Sélectionner'}
//                           </Text>
//                         </TouchableOpacity>
//                         {showEndPicker && (
//                           <DateTimePicker
//                             value={endDate || new Date()}
//                             mode="date"
//                             display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//                             onChange={onEndDateChange}
//                             minimumDate={startDate ? new Date(startDate.getTime() + 86400000) : new Date()}
//                           />
//                         )}
//                       </View>
//                     </View>
//                     <View style={styles.chauffeurMessageCard}>
//                       <FontAwesome5 name="user-tie" size={20} color={PRIMARY_COLOR} />
//                       <Text style={styles.chauffeurMessageText}>
//                         Note : La location inclut un chauffeur fourni par le parking.
//                       </Text>
//                     </View>
//                   </View>
//                 )}

//                 {reservationType && (
//                   <View style={styles.summaryCard}>
//                     <View style={styles.summaryHeader}>
//                       <Ionicons name="information-circle" size={20} color={PRIMARY_COLOR} />
//                       <Text style={styles.summaryTitle}>Récapitulatif</Text>
//                     </View>
//                     <Text style={styles.summaryText}>
//                       {reservationType === 'ACHAT' 
//                         ? `Achat de ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''} pour ${formatPrice(vehicule.prix)}`
//                         : `Location de ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''}`
//                       }
//                     </Text>
//                   </View>
//                 )}

//                 <View style={styles.notificationCard}>
//                   <Ionicons name="notifications" size={20} color={PRIMARY_COLOR} />
//                   <Text style={styles.notificationText}>
//                     Veuillez choisir un mode de paiement pour confirmer la réservation
//                   </Text>
//                 </View>
//               </View>

//               <View style={styles.modalFooter}>
//                 <TouchableOpacity 
//                   style={styles.cancelButton}
//                   onPress={() => setModalVisible(false)}
//                 >
//                   <Text style={styles.cancelButtonText}>Annuler</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity 
//                   style={[
//                     styles.confirmButton, 
//                     (!reservationType || (reservationType === 'LOCATION' && (!startDate || !endDate))) && styles.confirmButtonDisabled
//                   ]} 
//                   onPress={confirmReservation}
//                   disabled={!reservationType || (reservationType === 'LOCATION' && (!startDate || !endDate)) || isLoading}
//                 >
//                   {isLoading ? (
//                     <ActivityIndicator size="small" color="#FFF" />
//                   ) : (
//                     <>
//                       <Ionicons name="arrow-forward" size={20} color="#fff" />
//                       <Text style={styles.confirmButtonText}>
//                         Payer
//                       </Text>
//                     </>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         </Modal>
//       )}
      
//       {/* Modal de Paiement */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalPayVisible}
//         onRequestClose={() => setModalPayVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Choix du paiement</Text>
//               <TouchableOpacity onPress={() => setModalPayVisible(false)}>
//                 <Ionicons name="close" size={24} color={SECONDARY_COLOR} />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.modalBody}>
//               {/* Section récapitulative */}
//               {currentReservation && (
//                 <View style={styles.reservationSummaryCard}>
//                   <Text style={styles.reservationSummaryTitle}>Récapitulatif de la réservation</Text>
//                   <View style={styles.reservationDetailRow}>
//                     <Text style={styles.reservationDetailLabel}>Véhicule :</Text>
//                     <Text style={styles.reservationDetailValue}>
//                       {currentReservation.vehicule?.marqueRef?.name || currentReservation.vehicule?.marque || 'Marque'} {currentReservation.vehicule?.model || 'Modèle'}
//                     </Text>
//                   </View>
//                   {currentReservation.type === 'LOCATION' && (
//                     <>
//                       <View style={styles.reservationDetailRow}>
//                         <Text style={styles.reservationDetailLabel}>Date début :</Text>
//                         <Text style={styles.reservationDetailValue}>
//                           {currentReservation.dateDebut ? new Date(currentReservation.dateDebut).toLocaleDateString('fr-FR') : ''}
//                         </Text>
//                       </View>
//                       <View style={styles.reservationDetailRow}>
//                         <Text style={styles.reservationDetailLabel}>Date fin :</Text>
//                         <Text style={styles.reservationDetailValue}>
//                           {currentReservation.dateFin ? new Date(currentReservation.dateFin).toLocaleDateString('fr-FR') : ''}
//                         </Text>
//                       </View>
//                     </>
//                   )}
//                   <View style={styles.reservationDetailRow}>
//                     <Text style={styles.reservationDetailLabel}>Montant :</Text>
//                     <Text style={[styles.reservationDetailValue, { color: PRIMARY_COLOR, fontWeight: 'bold' }]}>
//                       {formatPrice(currentReservation.montant)}
//                     </Text>
//                   </View>
//                 </View>
//               )}

//               <Text style={styles.paymentSubtitle}>
//                 Sélectionnez votre mode de paiement pour confirmer la réservation
//               </Text>

//               {/* Option Espèces - Disponible */}
//               <TouchableOpacity
//                 style={styles.paymentOption}
//                 onPress={async () => {
//                   await processPayment('ESPECES');
//                 }}
//                 disabled={isProcessingPayment}
//               >
//                 <View style={styles.paymentOptionContent}>
//                   <View style={styles.paymentIconContainer}>
//                     <FontAwesome5 name="money-bill-wave" size={28} color="#28a745" />
//                   </View>
//                   <View style={styles.paymentTextContainer}>
//                     <Text style={styles.paymentOptionTitle}>Espèces</Text>
//                     <Text style={styles.paymentOptionDesc}>Paiement en main propre lors de la remise</Text>
//                   </View>
//                   {isProcessingPayment ? (
//                     <ActivityIndicator size="small" color="#28a745" />
//                   ) : (
//                     <Ionicons name="checkmark-circle" size={24} color="#28a745" />
//                   )}
//                 </View>
//               </TouchableOpacity>

//                       {/* Option Orange Money - Verrouillée */}
//         <View style={[styles.paymentOption, styles.paymentOptionDisabled]}>
//           <View style={styles.paymentOptionContent}>
//             <View style={styles.paymentIconContainer}>
//               <Image 
//                 source={require('../assets/orange-money-logo.png')} // À ajouter dans tes assets
//                 style={{ width: 40, height: 40 }}
//                 resizeMode="contain"
//               />
//             </View>
//             <View style={styles.paymentTextContainer}>
//               <Text style={styles.paymentOptionTitle}>Orange Money</Text>
//               <Text style={styles.paymentOptionDesc}>Bientôt disponible</Text>
//             </View>
//             <MaterialIcons name="lock" size={24} color="#999" />
//           </View>
//         </View>

//         {/* Option Wave - Verrouillée */}
//         <View style={[styles.paymentOption, styles.paymentOptionDisabled]}>
//           <View style={styles.paymentOptionContent}>
//             <View style={styles.paymentIconContainer}>
//               <Image 
//                 source={require('../assets/wave-logo.png')} // À ajouter dans tes assets
//                 style={{ width: 40, height: 40 }}
//                 resizeMode="contain"
//               />
//             </View>
//             <View style={styles.paymentTextContainer}>
//               <Text style={styles.paymentOptionTitle}>Wave</Text>
//               <Text style={styles.paymentOptionDesc}>Bientôt disponible</Text>
//             </View>
//             <MaterialIcons name="lock" size={24} color="#999" />
//           </View>
//         </View>

//               {isProcessingPayment && (
//                 <View style={styles.processingContainer}>
//                   <ActivityIndicator size="small" color={PRIMARY_COLOR} />
//                   <Text style={styles.processingText}>Confirmation en cours...</Text>
//                 </View>
//               )}
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: { 
//     flex: 1,
//     backgroundColor: BACKGROUND_COLOR
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: SECONDARY_COLOR,
//   },
//   headerOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 100,
//     paddingTop: 10,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     zIndex: 100,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerFavoriteButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   imageGalleryContainer: {
//     height: 300,
//     backgroundColor: '#000',
//   },
//   imageContainer: {
//     width: width,
//     height: 300,
//   },
//   carImage: {
//     width: '100%',
//     height: '100%',
//   },
//   placeholderImage: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//   },
//   noImageText: {
//     marginTop: 10,
//     color: '#999',
//     fontSize: 16,
//   },
//   pagination: {
//     position: 'absolute',
//     bottom: 20,
//     alignSelf: 'center',
//     flexDirection: 'row',
//   },
//   paginationDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: 'rgba(255, 255, 255, 0.4)',
//     marginHorizontal: 4,
//   },
//   paginationDotActive: {
//     backgroundColor: PRIMARY_COLOR,
//     width: 20,
//   },
//   imageCounter: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   imageCounterText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   headerCard: {
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 24,
//     marginTop: -20,
//     marginHorizontal: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.1,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   headerCardContent: {
//     marginBottom: 8,
//   },
//   titleRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   carName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: SECONDARY_COLOR,
//     flex: 1,
//   },
//   floatingFavoriteButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#f8f9fa',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 12,
//   },
//   priceValue: {
//     fontSize: 28,
//     fontWeight: '800',
//     color: PRIMARY_COLOR,
//     marginBottom: 16,
//   },
//   badgesContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 12,
//   },
//   badge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(44, 62, 80, 0.1)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   badgeText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//     marginLeft: 4,
//   },
//   transactionContainer: {
//     flexDirection: 'row',
//   },
//   transactionBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   saleBadge: {
//     backgroundColor: '#34C759',
//   },
//   rentBadge: {
//     backgroundColor: '#007AFF',
//   },
//   transactionBadgeText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 6,
//   },
//   parkingCard: {
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 24,
//     margin: 16,
//     marginTop: 16,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 12,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: '#e8f4ff',
//   },
//   chevronIcon: {
//     marginLeft: 'auto',
//   },
//   parkingInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 12,
//   },
//   parkingLogo: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     marginRight: 16,
//   },
//   parkingLogoPlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 125, 0, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   parkingDetails: {
//     flex: 1,
//   },
//   parkingName: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: SECONDARY_COLOR,
//     marginBottom: 6,
//   },
//   parkingDetailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   parkingDetailText: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 8,
//     flex: 1,
//   },
//   viewParkingText: {
//     fontSize: 14,
//     color: PRIMARY_COLOR,
//     fontWeight: '600',
//     marginTop: 16,
//     textAlign: 'right',
//   },
//   quickInfoContainer: {
//     paddingHorizontal: 16,
//     marginTop: 16,
//   },
//   quickInfoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   quickInfoCard: {
//     flex: 1,
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 16,
//     padding: 16,
//     marginHorizontal: 4,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
//   quickInfoLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 8,
//   },
//   quickInfoValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//     marginTop: 4,
//   },
//   featuresCard: {
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 24,
//     margin: 16,
//     marginTop: 24,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 12,
//     elevation: 3,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: SECONDARY_COLOR,
//     marginLeft: 8,
//     flex: 1,
//   },
//   actionMenuContainer: {
//     marginLeft: 'auto',
//   },
//   actionMenuButton: {
//     padding: 8,
//     borderRadius: 20,
//   },
//   actionMenuOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   actionMenuContent: {
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 16,
//     padding: 8,
//     width: 200,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//   },
//   menuItemText: {
//     fontSize: 16,
//     color: SECONDARY_COLOR,
//     marginLeft: 12,
//     fontWeight: '500',
//   },
//   deleteText: {
//     color: '#FF4444',
//   },
//   menuDivider: {
//     height: 1,
//     backgroundColor: '#f0f0f0',
//     marginHorizontal: 8,
//   },
//   featuresGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   featureItem: {
//     width: '48%',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 8,
//   },
//   featureIconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 125, 0, 0.1)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   featureTextContainer: {
//     flex: 1,
//   },
//   featureLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 2,
//   },
//   featureValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//   },
//   unknownValue: {
//     fontStyle: 'italic',
//     color: '#999',
//   },
//   descriptionCard: {
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 24,
//     margin: 16,
//     marginTop: 0,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 12,
//     elevation: 3,
//   },
//   descriptionText: {
//     fontSize: 15,
//     color: '#666',
//     lineHeight: 22,
//   },
//   statsCard: {
//     backgroundColor: CARD_BACKGROUND,
//     borderRadius: 24,
//     margin: 16,
//     marginTop: 0,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.05,
//     shadowRadius: 12,
//     elevation: 3,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//   },
//   statItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: SECONDARY_COLOR,
//   },
//   statLabel: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 4,
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: '#f0f0f0',
//   },
//   fabContainer: {
//     position: 'absolute',
//     bottom: 40,
//     right: 20,
//     zIndex: 10,
//   },
//   fabButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: PRIMARY_COLOR,
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     borderRadius: 30,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   fabSaleButton: {
//     backgroundColor: PRIMARY_COLOR,
//   },
//   fabRentButton: {
//     backgroundColor: PRIMARY_COLOR,
//   },
//   fabText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: CARD_BACKGROUND,
//     borderTopLeftRadius: 32,
//     borderTopRightRadius: 32,
//     maxHeight: '90%',
//     paddingBottom: 30,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 24,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   modalTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: SECONDARY_COLOR,
//   },
//   modalBody: {
//     padding: 24,
//   },
//   modalSubtitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//     marginBottom: 16,
//   },
//   typeButtons: {
//     flexDirection: 'row',
//     marginBottom: 24,
//   },
//   typeButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderRadius: 16,
//     borderWidth: 2,
//     borderColor: PRIMARY_COLOR,
//     backgroundColor: '#fff',
//     marginHorizontal: 6,
//   },
//   typeButtonSelected: {
//     backgroundColor: PRIMARY_COLOR,
//   },
//   typeButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: PRIMARY_COLOR,
//     marginLeft: 8,
//   },
//   typeButtonTextSelected: {
//     color: '#fff',
//   },
//   dateSection: {
//     marginBottom: 24,
//   },
//   dateRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   dateInput: {
//     flex: 1,
//     marginHorizontal: 6,
//   },
//   dateLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//     marginBottom: 8,
//   },
//   dateButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   dateButtonText: {
//     fontSize: 16,
//     color: SECONDARY_COLOR,
//     marginLeft: 12,
//     flex: 1,
//   },
//   chauffeurMessageCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 125, 0, 0.1)',
//     borderRadius: 12,
//     padding: 16,
//     marginTop: 16,
//   },
//   chauffeurMessageText: {
//     fontSize: 14,
//     color: SECONDARY_COLOR,
//     marginLeft: 12,
//     flex: 1,
//   },
//   summaryCard: {
//     backgroundColor: 'rgba(255, 125, 0, 0.1)',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 20,
//   },
//   summaryHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   summaryTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//     marginLeft: 8,
//   },
//   summaryText: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//   },
//   notificationCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 16,
//   },
//   notificationText: {
//     fontSize: 14,
//     color: SECONDARY_COLOR,
//     marginLeft: 12,
//     flex: 1,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     paddingHorizontal: 24,
//     paddingTop: 16,
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     paddingVertical: 16,
//     borderRadius: 16,
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#666',
//   },
//   confirmButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: PRIMARY_COLOR,
//     paddingVertical: 16,
//     borderRadius: 16,
//     marginLeft: 12,
//   },
//   confirmButtonDisabled: {
//     backgroundColor: '#ffb366',
//     opacity: 0.7,
//   },
//   confirmButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//     marginLeft: 8,
//   },
//   paymentSubtitle: {
//     fontSize: 15,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   paymentOption: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   paymentOptionDisabled: {
//     opacity: 0.6,
//     backgroundColor: '#f8f9fa',
//   },
//   paymentOptionContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   paymentIconContainer: {
//     marginRight: 16,
//   },
//   paymentTextContainer: {
//     flex: 1,
//   },
//   paymentOptionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//   },
//   paymentOptionDesc: {
//     fontSize: 13,
//     color: '#888',
//     marginTop: 4,
//   },
//   processingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 20,
//   },
//   processingText: {
//     marginLeft: 10,
//     color: '#666',
//     fontSize: 14,
//   },
//   reservationSummaryCard: {
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   reservationSummaryTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: SECONDARY_COLOR,
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   reservationDetailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   reservationDetailLabel: {
//     fontSize: 14,
//     color: '#666',
//   },
//   reservationDetailValue: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: SECONDARY_COLOR,
//   },
// });

// export default CarDetailScreen;