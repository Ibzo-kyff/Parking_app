import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Animated,
  Dimensions,
  Modal,
  Switch,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getVehicules } from '../../components/services/listeVoiture';
import { router } from 'expo-router';
import { BASE_URL } from '../../components/services/listeVoiture';
import { useLocalSearchParams } from 'expo-router';

interface Parking {
  id: number;
  name?: string;
  logo?: string;
}

interface Marque {
  id: number;
  name: string;
  logoUrl?: string;
  isCustom?: boolean;
}

interface Vehicule {
  id: number;
  marqueRef?: Marque; // Relation avec la marque
  model: string;
  prix: number;
  photos: string[] | string;
  parking?: Parking;
  fuelType?: string;
  mileage?: number;
  garantie?: boolean;
  assurance?: boolean;
  status?: string;
}

const { width } = Dimensions.get('window');

const ListVoiture = () => {
  const params = useLocalSearchParams();
  const selectedMarqueFromParams = params.selectedMarque as string;
  const marqueIdFromParams = params.marqueId as string;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [filteredVehicules, setFilteredVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: '',
    maxPrice: '',
    withWarranty: false,
    withInsurance: false,
    minMileage: '',
    maxMileage: '',
    forSale: false,
    forRent: false,
  });
  const filterAnim = useState(new Animated.Value(0))[0];

  // Types de carburant courants
  const commonFuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiculesData = await getVehicules();
        setVehicules(vehiculesData);
        setFilteredVehicules(vehiculesData);
        
        // Extraire les types de carburant uniques
        const fuelTypes = [...new Set(vehiculesData
          .map((v: { fuelType: any; }) => v.fuelType)
          .filter(Boolean))] as string[];
        
        setAvailableFuelTypes(fuelTypes);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = applyAdvancedFilters(vehicules.filter(vehicule =>
        (vehicule.marqueRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        vehicule.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicule.parking?.name && vehicule.parking.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
      setFilteredVehicules(filtered);
      
      // Afficher les filtres après une recherche
      if (!showFilters) {
        Animated.timing(filterAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
        setShowFilters(true);
      }
    } else {
      const filtered = applyAdvancedFilters(vehicules);
      setFilteredVehicules(filtered);
      
      // Cacher les filtres si la recherche est vide
      if (showFilters) {
        Animated.timing(filterAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setShowFilters(false));
      }
    }
  }, [searchQuery, vehicules, advancedFilters]);
  // Appliquer la marque sélectionnée depuis les paramètres
  useEffect(() => {
    if (selectedMarqueFromParams) {
      setSearchQuery(selectedMarqueFromParams);
      // Le filtre se fera automatiquement via l'effet existant de searchQuery
    }
  }, [selectedMarqueFromParams]);

  const applyAdvancedFilters = (vehicles: Vehicule[]) => {
    let filtered = [...vehicles];
    
    // Filtre par prix minimum
    if (advancedFilters.minPrice) {
      const minPrice = parseFloat(advancedFilters.minPrice);
      filtered = filtered.filter(v => v.prix >= minPrice);
    }
    
    // Filtre par prix maximum
    if (advancedFilters.maxPrice) {
      const maxPrice = parseFloat(advancedFilters.maxPrice);
      filtered = filtered.filter(v => v.prix <= maxPrice);
    }
    
    // Filtre par garantie
    if (advancedFilters.withWarranty) {
      filtered = filtered.filter(v => v.garantie);
    }
    
    // Filtre par assurance
    if (advancedFilters.withInsurance) {
      filtered = filtered.filter(v => v.assurance);
    }
    
    // Filtre par kilométrage minimum
    if (advancedFilters.minMileage && advancedFilters.minMileage !== '') {
      const minMileage = parseInt(advancedFilters.minMileage);
      filtered = filtered.filter(v => v.mileage && v.mileage >= minMileage);
    }
    
    // Filtre par kilométrage maximum
    if (advancedFilters.maxMileage && advancedFilters.maxMileage !== '') {
      const maxMileage = parseInt(advancedFilters.maxMileage);
      filtered = filtered.filter(v => v.mileage && v.mileage <= maxMileage);
    }
    
    // Filtre par statut (en vente/en location)
    if (advancedFilters.forSale) {
      filtered = filtered.filter(v => v.status === 'DISPONIBLE' || v.status === 'EN_VENTE');
    }
    
    if (advancedFilters.forRent) {
      filtered = filtered.filter(v => v.status === 'EN_LOCATION');
    }
    
    return filtered;
  };

  const getPhotoUrl = (photos: string[] | string | undefined) => {
    if (!photos) return null;
    const photo = Array.isArray(photos) ? photos[0] : photos;
    return photo.startsWith('http') ? photo : `${BASE_URL}${photo}`;
  };

  const navigateToDetails = (vehicule: Vehicule) => {
    router.push({
      pathname: '/(Clients)/CreateListingScreen',
      params: { vehicule: JSON.stringify(vehicule) }
    });
  };

  const applyFilter = (filterType: string) => {
    setActiveFilter(filterType);
    
    let filtered = [...vehicules];
    
    if (searchQuery) {
      filtered = filtered.filter(vehicule =>
        (vehicule.marqueRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        vehicule.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicule.parking?.name && vehicule.parking.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Appliquer le filtre spécifique
    switch(filterType) {
      case 'economique':
        filtered = filtered.filter(v => v.prix < 10000000); // Moins de 10 millions
        break;
      case 'luxe':
        filtered = filtered.filter(v => v.prix > 30000000); // Plus de 30 millions
        break;
      case 'vente':
        filtered = filtered.filter(v => v.status === 'DISPONIBLE' || v.status === 'EN_VENTE');
        break;
      case 'location':
        filtered = filtered.filter(v => v.status === 'EN_LOCATION');
        break;
      default:
        // Pour les filtres de carburant
        if (filterType !== 'all') {
          filtered = filtered.filter(v => v.fuelType === filterType);
        }
        break;
    }
    
    // Appliquer les filtres avancés
    filtered = applyAdvancedFilters(filtered);
    
    setFilteredVehicules(filtered);
  };

  const resetFilters = () => {
    setActiveFilter('all');
    setAdvancedFilters({
      minPrice: '',
      maxPrice: '',
      withWarranty: false,
      withInsurance: false,
      minMileage: '',
      maxMileage: '',
      forSale: false,
      forRent: false,
    });
    setFilteredVehicules(vehicules);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  const filterTranslateY = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 0]
  });

  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header avec titre */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Liste des voitures</Text>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <FontAwesome name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une voiture, marque..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtres contextuels (apparaissent seulement après recherche) */}
        {showFilters && (
          <Animated.View 
            style={[
              styles.filterContainer, 
              { 
                transform: [{ translateY: filterTranslateY }],
                opacity: filterOpacity,
              }
            ]}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
              {/* Bouton filtre avancé */}
              <TouchableOpacity 
                style={styles.advancedFilterButton}
                onPress={() => setShowAdvancedFilters(true)}
              >
                <MaterialIcons name="filter-list" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
                onPress={() => applyFilter('all')}
              >
                <Text style={[styles.filterButtonText, activeFilter === 'all' && styles.filterButtonTextActive]}>
                  Tous
                </Text>
              </TouchableOpacity>
              
              {/* Filtres de base */}
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'economique' && styles.filterButtonActive]}
                onPress={() => applyFilter('economique')}
              >
                <Text style={[styles.filterButtonText, activeFilter === 'economique' && styles.filterButtonTextActive]}>
                  Économique
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'luxe' && styles.filterButtonActive]}
                onPress={() => applyFilter('luxe')}
              >
                <Text style={[styles.filterButtonText, activeFilter === 'luxe' && styles.filterButtonTextActive]}>
                  Luxe
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'vente' && styles.filterButtonActive]}
                onPress={() => applyFilter('vente')}
              >
                <Text style={[styles.filterButtonText, activeFilter === 'vente' && styles.filterButtonTextActive]}>
                  En vente
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButton, activeFilter === 'location' && styles.filterButtonActive]}
                onPress={() => applyFilter('location')}
              >
                <Text style={[styles.filterButtonText, activeFilter === 'location' && styles.filterButtonTextActive]}>
                  En location
                </Text>
              </TouchableOpacity>
              
              {/* Afficher les types de carburant disponibles comme filtres */}
              {commonFuelTypes.filter(fuel => 
                availableFuelTypes.includes(fuel)
              ).slice(0, 3).map((fuel) => (
                <TouchableOpacity 
                  key={fuel}
                  style={[styles.filterButton, activeFilter === fuel && styles.filterButtonActive]}
                  onPress={() => applyFilter(fuel)}
                >
                  <Text style={[styles.filterButtonText, activeFilter === fuel && styles.filterButtonTextActive]}>
                    {fuel}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Résultats de recherche */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            showFilters && { paddingTop: 60 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {filteredVehicules.length === 0 ? (
            <View style={styles.noResults}>
              <FontAwesome name="search" size={50} color="#ccc" />
              <Text style={styles.noResultsText}>Aucun véhicule trouvé</Text>
              <Text style={styles.noResultsSubText}>Essayez d'autres termes de recherche ou modifiez vos filtres</Text>
              <TouchableOpacity style={styles.resetFilterButton} onPress={resetFilters}>
                <Text style={styles.resetFilterButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredVehicules.map((item) => {
              const photoUrl = getPhotoUrl(item.photos);
              const parkingLogoUrl = item.parking?.logo
                ? item.parking.logo.startsWith('http')
                  ? item.parking.logo
                  : `${BASE_URL}${item.parking.logo}`
                : null;
              const parkingName = item.parking?.name || 'Parking inconnu';

              return (
                <View key={item.id} style={styles.card}>
                  {/* Logo et nom du parking */}
                  <View style={styles.parkingHeader}>
                    {parkingLogoUrl ? (
                      <Image 
                        source={{ uri: parkingLogoUrl }} 
                        style={styles.parkingLogo} 
                        resizeMode="contain"
                      />
                    ) : (
                      <FontAwesome name="building" size={24} color="gray" />
                    )}
                    <Text style={styles.parkingName} numberOfLines={1}>{parkingName}</Text>
                  </View>

                  {/* Image véhicule + infos */}
                  <View style={styles.vehiculeContainer}>
                    <TouchableOpacity 
                      onPress={() => navigateToDetails(item)}
                      style={styles.imageContainer}
                    >
                      {photoUrl ? (
                        <Image 
                          source={{ uri: photoUrl }} 
                          style={styles.carImage} 
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <FontAwesome name="car" size={40} color="gray" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.vehiculeInfo}>
                      <Text style={styles.carTitle} numberOfLines={1}>
                        {item.marqueRef?.name || 'Marque inconnue'} {item.model}
                      </Text>
                      <Text style={styles.carPrice}>Prix: {item.prix.toLocaleString()} FCFA</Text>
                      
                      {/* Badge de statut */}
                      {item.status && (
                        <View style={[
                          styles.statusBadge,
                          item.status === 'EN_LOCATION' && styles.rentBadge,
                          item.status === 'EN_VENTE' && styles.saleBadge,
                          item.status === 'DISPONIBLE' && styles.availableBadge
                        ]}>
                          <Text style={styles.statusText}>
                            {item.status === 'EN_LOCATION' ? 'En location' : 
                             item.status === 'EN_VENTE' ? 'En vente' : 'Disponible'}
                          </Text>
                        </View>
                      )}
                      
                      {/* Informations supplémentaires */}
                      <View style={styles.additionalInfo}>
                        {item.fuelType && (
                          <View style={styles.infoBadge}>
                            <Ionicons name="flash" size={12} color="#666" />
                            <Text style={styles.infoText}>{item.fuelType}</Text>
                          </View>
                        )}
                        {item.garantie && (
                          <View style={[styles.infoBadge, styles.warrantyBadge]}>
                            <Ionicons name="shield-checkmark" size={12} color="#28a745" />
                            <Text style={[styles.infoText, styles.warrantyText]}>Garantie</Text>
                          </View>
                        )}
                      </View>

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
            })
          )}
        </ScrollView>

        {/* Modal de filtres avancés */}
        <Modal
          visible={showAdvancedFilters}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAdvancedFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtres avancés</Text>
                <TouchableOpacity onPress={() => setShowAdvancedFilters(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Filtre par prix */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Prix (FCFA)</Text>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Min</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={advancedFilters.minPrice}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, minPrice: text})}
                      />
                    </View>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Max</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Max"
                        keyboardType="numeric"
                        value={advancedFilters.maxPrice}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, maxPrice: text})}
                      />
                    </View>
                  </View>
                </View>

                {/* Filtre par kilométrage */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Kilométrage</Text>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Min</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={advancedFilters.minMileage}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, minMileage: text})}
                      />
                    </View>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Max</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Max"
                        keyboardType="numeric"
                        value={advancedFilters.maxMileage}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, maxMileage: text})}
                      />
                    </View>
                  </View>
                </View>

                {/* Filtres par options */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Options</Text>
                  <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Avec garantie</Text>
                    <Switch
                      value={advancedFilters.withWarranty}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, withWarranty: value})}
                    />
                  </View>
                  <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>Avec assurance</Text>
                    <Switch
                      value={advancedFilters.withInsurance}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, withInsurance: value})}
                    />
                  </View>
                </View>

                {/* Filtres par type */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Type</Text>
                  <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>En vente</Text>
                    <Switch
                      value={advancedFilters.forSale}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, forSale: value})}
                    />
                  </View>
                  <View style={styles.optionRow}>
                    <Text style={styles.optionLabel}>En location</Text>
                    <Switch
                      value={advancedFilters.forRent}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, forRent: value})}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={resetFilters}
                >
                  <Text style={styles.resetButtonText}>Réinitialiser</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowAdvancedFilters(false)}
                >
                  <Text style={styles.applyButtonText}>Appliquer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  filterContainer: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
    height: 60,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    height: 60,
  },
  advancedFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'orange',
    marginRight: 10,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    height: 36,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'orange',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#555',
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resetFilterButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'orange',
    borderRadius: 8,
  },
  resetFilterButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  parkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  parkingLogo: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginRight: 10 
  },
  parkingName: { 
    fontSize: 15, 
    fontWeight: '600',
    flex: 1,
  },
  vehiculeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  imageContainer: {
    width: 140,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  carImage: { 
    width: '100%', 
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  vehiculeInfo: { 
    flex: 1, 
    paddingLeft: 15, 
    justifyContent: 'center' 
  },
  carTitle: { 
    fontSize: 17, 
    fontWeight: '600', 
    marginBottom: 4,
  },
  carPrice: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000', 
    marginBottom: 8 
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  rentBadge: {
    backgroundColor: '#e3f2fd',
  },
  saleBadge: {
    backgroundColor: '#f3e5f5',
  },
  availableBadge: {
    backgroundColor: '#e8f5e8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  warrantyBadge: {
    backgroundColor: '#d4edda',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  warrantyText: {
    color: '#28a745',
  },
  infoButton: {
    backgroundColor: 'orange',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  infoButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLabel: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    backgroundColor: 'orange',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ListVoiture;