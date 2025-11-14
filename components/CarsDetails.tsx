// screens/CarDetailScreen.tsx
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
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from './services/listeVoiture';
import { useAuth } from '../context/AuthContext';
import { favorisService } from './services/favorisService';
import { viewsService } from './services/viewsService';
import { createReservationNotification, showLocalNotification } from './services/Notification';

interface Marque {
  id: number;
  name: string;
  logoUrl?: string;
  isCustom?: boolean;
}

interface Vehicule {
  id: number;
  marqueRef?: Marque;
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
  createdAt?: string;
}

const { width } = Dimensions.get('window');

function CarDetailScreen() {
  const route = useRoute<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [reservationType, setReservationType] = useState<'LOCATION' | 'ACHAT' | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const { authState } = useAuth();

  let vehicule: Vehicule | null = null;
  if (route.params?.vehicule) {
    try {
      if (typeof route.params.vehicule === 'string') {
        vehicule = JSON.parse(route.params.vehicule);
      } else {
        vehicule = route.params.vehicule;
      }
    } catch (error) {
      console.error('Erreur parsing véhicule:', error);
    }
  }

  // === INCRÉMENTER LES VUES ===
  useEffect(() => {
    if (vehicule?.id) {
      viewsService.incrementViews(vehicule.id);
    }
  }, [vehicule?.id]);

  // === FAVORIS ===
  const checkFavoriteStatus = async () => {
    if (!vehicule?.id) return;
    try {
      const favorite = await favorisService.isInFavoris(vehicule.id);
      setIsFavorite(favorite);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  useEffect(() => checkFavoriteStatus(), [vehicule?.id]);
  useFocusEffect(React.useCallback(() => { if (vehicule?.id) checkFavoriteStatus(); }, [vehicule?.id]));

  const toggleFavorite = async () => {
    if (!vehicule) return;
    const newState = !isFavorite;
    setIsFavorite(newState);
    try {
      newState ? await favorisService.addToFavoris(vehicule) : await favorisService.removeFromFavoris(vehicule.id);
    } catch (error) {
      setIsFavorite(!newState);
    }
  };

  if (!vehicule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6F00" />
          <Text style={{ marginTop: 10 }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getPhotoUrls = (photos: string[] | string | undefined): string[] => {
    if (!photos) return [];
    if (Array.isArray(photos)) {
      return photos.map(p => p.startsWith('http') ? p : `${BASE_URL}${p}`);
    }
    return [photos.startsWith('http') ? photos : `${BASE_URL}${photos}`];
  };

  const photoUrls = getPhotoUrls(vehicule.photos);

  const renderFeatureItem = (icon: React.ReactNode, label: string, value: any, condition: boolean = true) => {
    if (!condition || value === undefined || value === null || value === '') return null;
    return (
      <View style={styles.featureItem}>
        {icon}
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureValue}>
          {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value}
        </Text>
      </View>
    );
  };

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.carImage} resizeMode="cover" />
      <TouchableOpacity style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]} onPress={toggleFavorite}>
        <FontAwesome5 name="heart" size={24} color={isFavorite ? "#FFF" : "#FF6F00"} solid={isFavorite} />
      </TouchableOpacity>
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

  const handleReservePress = () => setModalVisible(true);
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

  // === CONFIRMER RÉSERVATION AVEC NOTIFICATIONS PUSH ===
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
      return Alert.alert('Connexion requise', 'Vous devez vous connecter pour réserver');
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
        try { errorData = JSON.parse(errorText); } catch { errorData = { message: 'Erreur serveur' }; }
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const newReservation = await response.json();

      // === 1. NOTIFICATION LOCALE À L'UTILISATEUR ===
      await showLocalNotification(
        "Réservation confirmée !",
        `Votre ${reservationType.toLowerCase()} de ${vehicule.marqueRef?.name || ''} ${vehicule.model} est confirmée !`,
        { type: 'RESERVATION_CONFIRMATION', reservationId: newReservation.id }
      );

      // === 2. PUSH AU PARKING (via backend) ===
      if (vehicule?.parking?.id) {
        const userName = authState.user?.prenom || 'Un utilisateur';
        const message = `${userName} a réservé ${vehicule.marqueRef?.name || ''} ${vehicule.model} pour ${reservationType.toLowerCase()}. Prix: ${vehicule.prix.toLocaleString()} FCFA.`;

        await createReservationNotification({
          title: "NOUVELLE RÉSERVATION !",
          message,
          parkingId: vehicule.parking.id,
          type: "RESERVATION"
        });
      }

      Alert.alert('Succès', `Réservation ${reservationType.toLowerCase()} confirmée !`, [
        { text: 'OK', onPress: () => setModalVisible(false) }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Échec de la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const isParking = authState.user?.role === 'PARKING' || authState.user?.isParking;
  const formatCreationDate = (dateStr?: string) => {
    if (!dateStr) return 'Date inconnue';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* === CARROUSEL === */}
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
              onMomentumScrollEnd={(e) => setCurrentImageIndex(Math.floor(e.nativeEvent.contentOffset.x / width))}
            />
            {renderPagination()}
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.placeholderImage]}>
            <FontAwesome5 name="car" size={60} color="#ccc" />
            <TouchableOpacity style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]} onPress={toggleFavorite}>
              <FontAwesome5 name="heart" size={24} color={isFavorite ? "#FFF" : "#FF6F00"} solid={isFavorite} />
            </TouchableOpacity>
          </View>
        )}

        {/* === EN-TÊTE === */}
        <View style={styles.headerCard}>
          <Text style={styles.carName}>
            {vehicule.marqueRef?.name || 'Marque inconnue'} {vehicule.model || 'Modèle inconnu'}
          </Text>
          <Text style={styles.priceValue}>
            {vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : 'Prix non disponible'}
          </Text>
          {vehicule.parking && (
            <Text style={styles.parkingName}>Location: {vehicule.parking.nom}</Text>
          )}
        </View>

        {/* === BOUTON RÉSERVER (client uniquement) === */}
        {!isParking && (
          <TouchableOpacity style={styles.reserveButton} onPress={handleReservePress}>
            <Text style={styles.reserveButtonText}>Réserver maintenant</Text>
          </TouchableOpacity>
        )}

        {/* === DÉTAILS === */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Détails du véhicule</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureRow}>
              {renderFeatureItem(<MaterialIcons name="branding-watermark" size={22} color="#FF6F00" />, 'Marque', vehicule.marqueRef?.name, !!vehicule.marqueRef)}
              {renderFeatureItem(<FontAwesome5 name="tachometer-alt" size={20} color="#FF6F00" />, 'Kilométrage', vehicule.mileage ? `${vehicule.mileage.toLocaleString()} km` : null, vehicule.mileage !== undefined)}
            </View>
            <View style={styles.featureRow}>
              {renderFeatureItem(<FontAwesome5 name="gas-pump" size={20} color="#FF6F00" />, 'Carburant', vehicule.fuelType, !!vehicule.fuelType)}
              {renderFeatureItem(<FontAwesome5 name="shield-alt" size={20} color="#FF6F00" />, 'Garantie', vehicule.dureeGarantie ? `${vehicule.dureeGarantie} mois` : null, vehicule.dureeGarantie !== undefined)}
            </View>
          </View>

          {vehicule.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{vehicule.description}</Text>
            </View>
          )}
        </View>

        {/* === OPTIONS === */}
        {(vehicule.carteGrise !== undefined || vehicule.assurance !== undefined || vehicule.vignette !== undefined) && (
          <View style={styles.optionsCard}>
            <Text style={styles.sectionTitle}>Options</Text>
            <View style={styles.optionsList}>
              {vehicule.carteGrise !== undefined && (
                <View style={styles.optionItem}>
                  <MaterialIcons name={vehicule.carteGrise ? "check-circle" : "cancel"} size={20} color={vehicule.carteGrise ? "#28a745" : "#dc3545"} />
                  <Text style={styles.optionText}>Carte Grise: {vehicule.carteGrise ? 'Disponible' : 'Non disponible'}</Text>
                </View>
              )}
              {vehicule.assurance !== undefined && (
                <View style={styles.optionItem}>
                  <MaterialIcons name={vehicule.assurance ? "check-circle" : "cancel"} size={20} color={vehicule.assurance ? "#28a745" : "#dc3545"} />
                  <Text style={styles.optionText}>Assurance: {vehicule.assurance ? 'Incluse' : 'Non incluse'}</Text>
                </View>
              )}
              {vehicule.vignette !== undefined && (
                <View style={styles.optionItem}>
                  <MaterialIcons name={vehicule.vignette ? "check-circle" : "cancel"} size={20} color={vehicule.vignette ? "#28a745" : "#dc3545"} />
                  <Text style={styles.optionText}>Vignette: {vehicule.vignette ? 'Valide' : 'Non valide'}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* === STATISTIQUES DYNAMIQUES === */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <FontAwesome5 name="eye" size={16} color="#666" />
              <Text style={styles.statValue}>{vehicule.stats?.vues || 0}</Text>
              <Text style={styles.statLabel}>Vues</Text>
            </View>

            {isParking && (
              <View style={styles.statItem}>
                <FontAwesome5 name="calendar-check" size={16} color="#666" />
                <Text style={styles.statValue}>{vehicule.stats?.reservations || 0}</Text>
                <Text style={styles.statLabel}>Réservations</Text>
              </View>
            )}

            <View style={styles.statItem}>
              <FontAwesome5 name="calendar-plus" size={16} color="#666" />
              <Text style={styles.statValue}>{formatCreationDate(vehicule.createdAt || vehicule.stats?.createdAt)}</Text>
              <Text style={styles.statLabel}>Créé le</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* === MODALE RÉSERVATION === */}
      {!isParking && (
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Réserver {vehicule.marqueRef?.name || 'Marque'} {vehicule.model}</Text>

              <View style={styles.typeButtons}>
                <TouchableOpacity style={[styles.typeButton, reservationType === 'ACHAT' && styles.typeButtonSelected]} onPress={() => selectType('ACHAT')}>
                  <FontAwesome5 name="shopping-cart" size={20} color={reservationType === 'ACHAT' ? '#FFF' : '#FF6F00'} style={styles.typeIcon} />
                  <Text style={[styles.typeButtonText, reservationType === 'ACHAT' && styles.typeButtonTextSelected]}>Achat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeButton, reservationType === 'LOCATION' && styles.typeButtonSelected]} onPress={() => selectType('LOCATION')}>
                  <FontAwesome5 name="calendar-alt" size={20} color={reservationType === 'LOCATION' ? '#FFF' : '#FF6F00'} style={styles.typeIcon} />
                  <Text style={[styles.typeButtonText, reservationType === 'LOCATION' && styles.typeButtonTextSelected]}>Location</Text>
                </TouchableOpacity>
              </View>

              {reservationType === 'LOCATION' && (
                <View style={styles.datePickers}>
                  <Text style={styles.dateLabel}>Date de début</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                    <FontAwesome5 name="calendar" size={16} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateButtonText}>{startDate ? startDate.toLocaleDateString() : 'Sélectionner'}</Text>
                  </TouchableOpacity>
                  {showStartPicker && <DateTimePicker value={startDate || new Date()} mode="date" onChange={onStartDateChange} minimumDate={new Date()} />}

                  <Text style={styles.dateLabel}>Date de fin</Text>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                    <FontAwesome5 name="calendar" size={16} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateButtonText}>{endDate ? endDate.toLocaleDateString() : 'Sélectionner'}</Text>
                  </TouchableOpacity>
                  {showEndPicker && <DateTimePicker value={endDate || new Date()} mode="date" onChange={onEndDateChange} minimumDate={startDate ? new Date(startDate.getTime() + 86400000) : new Date()} />}
                </View>
              )}

              {reservationType === 'ACHAT' && (
                <View style={styles.confirmMessage}>
                  <FontAwesome5 name="info-circle" size={20} color="#FF6F00" style={styles.confirmIcon} />
                  <Text style={styles.confirmText}>
                    Achat pour {vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : 'le prix indiqué'}.
                  </Text>
                </View>
              )}

              <View style={styles.notificationInfo}>
                <MaterialIcons name="notifications" size={16} color="#FF6F00" />
                <Text style={styles.notificationInfoText}>Confirmation par notification</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]} onPress={confirmReservation} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.confirmButtonText}>Confirmer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// === STYLES (inchangés) ===
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  imageContainer: { width: width, height: 250, backgroundColor: '#f0f0f0' },
  carImage: { width: '100%', height: '100%' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  favoriteButton: {
    position: 'absolute', top: 16, right: 16, width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FFF', borderWidth: 2, borderColor: '#FF6F00',
    justifyContent: 'center', alignItems: 'center', elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  favoriteButtonActive: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 10, alignSelf: 'center' },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)', margin: 5 },
  paginationDotActive: { backgroundColor: '#FFF', width: 12 },
  headerCard: {
    backgroundColor: '#FFF', borderRadius: 12, marginHorizontal: 16, marginTop: 16,
    padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center',
  },
  carName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  priceValue: { fontSize: 22, fontWeight: 'bold', color: '#FF6F00', marginBottom: 4 },
  parkingName: { fontSize: 14, color: '#666', marginTop: 4 },
  reserveButton: {
    marginHorizontal: 16, marginVertical: 16, backgroundColor: '#FF6F00',
    paddingVertical: 16, borderRadius: 10, alignItems: 'center', elevation: 3,
  },
  reserveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  detailsCard: { backgroundColor: '#FFF', borderRadius: 12, margin: 16, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  featuresGrid: { marginBottom: 16 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, minHeight: 80 },
  featureItem: { flex: 1, alignItems: 'center', padding: 8, minWidth: 150 },
  featureLabel: { fontSize: 14, color: '#666', marginTop: 6, marginBottom: 4, textAlign: 'center' },
  featureValue: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },
  descriptionSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  descriptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#666', lineHeight: 20 },
  optionsCard: { backgroundColor: '#FFF', borderRadius: 12, margin: 16, marginTop: 0, padding: 20, elevation: 2 },
  optionsList: { marginTop: 8 },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionText: { fontSize: 16, color: '#333', marginLeft: 12 },
  statsCard: { backgroundColor: '#FFF', borderRadius: 12, margin: 16, marginTop: 0, padding: 20, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' },
  statItem: { alignItems: 'center', padding: 10, minWidth: 80 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 },
  statLabel: { fontSize: 14, color: '#666', marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400, elevation: 5 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' },
  typeButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  typeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#FF6F00', backgroundColor: '#FFF' },
  typeButtonSelected: { backgroundColor: '#FF6F00', borderColor: '#FF6F00' },
  typeIcon: { marginRight: 8 },
  typeButtonText: { fontSize: 16, color: '#FF6F00', fontWeight: 'bold' },
  typeButtonTextSelected: { color: '#FFF' },
  datePickers: { marginBottom: 24 },
  dateLabel: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '600' },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', marginBottom: 16 },
  dateIcon: { marginRight: 12 },
  dateButtonText: { fontSize: 16, color: '#333' },
  confirmMessage: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  confirmIcon: { marginRight: 12 },
  confirmText: { fontSize: 14, color: '#333', flex: 1, lineHeight: 20 },
  notificationInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, padding: 12, backgroundColor: '#fff3e0', borderRadius: 8 },
  notificationInfoText: { fontSize: 14, color: '#FF6F00', marginLeft: 8, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelButton: { backgroundColor: '#f8f9fa', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, flex: 1, alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#ddd' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  confirmButton: { backgroundColor: '#FF6F00', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, flex: 1, alignItems: 'center', marginLeft: 12 },
  confirmButtonDisabled: { backgroundColor: '#FFB74D', opacity: 0.7 },
  confirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default CarDetailScreen;