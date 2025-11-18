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
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from './services/listeVoiture';
import { useAuth } from '../context/AuthContext';
import { favorisService } from './services/favorisService';
import { viewsService } from './services/viewsService';
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
  };
  garantie?: boolean;
  chauffeur?: boolean;
  dureeAssurance?: number;
}

const { width } = Dimensions.get('window');

function CarDetailScreen() {
  const route = useRoute<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
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

  const { authState } = useAuth();

  // Vérifier si le véhicule est passé et si c'est une vue parking
  let vehicule: Vehicule | null = null;
  
  if (route.params?.vehicule) {
    try {
      if (typeof route.params.vehicule === 'string') {
        vehicule = JSON.parse(route.params.vehicule);
      } else {
        vehicule = route.params.vehicule;
      }
      console.log('🚗 Véhicule reçu:', vehicule);
    } catch (error) {
      console.error('Erreur parsing véhicule:', error);
    }
  }

  // Vérifier si c'est le parking qui consulte
  useEffect(() => {
    if (route.params?.isParkingView) {
      setIsParkingView(route.params.isParkingView === 'true');
    }
    
    // Vérifier également par le rôle de l'utilisateur
    if (authState.role === 'PARKING') {
      setIsParkingView(true);
    }
  }, [route.params, authState.role]);

  // Debug des données du véhicule
  useEffect(() => {
    console.log('🔍 DONNÉES VÉHICULE COMPLÈTES:', {
      id: vehicule?.id,
      marque: vehicule?.marque,
      marqueRef: vehicule?.marqueRef,
      model: vehicule?.model,
      prix: vehicule?.prix,
      photos: vehicule?.photos,
      photosUrls: getPhotoUrls(vehicule?.photos),
      forSale: vehicule?.forSale,
      forRent: vehicule?.forRent,
      mileage: vehicule?.mileage,
      fuelType: vehicule?.fuelType,
      dureeGarantie: vehicule?.dureeGarantie,
      description: vehicule?.description,
      carteGrise: vehicule?.carteGrise,
      assurance: vehicule?.assurance,
      vignette: vehicule?.vignette,
      garantie: vehicule?.garantie,
      chauffeur: vehicule?.chauffeur,
      dureeAssurance: vehicule?.dureeAssurance
    });
  }, [vehicule]);

  // Setup notifications
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
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

  // Fonction pour vérifier l'état favoris (seulement si pas parking)
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

  // Vérifier l'état favoris au chargement initial
  useEffect(() => {
    checkFavoriteStatus();
  }, [vehicule?.id, isParkingView]);

  // Re-vérifier l'état favoris quand l'écran redevient actif
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

  // FONCTION DE SUPPRESSION CORRIGÉE
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
      
      console.log('🗑️ Tentative de suppression du véhicule:', vehicule.id);
      
      const response = await fetch(`${BASE_URL}/vehicules/${vehicule.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Réponse suppression:', response.status);

      if (response.ok) {
        Alert.alert(
          'Succès ✅',
          'Véhicule supprimé avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                // Retour à l'écran précédent après suppression
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
        console.error('❌ Erreur suppression:', errorText);
        let errorMessage = 'Erreur lors de la suppression';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Si ce n'est pas du JSON, utiliser le texte brut
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

  // FONCTION DE MODIFICATION
  const handleModify = () => {
    setActionMenuVisible(false);
    if (!vehicule) return;
    
    console.log('✏️ Navigation vers modification:', vehicule);
    
    // Préparer les données pour l'écran de modification
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
      dureeAssurance: vehicule.dureeAssurance
    };

    // Navigation vers l'écran de modification
    router.push({
      pathname: "/AjoutParking",
      params: { 
        vehicleToEdit: JSON.stringify(vehicleDataForEdit),
        mode: 'edit'
      }
    } as any);
  };

  if (!vehicule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6F00" />
          <Text style={{ marginTop: 10 }}>Chargement des détails du véhicule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render functions avec gestion des données manquantes
  const renderFeatureItem = (icon: React.ReactNode, label: string, value: any, condition: boolean = true) => {
    if (!condition) return null;
    
    const displayValue = value === undefined || value === null || value === '' 
      ? 'Non spécifié' 
      : (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value);
    
    return (
      <View style={styles.featureItem}>
        {icon}
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={[
          styles.featureValue,
          (value === undefined || value === null || value === '') && styles.unknownValue
        ]}>
          {displayValue}
        </Text>
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
      {/* Bouton favoris - CACHÉ si c'est le parking */}
      {!isParkingView && (
        <TouchableOpacity 
          style={[
            styles.favoriteButton,
            isFavorite && styles.favoriteButtonActive,
          ]} 
          onPress={toggleFavorite}
        >
          <FontAwesome5 
            name="heart" 
            size={24} 
            color={isFavorite ? "#FFF" : "#FF6F00"} 
            solid={isFavorite}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPagination = () => {
    if (photoUrls.length <= 1) return null;
    return (
      <View style={styles.pagination}>
        {photoUrls.map((_, index) => (
          <View key={index} style={[styles.paginationDot, index === currentImageIndex && styles.paginationDotActive]} />
        ))}
      </View>
    );
  };

  // Ouvrir modale (seulement si pas parking)
  const handleReservePress = () => {
    if (isParkingView) return;
    setModalVisible(true);
  };

  // Sélection type
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

  // Changement dates
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
    console.log('🚀 Début de la réservation...');

    try {
      const body = {
        vehicleId: vehicule.id,
        dateDebut: reservationType === 'LOCATION' ? startDate?.toISOString() : null,
        dateFin: reservationType === 'LOCATION' ? endDate?.toISOString() : null,
        type: reservationType,
      };

      console.log('📤 Envoi réservation:', body);

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
        console.error('❌ Erreur réponse serveur:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: 'Erreur réseau ou serveur' };
        }
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const newReservation = await response.json();
      console.log('✅ Réservation créée:', newReservation);

      // NOTIFICATION LOCALE POUR L'UTILISATEUR
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
        console.log('✅ Notification locale envoyée');
      } catch (notificationError) {
        console.warn('⚠️ Notification locale échouée:', notificationError);
      }

      // NOTIFICATION AU PARKING
      if (vehicule?.parking?.id) {
        try {
          const userInfo = authState.user || { prenom: 'Utilisateur', nom: '', id: 0 };
          
          const parkingMessage = `${userInfo.prenom} ${userInfo.nom} a réservé ${vehicule.marqueRef?.name || ''} ${vehicule.model || ''} pour ${reservationType.toLowerCase()}. Prix: ${vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : ''}`;

          console.log(`📤 Envoi notification au parking ${vehicule.parking.id}:`, parkingMessage);

          const notificationSuccess = await createReservationNotification({
            title: "🚗 NOUVELLE RÉSERVATION !",
            message: parkingMessage,
            parkingId: vehicule.parking.id,
            type: "RESERVATION"
          });

          if (notificationSuccess) {
            console.log(`✅ Notification envoyée au parking ${vehicule.parking.id}`);
          } else {
            console.warn(`⚠️ Notification échouée pour le parking ${vehicule.parking.id}`);
          }
        } catch (notificationError) {
          console.error("❌ Erreur notification parking:", notificationError);
        }
      } else {
        console.warn("⚠️ Parking ID non disponible");
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

  // Rendu du menu d'actions pour le parking
  const renderActionMenu = () => {
    if (!isParkingView) return null;

    return (
      <View style={styles.actionMenuContainer}>
        <TouchableOpacity 
          style={styles.actionMenuButton}
          onPress={() => setActionMenuVisible(true)}
        >
          <MaterialIcons name="more-vert" size={24} color="#666" />
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
                <MaterialIcons name="edit" size={20} color="#FF6F00" />
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
                    <MaterialIcons name="delete" size={20} color="#FF4444" />
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Carrousel avec bouton favoris intégré - CACHÉ si parking */}
        {photoUrls.length > 0 ? (
          <View>
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
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.placeholderImage]}>
            <FontAwesome5 name="car" size={60} color="#ccc" />
            <Text style={styles.noImageText}>Aucune photo disponible</Text>
            {/* Bouton favoris pour l'image placeholder - CACHÉ si parking */}
            {!isParkingView && (
              <TouchableOpacity 
                style={[
                  styles.favoriteButton,
                  isFavorite && styles.favoriteButtonActive,
                ]} 
                onPress={toggleFavorite}
              >
                <FontAwesome5 
                  name="heart" 
                  size={24} 
                  color={isFavorite ? "#FFF" : "#FF6F00"} 
                  solid={isFavorite}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* En-tête */}
        <View style={styles.headerCard}>
          <Text style={styles.carName}>
            {vehicule.marqueRef?.name || vehicule.marque || 'Marque inconnue'} {vehicule.model || 'Modèle inconnu'}
          </Text>
          <Text style={styles.priceValue}>
            {vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : 'Prix non disponible'}
          </Text>
          {vehicule.parking && (
            <Text style={styles.parkingName}>
              📍 {vehicule.parking.nom}
            </Text>
          )}
          {/* Badges pour vente/location avec fallback */}
          <View style={styles.badgesContainer}>
            {vehicule.forSale && (
              <View style={[styles.badge, styles.saleBadge]}>
                <Text style={styles.badgeText}>À vendre</Text>
              </View>
            )}
            {vehicule.forRent && (
              <View style={[styles.badge, styles.rentBadge]}>
                <Text style={styles.badgeText}>À louer</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton réservation - CACHÉ si c'est le parking */}
        {!isParkingView && (
          <TouchableOpacity style={styles.reserveButton} onPress={handleReservePress}>
            <Text style={styles.reserveButtonText}>Réserver maintenant</Text>
          </TouchableOpacity>
        )}

        {/* Message spécial pour le parking */}
        {isParkingView && (
          <View style={styles.parkingMessage}>
            <MaterialIcons name="business" size={24} color="#FF6F00" />
            <Text style={styles.parkingMessageText}>
              Vue gestion - Votre véhicule
            </Text>
          </View>
        )}

        {/* Détails du véhicule avec menu d'actions */}
        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Détails du véhicule</Text>
            {renderActionMenu()}
          </View>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureRow}>
              {renderFeatureItem(
                <MaterialIcons name="branding-watermark" size={22} color="#FF6F00" />,
                'Marque',
                vehicule.marqueRef?.name || vehicule.marque,
                !!(vehicule.marqueRef?.name || vehicule.marque)
              )}
              
              {renderFeatureItem(
                <FontAwesome5 name="tachometer-alt" size={20} color="#FF6F00" />,
                'Kilométrage',
                vehicule.mileage ? `${vehicule.mileage.toLocaleString()} km` : null,
                vehicule.mileage !== undefined && vehicule.mileage !== null
              )}
            </View>

            <View style={styles.featureRow}>
              {renderFeatureItem(
                <FontAwesome5 name="gas-pump" size={20} color="#FF6F00" />,
                'Carburant',
                vehicule.fuelType,
                !!vehicule.fuelType
              )}
              
              {renderFeatureItem(
                <FontAwesome5 name="shield-alt" size={20} color="#FF6F00" />,
                'Garantie',
                vehicule.dureeGarantie ? `${vehicule.dureeGarantie} mois` : (vehicule.garantie ? 'Incluse' : 'Non incluse'),
                vehicule.dureeGarantie !== undefined || vehicule.garantie !== undefined
              )}
            </View>

            <View style={styles.featureRow}>
              {renderFeatureItem(
                <FontAwesome5 name="user-tie" size={20} color="#FF6F00" />,
                'Chauffeur',
                vehicule.chauffeur,
                vehicule.chauffeur !== undefined
              )}
              
              {renderFeatureItem(
                <FontAwesome5 name="file-contract" size={20} color="#FF6F00" />,
                'Assurance',
                vehicule.dureeAssurance ? `${vehicule.dureeAssurance} mois` : (vehicule.assurance ? 'Incluse' : 'Non incluse'),
                vehicule.dureeAssurance !== undefined || vehicule.assurance !== undefined
              )}
            </View>
          </View>

          {/* Section description */}
          {vehicule.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{vehicule.description}</Text>
            </View>
          )}
        </View>

        {/* Options supplémentaires */}
        <View style={styles.optionsCard}>
          <Text style={styles.sectionTitle}>Options incluses</Text>
          
          <View style={styles.optionsList}>
            <View style={styles.optionItem}>
              <MaterialIcons 
                name={vehicule.carteGrise ? "check-circle" : "cancel"} 
                size={20} 
                color={vehicule.carteGrise ? "#28a745" : "#dc3545"} 
              />
              <Text style={styles.optionText}>
                Carte Grise: {vehicule.carteGrise ? 'Disponible' : 'Non disponible'}
              </Text>
            </View>
            
            <View style={styles.optionItem}>
              <MaterialIcons 
                name={vehicule.assurance ? "check-circle" : "cancel"} 
                size={20} 
                color={vehicule.assurance ? "#28a745" : "#dc3545"} 
              />
              <Text style={styles.optionText}>
                Assurance: {vehicule.assurance ? 'Incluse' : 'Non incluse'}
              </Text>
            </View>
            
            <View style={styles.optionItem}>
              <MaterialIcons 
                name={vehicule.vignette ? "check-circle" : "cancel"} 
                size={20} 
                color={vehicule.vignette ? "#28a745" : "#dc3545"} 
              />
              <Text style={styles.optionText}>
                Vignette: {vehicule.vignette ? 'Valide' : 'Non valide'}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques */}
        {vehicule.stats && (
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5 name="eye" size={16} color="#666" />
                <Text style={styles.statValue}>{vehicule.stats.vues || 0}</Text>
                <Text style={styles.statLabel}>Vues</Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="calendar-check" size={16} color="#666" />
                <Text style={styles.statValue}>{vehicule.stats.reservations || 0}</Text>
                <Text style={styles.statLabel}>Réservations</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modale de réservation - CACHÉE si parking */}
      {!isParkingView && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                Réserver {vehicule.marqueRef?.name || vehicule.marque || 'Marque'} {vehicule.model || 'Modèle'}
              </Text>

              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[styles.typeButton, reservationType === 'ACHAT' && styles.typeButtonSelected]}
                  onPress={() => selectType('ACHAT')}
                >
                  <FontAwesome5 name="shopping-cart" size={20} color={reservationType === 'ACHAT' ? '#FFF' : '#FF6F00'} style={styles.typeIcon} />
                  <Text style={[styles.typeButtonText, reservationType === 'ACHAT' && styles.typeButtonTextSelected]}>Achat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, reservationType === 'LOCATION' && styles.typeButtonSelected]}
                  onPress={() => selectType('LOCATION')}
                >
                  <FontAwesome5 name="calendar-alt" size={20} color={reservationType === 'LOCATION' ? '#FFF' : '#FF6F00'} style={styles.typeIcon} />
                  <Text style={[styles.typeButtonText, reservationType === 'LOCATION' && styles.typeButtonTextSelected]}>Location</Text>
                </TouchableOpacity>
              </View>

              {reservationType === 'LOCATION' && (
                <View style={styles.datePickers}>
                  <Text style={styles.dateLabel}>Date de début</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                    <FontAwesome5 name="calendar" size={16} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateButtonText}>
                      {startDate ? startDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
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

                  <Text style={styles.dateLabel}>Date de fin</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                    <FontAwesome5 name="calendar" size={16} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateButtonText}>
                      {endDate ? endDate.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
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
              )}

              {reservationType === 'ACHAT' && (
                <View style={styles.confirmMessage}>
                  <FontAwesome5 name="info-circle" size={20} color="#FF6F00" style={styles.confirmIcon} />
                  <Text style={styles.confirmText}>
                    Vous êtes sur le point d'acheter ce véhicule pour {vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : 'le prix indiqué'}. Confirmez pour procéder.
                  </Text>
                </View>
              )}

              <View style={styles.notificationInfo}>
                <MaterialIcons name="notifications" size={16} color="#FF6F00" />
                <Text style={styles.notificationInfoText}>
                  Vous recevrez une confirmation par notification
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.confirmButton, 
                    isLoading && styles.confirmButtonDisabled
                  ]} 
                  onPress={confirmReservation} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      Confirmer {reservationType === 'ACHAT' ? 'l\'achat' : 'la location'}
                    </Text>
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
    backgroundColor: '#f8f9fa'
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: width,
    height: 250,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  favoriteButtonActive: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: 5,
  },
  paginationDotActive: {
    backgroundColor: '#FFF',
    width: 12,
  },
  headerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  carName: { 
    fontSize: 24,
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  priceValue: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#FF6F00',
    marginBottom: 12,
  },
  parkingName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  saleBadge: {
    backgroundColor: '#28a745',
  },
  rentBadge: {
    backgroundColor: '#17a2b8',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  parkingMessage: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6F00',
  },
  parkingMessageText: {
    fontSize: 16,
    color: '#FF6F00',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  reserveButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#FF6F00',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  reserveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  actionMenuContainer: {
    position: 'relative',
  },
  actionMenuButton: {
    padding: 4,
    borderRadius: 20,
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    width: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    color: '#333',
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
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 80,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    minWidth: 150,
  },
  featureLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  unknownValue: {
    fontStyle: 'italic',
    color: '#999',
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  optionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionsList: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6F00',
    backgroundColor: '#FFF',
  },
  typeButtonSelected: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  typeIcon: {
    marginRight: 8,
  },
  typeButtonText: {
    fontSize: 16,
    color: '#FF6F00',
    fontWeight: 'bold',
  },
  typeButtonTextSelected: {
    color: '#FFF',
  },
  datePickers: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  confirmMessage: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmIcon: {
    marginRight: 12,
  },
  confirmText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  notificationInfoText: {
    fontSize: 14,
    color: '#FF6F00',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#FF6F00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginLeft: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#FFB74D',
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
});

export default CarDetailScreen;