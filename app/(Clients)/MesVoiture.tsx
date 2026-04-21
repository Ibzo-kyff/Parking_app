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
  FlatList,
  StatusBar,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getVehicules } from '../../components/services/listeVoiture';
import { router } from 'expo-router';
import Constants from 'expo-constants';
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
  marqueRef?: Marque;
  model: string;
  prix: number;
  photos: string[] | string;
  parking?: Parking;
  fuelType?: string;
  mileage?: number;
  garantie?: boolean;
  assurance?: boolean;
  status?: string;
  year?: number;
  forSale?: boolean;
  forRent?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2; // Deux colonnes avec espacement

const MesVoiture = () => {
  const { parkingId, parkingName } = useLocalSearchParams();
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
    minYear: '',
    maxYear: '',
  });
  const filterAnim = useState(new Animated.Value(0))[0];

  const commonFuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];

  const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL ;
  
  useEffect(() => {
    const fetchVehicules = async () => {
      try {
        const data = await getVehicules();
        const filtered = data.filter((v: any) => v.parking && String(v.parking.id) === String(parkingId));
        
        setVehicules(filtered);
        setFilteredVehicules(filtered);
        
        const fuelTypes = [...new Set(filtered
          .map((v: { fuelType: any; }) => v.fuelType)
          .filter(Boolean))] as string[];
        
        setAvailableFuelTypes(fuelTypes);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicules();
  }, [parkingId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = applyAdvancedFilters(vehicules.filter(vehicule =>
        (vehicule.marqueRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        vehicule.model.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      setFilteredVehicules(filtered);
      
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
      
      if (showFilters) {
        Animated.timing(filterAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setShowFilters(false));
      }
    }
  }, [searchQuery, vehicules, advancedFilters]);

  const applyAdvancedFilters = (vehicles: Vehicule[]) => {
    let filtered = [...vehicles];
    
    if (advancedFilters.minPrice) {
      const minPrice = parseFloat(advancedFilters.minPrice);
      filtered = filtered.filter(v => v.prix >= minPrice);
    }
    
    if (advancedFilters.maxPrice) {
      const maxPrice = parseFloat(advancedFilters.maxPrice);
      filtered = filtered.filter(v => v.prix <= maxPrice);
    }
    
    if (advancedFilters.withWarranty) {
      filtered = filtered.filter(v => v.garantie);
    }
    
    if (advancedFilters.withInsurance) {
      filtered = filtered.filter(v => v.assurance);
    }
    
    if (advancedFilters.minMileage && advancedFilters.minMileage !== '') {
      const minMileage = parseInt(advancedFilters.minMileage);
      filtered = filtered.filter(v => v.mileage && v.mileage >= minMileage);
    }
    
    if (advancedFilters.maxMileage && advancedFilters.maxMileage !== '') {
      const maxMileage = parseInt(advancedFilters.maxMileage);
      filtered = filtered.filter(v => v.mileage && v.mileage <= maxMileage);
    }
    
    if (advancedFilters.minYear && advancedFilters.minYear !== '') {
      const minYear = parseInt(advancedFilters.minYear);
      filtered = filtered.filter(v => v.year && v.year >= minYear);
    }
    
    if (advancedFilters.maxYear && advancedFilters.maxYear !== '') {
      const maxYear = parseInt(advancedFilters.maxYear);
      filtered = filtered.filter(v => v.year && v.year <= maxYear);
    }
    
    if (advancedFilters.forSale) {
      filtered = filtered.filter(v => v.forSale);
    }
    
    if (advancedFilters.forRent) {
      filtered = filtered.filter(v => v.forRent);
    }
    
    return filtered;
  };

  const getPhotoUrl = (photos: string[] | string | undefined) => {
    if (!photos) return null;
    
    const photo = Array.isArray(photos) ? photos[0] : photos;
    
    if (typeof photo !== 'string' || !photo) return null;
    
    return photo.startsWith('http') ? photo : `${BASE_URL}${photo}`;
  };

  const navigateToDetails = (vehicule: Vehicule) => {
    router.push({
      pathname: '/(Clients)/CreateListingScreen',
      params: { vehicule: JSON.stringify(vehicule) }
    });
  };

  const navigateToParkingDetails = () => {
    if (parkingId) {
      router.push({
        pathname: '/DetailParkings',
        params: { id: parkingId as string }
      });
    }
  };

  const applyFilter = (filterType: string) => {
    setActiveFilter(filterType);
    
    let filtered = [...vehicules];
    
    if (searchQuery) {
      filtered = filtered.filter(vehicule =>
        (vehicule.marqueRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        vehicule.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    switch(filterType) {
      case 'economique':
        filtered = filtered.filter(v => v.prix < 10000000);
        break;
      case 'luxe':
        filtered = filtered.filter(v => v.prix > 30000000);
        break;
      case 'vente':
        filtered = filtered.filter(v => v.forSale);
        break;
      case 'location':
        filtered = filtered.filter(v => v.forRent);
        break;
      default:
        if (filterType !== 'all') {
          filtered = filtered.filter(v => v.fuelType === filterType);
        }
        break;
    }
    
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
      minYear: '',
      maxYear: '',
    });
    setFilteredVehicules(vehicules);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M CFA`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K CFA`;
    }
    return `${price} CFA`;
  };

  const formatMileage = (mileage: number) => {
    if (!mileage) return 'N/A km';
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(1)}K km`;
    }
    return `${mileage} km`;
  };

  const renderVehicleCard = ({ item }: { item: Vehicule }) => {
    const photoUrl = getPhotoUrl(item.photos);
    const parkingLogoUrl = item.parking?.logo
      ? item.parking.logo.startsWith('http')
        ? item.parking.logo
        : `${BASE_URL}${item.parking.logo}`
      : null;

    let badgeText = '';
    let badgeStyle: any = styles.statusBadge;

    if (item.forSale && item.forRent) {
      badgeText = 'Vente/Location';
      badgeStyle = [styles.statusBadge, styles.statusAvailable];
    } else if (item.forRent) {
      badgeText = 'À louer';
      badgeStyle = [styles.statusBadge, styles.statusRent];
    } else if (item.forSale) {
      badgeText = 'À vendre';
      badgeStyle = [styles.statusBadge, styles.statusSale];
    }

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigateToDetails(item)}
        activeOpacity={0.9}
      >
        {/* Image du véhicule */}
        <View style={styles.imageContainer}>
          {photoUrl ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={styles.carImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome name="car" size={32} color="#aaa" />
            </View>
          )}
          
          {/* Badge du parking */}
          {parkingLogoUrl && (
            <View style={styles.parkingBadge}>
              <Image 
                source={{ uri: parkingLogoUrl }} 
                style={styles.parkingBadgeImage} 
                resizeMode="cover"
              />
            </View>
          )}
          
          {/* Badge de statut */}
          {(item.forSale || item.forRent) && (
            <View style={badgeStyle}>
              <Text style={styles.statusText}>
                {badgeText}
              </Text>
            </View>
          )}
        </View>

        {/* Informations du véhicule */}
        <View style={styles.cardContent}>
          <Text style={styles.carName} numberOfLines={1}>
            {item.marqueRef?.name || 'Marque'} {item.model}
          </Text>
          
          <View style={styles.carDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                {item.year || 'N/A'} • {formatMileage(item.mileage || 0)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="speedometer" size={14} color="#666" />
              <Text style={styles.detailText}>
                {item.fuelType || 'Non spécifié'}
              </Text>
            </View>
          </View>

          <Text style={styles.carPrice}>{formatPrice(item.prix)}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.parking?.name || 'Localisation non spécifiée'}
            </Text>
          </View>
          
          {/* Badges d'options */}
          <View style={styles.optionBadges}>
            {item.garantie && (
              <View style={styles.optionBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#28a745" />
                <Text style={styles.optionBadgeText}>Garantie</Text>
              </View>
            )}
            {item.assurance && (
              <View style={styles.optionBadge}>
                <Ionicons name="document-text-outline" size={12} color="#ff8000ff" />
                <Text style={styles.optionBadgeText}>Assurance</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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

  const hasActiveFilters = Object.values(advancedFilters).some(value => 
    (typeof value === 'boolean' && value) || 
    (typeof value === 'string' && value !== '')
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header redessiné */}
        <View style={styles.header}>
          {/* Barre de navigation supérieure */}
          <View style={styles.navBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#1d1d1f" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Véhicules disponibles
              </Text>
              <View style={styles.parkingInfo}>
                <Ionicons name="location-sharp" size={14} color="#ff7d00" />
                <Text style={styles.parkingName} numberOfLines={1}>
                  {parkingName || 'Parking non spécifié'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={navigateToParkingDetails}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="information-circle" size={22} color="#ff7d00" />
            </TouchableOpacity>
          </View>

          {/* Compteur de véhicules */}
          <View style={styles.countContainer}>
            <View style={styles.countBadge}>
              <Ionicons name="car-sport" size={16} color="#ff7d00" />
              <Text style={styles.countText}>
                {filteredVehicules.length} véhicule{filteredVehicules.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une marque, modèle..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')} 
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, (showAdvancedFilters || hasActiveFilters) && styles.filterButtonActive]}
            onPress={() => setShowAdvancedFilters(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons 
              name="filter-list" 
              size={22} 
              color={(showAdvancedFilters || hasActiveFilters) ? "#fff" : "#ff7d00"} 
            />
            {hasActiveFilters && (
              <View style={styles.filterIndicator}>
                <Text style={styles.filterIndicatorText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filtres contextuels */}
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
              <TouchableOpacity 
                style={[styles.filterButtonSmall, activeFilter === 'all' && styles.filterButtonActiveSmall]}
                onPress={() => applyFilter('all')}
              >
                <Text style={[styles.filterButtonTextSmall, activeFilter === 'all' && styles.filterButtonTextActiveSmall]}>
                  Tous
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButtonSmall, activeFilter === 'economique' && styles.filterButtonActiveSmall]}
                onPress={() => applyFilter('economique')}
              >
                <Text style={[styles.filterButtonTextSmall, activeFilter === 'economique' && styles.filterButtonTextActiveSmall]}>
                  Économique
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButtonSmall, activeFilter === 'luxe' && styles.filterButtonActiveSmall]}
                onPress={() => applyFilter('luxe')}
              >
                <Text style={[styles.filterButtonTextSmall, activeFilter === 'luxe' && styles.filterButtonTextActiveSmall]}>
                  Luxe
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButtonSmall, activeFilter === 'vente' && styles.filterButtonActiveSmall]}
                onPress={() => applyFilter('vente')}
              >
                <Text style={[styles.filterButtonTextSmall, activeFilter === 'vente' && styles.filterButtonTextActiveSmall]}>
                  En vente
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterButtonSmall, activeFilter === 'location' && styles.filterButtonActiveSmall]}
                onPress={() => applyFilter('location')}
              >
                <Text style={[styles.filterButtonTextSmall, activeFilter === 'location' && styles.filterButtonTextActiveSmall]}>
                  En location
                </Text>
              </TouchableOpacity>
              
              {commonFuelTypes.filter(fuel => 
                availableFuelTypes.includes(fuel)
              ).map((fuel) => (
                <TouchableOpacity 
                  key={fuel}
                  style={[styles.filterButtonSmall, activeFilter === fuel && styles.filterButtonActiveSmall]}
                  onPress={() => applyFilter(fuel)}
                >
                  <Text style={[styles.filterButtonTextSmall, activeFilter === fuel && styles.filterButtonTextActiveSmall]}>
                    {fuel}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Liste des véhicules en grille 2 colonnes */}
        {filteredVehicules.length === 0 ? (
          <View style={styles.noResults}>
            <FontAwesome name="car" size={60} color="#ddd" />
            <Text style={styles.noResultsText}>Aucun véhicule trouvé</Text>
            <Text style={styles.noResultsSubText}>
              Essayez d'autres termes de recherche ou modifiez vos filtres
            </Text>
            <TouchableOpacity style={styles.resetFilterButton} onPress={resetFilters}>
              <Text style={styles.resetFilterButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredVehicules}
            renderItem={renderVehicleCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{filteredVehicules.length} résultats</Text>
                {(activeFilter !== 'all' || hasActiveFilters) && (
                  <TouchableOpacity onPress={resetFilters}>
                    <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}

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
                <TouchableOpacity 
                  onPress={() => setShowAdvancedFilters(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Filtre par prix */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Prix (FCFA)</Text>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Minimum</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={advancedFilters.minPrice}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, minPrice: text})}
                      />
                    </View>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Maximum</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Illimité"
                        keyboardType="numeric"
                        value={advancedFilters.maxPrice}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, maxPrice: text})}
                      />
                    </View>
                  </View>
                </View>

                {/* Filtre par année */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Année</Text>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Minimum</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="2000"
                        keyboardType="numeric"
                        value={advancedFilters.minYear}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, minYear: text})}
                      />
                    </View>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Maximum</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="2024"
                        keyboardType="numeric"
                        value={advancedFilters.maxYear}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, maxYear: text})}
                      />
                    </View>
                  </View>
                </View>

                {/* Filtre par kilométrage */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Kilométrage</Text>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Minimum</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0 km"
                        keyboardType="numeric"
                        value={advancedFilters.minMileage}
                        onChangeText={(text) => setAdvancedFilters({...advancedFilters, minMileage: text})}
                      />
                    </View>
                    <View style={styles.priceInput}>
                      <Text style={styles.inputLabel}>Maximum</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Illimité"
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
                    <View style={styles.optionLabelContainer}>
                      <Ionicons name="shield-checkmark" size={18} color="#28a745" />
                      <Text style={styles.optionLabel}>Avec garantie</Text>
                    </View>
                    <Switch
                      value={advancedFilters.withWarranty}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, withWarranty: value})}
                      trackColor={{ false: '#ddd', true: '#28a745' }}
                    />
                  </View>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLabelContainer}>
                      <Ionicons name="document-text-outline" size={18} color="#ff7d00" />
                      <Text style={styles.optionLabel}>Avec assurance</Text>
                    </View>
                    <Switch
                      value={advancedFilters.withInsurance}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, withInsurance: value})}
                      trackColor={{ false: '#ddd', true: '#007AFF' }}
                    />
                  </View>
                </View>

                {/* Filtres par type */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Type</Text>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLabelContainer}>
                      <Ionicons name="cash" size={18} color="#ff7d00" />
                      <Text style={styles.optionLabel}>En vente</Text>
                    </View>
                    <Switch
                      value={advancedFilters.forSale}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, forSale: value})}
                      trackColor={{ false: '#ddd', true: '#FF3B30' }}
                    />
                  </View>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLabelContainer}>
                      <MaterialIcons name="directions-car" size={18} color="#ff7d00" />
                      <Text style={styles.optionLabel}>En location</Text>
                    </View>
                    <Switch
                      value={advancedFilters.forRent}
                      onValueChange={(value) => setAdvancedFilters({...advancedFilters, forRent: value})}
                      trackColor={{ false: '#ddd', true: '#ff7d00' }}
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
    backgroundColor: '#f5f5f7' 
  },
  
  // Header redessiné
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
  },
  
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: 4,
  },
  
  parkingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  parkingName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  detailsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7f0',
  },
  
  countContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  
  countText: {
    fontSize: 14,
    color: '#1d1d1f',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Barre de recherche
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginRight: 12,
  },
  
  searchIcon: {
    marginRight: 12,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1d1d1f',
    height: '100%',
    fontFamily: 'System',
  },
  
  clearButton: {
    padding: 2,
  },
  
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    position: 'relative',
  },
  
  filterButtonActive: {
    backgroundColor: '#ff7d00',
  },
  
  filterIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  filterIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Filtres contextuels
  filterContainer: {
    position: 'absolute',
    top: 184,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  
  filterScroll: {
    flexGrow: 0,
  },
  
  filterContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    height: 60,
  },
  
  filterButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  
  filterButtonActiveSmall: {
    backgroundColor: '#ff7d00',
  },
  
  filterButtonTextSmall: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  
  filterButtonTextActiveSmall: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Loading
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // No results
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  
  noResultsText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: '#1d1d1f',
  },
  
  noResultsSubText: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  resetFilterButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ff7d00',
    borderRadius: 12,
  },
  
  resetFilterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Liste
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  
  clearFiltersText: {
    fontSize: 15,
    color: '#ff7d00',
    fontWeight: '500',
  },
  
  // Carte véhicule
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  
  carImage: { 
    width: '100%', 
    height: '100%',
  },
  
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  parkingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  parkingBadgeImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  statusRent: {
    backgroundColor: '#34c759',
  },
  
  statusSale: {
    backgroundColor: '#ff3b30',
  },
  
  statusAvailable: {
    backgroundColor: '#ff7b00c8',
  },
  
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  
  cardContent: {
    padding: 12,
  },
  
  carName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  
  carDetails: {
    marginBottom: 8,
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  
  carPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  
  optionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  optionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  
  optionBadgeText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Modal de filtres
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  
  modalBody: {
    padding: 20,
  },
  
  filterGroup: {
    marginBottom: 28,
  },
  
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 16,
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
    marginBottom: 8,
    fontWeight: '500',
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f7',
    color: '#1d1d1f',
  },
  
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f7',
  },
  
  optionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  optionLabel: {
    fontSize: 16,
    color: '#1d1d1f',
    marginLeft: 12,
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  
  resetButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ff7d00',
    borderRadius: 12,
    alignItems: 'center',
  },
  
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MesVoiture;