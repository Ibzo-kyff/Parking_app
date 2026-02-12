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
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  transmission?: string; 
  mileage?: number;
  garantie?: boolean;
  assurance?: boolean;
  status?: string;
  year?: number;
  forSale?: boolean;
  forRent?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

type TabType = 'all' | 'sale' | 'rent';

const ListVoiture = () => {
  const params = useLocalSearchParams();
  const selectedMarqueFromParams = params.selectedMarque as string;
  const marqueIdFromParams = params.marqueId as string;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  // États
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [filteredVehicules, setFilteredVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
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
    minYear: '',
    maxYear: '',
    transmission: '', // Changé de gearbox à transmission
  });
  const filterAnim = useState(new Animated.Value(0))[0];

  const commonFuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
  const transmissionTypes = ['MANUELLE', 'AUTOMATIQUE']; // Types en majuscules pour correspondre à l'API

  const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiculesData = await getVehicules();
        setVehicules(vehiculesData);
        
        const fuelTypes = [...new Set(vehiculesData
          .map((v: { fuelType: any; }) => v.fuelType)
          .filter(Boolean))] as string[];
        
        setAvailableFuelTypes(fuelTypes);
        
        // Appliquer tous les filtres initiaux
        applyAllFilters(vehiculesData);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fonction pour normaliser la transmission (convertir en français et majuscules)
  const normalizeTransmission = (transmission: string | undefined) => {
    if (!transmission) return null;
    
    const trans = transmission.toUpperCase();
    
    // Convertir les valeurs anglaises en français
    if (trans.includes('MANUAL') || trans.includes('MANUELLE')) {
      return 'MANUELLE';
    } else if (trans.includes('AUTOMATIC') || trans.includes('AUTOMATIQUE')) {
      return 'AUTOMATIQUE';
    } else if (trans.includes('SEMI')) {
      return 'SEMI-AUTOMATIQUE';
    }
    
    return trans;
  };

  // Fonction principale qui applique TOUS les filtres
  const applyAllFilters = (vehiclesToFilter: Vehicule[]) => {
    let filtered = [...vehiclesToFilter];
    
    // 1. Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(vehicule =>
        (vehicule.marqueRef?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        vehicule.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicule.parking?.name && vehicule.parking.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // 2. Filtre par onglet (vente/location)
    if (activeTab === 'sale') {
      filtered = filtered.filter(v => v.forSale);
    } else if (activeTab === 'rent') {
      filtered = filtered.filter(v => v.forRent);
    }
    
    // 3. Filtre rapide (carburant, économique, luxe)
    if (activeFilter !== 'all') {
      switch(activeFilter) {
        case 'economique':
          filtered = filtered.filter(v => v.prix < 10000000);
          break;
        case 'luxe':
          filtered = filtered.filter(v => v.prix > 30000000);
          break;
        default:
          filtered = filtered.filter(v => v.fuelType === activeFilter);
          break;
      }
    }
    
    // 4. Filtres avancés
    if (advancedFilters.minPrice) {
      const minPrice = parseFloat(advancedFilters.minPrice);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(v => v.prix >= minPrice);
      }
    }
    
    if (advancedFilters.maxPrice) {
      const maxPrice = parseFloat(advancedFilters.maxPrice);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(v => v.prix <= maxPrice);
      }
    }
    
    if (advancedFilters.withWarranty) {
      filtered = filtered.filter(v => v.garantie);
    }
    
    if (advancedFilters.withInsurance) {
      filtered = filtered.filter(v => v.assurance);
    }
    
    if (advancedFilters.minMileage && advancedFilters.minMileage !== '') {
      const minMileage = parseInt(advancedFilters.minMileage);
      if (!isNaN(minMileage)) {
        filtered = filtered.filter(v => v.mileage && v.mileage >= minMileage);
      }
    }
    
    if (advancedFilters.maxMileage && advancedFilters.maxMileage !== '') {
      const maxMileage = parseInt(advancedFilters.maxMileage);
      if (!isNaN(maxMileage)) {
        filtered = filtered.filter(v => v.mileage && v.mileage <= maxMileage);
      }
    }
    
    if (advancedFilters.minYear && advancedFilters.minYear !== '') {
      const minYear = parseInt(advancedFilters.minYear);
      if (!isNaN(minYear)) {
        filtered = filtered.filter(v => v.year && v.year >= minYear);
      }
    }
    
    if (advancedFilters.maxYear && advancedFilters.maxYear !== '') {
      const maxYear = parseInt(advancedFilters.maxYear);
      if (!isNaN(maxYear)) {
        filtered = filtered.filter(v => v.year && v.year <= maxYear);
      }
    }
    
    // Filtre par transmission (boîte de vitesse)
    if (advancedFilters.transmission) {
      filtered = filtered.filter(v => {
        const normalizedTransmission = normalizeTransmission(v.transmission);
        return normalizedTransmission === advancedFilters.transmission;
      });
    }
    
    setFilteredVehicules(filtered);
  };

  // Changer d'onglet
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setActiveFilter('all');
    applyAllFilters(vehicules);
  };

  // Appliquer un filtre rapide
  const applyFilter = (filterType: string) => {
    setActiveFilter(filterType);
    applyAllFilters(vehicules);
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setActiveTab('all');
    setActiveFilter('all');
    setAdvancedFilters({
      minPrice: '',
      maxPrice: '',
      withWarranty: false,
      withInsurance: false,
      minMileage: '',
      maxMileage: '',
      minYear: '',
      maxYear: '',
      transmission: '',
    });
    applyAllFilters(vehicules);
  };

  // Appliquer les filtres avancés
  const applyAdvancedFilters = () => {
    setShowAdvancedFilters(false);
    applyAllFilters(vehicules);
  };

  // Effet pour gérer la recherche
  useEffect(() => {
    if (searchQuery) {
      applyAllFilters(vehicules);
      if (!showFilters) {
        Animated.timing(filterAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
        setShowFilters(true);
      }
    } else {
      applyAllFilters(vehicules);
      if (showFilters) {
        Animated.timing(filterAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setShowFilters(false));
      }
    }
  }, [searchQuery, vehicules]);

  // Effet pour gérer les filtres avancés quand ils changent
  useEffect(() => {
    applyAllFilters(vehicules);
  }, [advancedFilters, activeTab, activeFilter]);

  useEffect(() => {
    if (selectedMarqueFromParams) {
      setSearchQuery(selectedMarqueFromParams);
    }
  }, [selectedMarqueFromParams]);

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

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M CFA`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K CFA`;
    }
    return `${price} CFA`;
  };

  const formatMileage = (mileage: number) => {
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

    // Afficher la transmission formatée
    const displayTransmission = item.transmission 
      ? item.transmission.charAt(0).toUpperCase() + item.transmission.slice(1).toLowerCase()
      : null;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigateToDetails(item)}
        activeOpacity={0.9}
      >
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
          
          {parkingLogoUrl && (
            <View style={styles.parkingBadge}>
              <Image 
                source={{ uri: parkingLogoUrl }} 
                style={styles.parkingBadgeImage} 
                resizeMode="cover"
              />
            </View>
          )}
          
          {(item.forSale || item.forRent) && (
            <View style={badgeStyle}>
              <Text style={styles.statusText}>
                {badgeText}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.carName} numberOfLines={1}>
            {item.marqueRef?.name || 'Marque'} {item.model}
          </Text>
          
          <View style={styles.carDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>
                {item.year || 'N/A'} • {item.mileage ? formatMileage(item.mileage) : 'N/A km'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="speedometer" size={14} color="#666" />
              <Text style={styles.detailText}>
                {item.fuelType || 'Non spécifié'}
              </Text>
            </View>
            
            {/* Affichage de la transmission (boîte de vitesse) si disponible */}
            {displayTransmission && (
              <View style={styles.detailRow}>
                <Ionicons name="settings-outline" size={14} color="#666" />
                <Text style={styles.detailText}>
                  {displayTransmission}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.carPrice}>{formatPrice(item.prix)}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.parking?.name || 'Localisation non spécifiée'}
            </Text>
          </View>
          
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voitures disponibles</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'all' ? 'Tous les véhicules' :
             activeTab === 'sale' ? 'Véhicules à vendre' :
             'Véhicules à louer'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <FontAwesome name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une marque, modèle..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.filterToggleButton}
            onPress={() => setShowAdvancedFilters(true)}
          >
            <MaterialIcons name="filter-list" size={24} color="#ff7d00" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => handleTabChange('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Tous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sale' && styles.tabActive]}
            onPress={() => handleTabChange('sale')}
          >
            <Text style={[styles.tabText, activeTab === 'sale' && styles.tabTextActive]}>
              À vendre
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'rent' && styles.tabActive]}
            onPress={() => handleTabChange('rent')}
          >
            <Text style={[styles.tabText, activeTab === 'rent' && styles.tabTextActive]}>
              À louer
            </Text>
          </TouchableOpacity>
        </View>

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
                style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
                onPress={() => applyFilter('all')}
              >
                <Text style={[styles.filterButtonText, activeFilter === 'all' && styles.filterButtonTextActive]}>
                  Tous
                </Text>
              </TouchableOpacity>
              
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
              
              {commonFuelTypes.filter(fuel => 
                availableFuelTypes.includes(fuel)
              ).map((fuel) => (
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

        {filteredVehicules.length === 0 ? (
          <View style={styles.noResults}>
            <FontAwesome name="car" size={60} color="#ddd" />
            <Text style={styles.noResultsText}>Aucun véhicule trouvé</Text>
            <Text style={styles.noResultsSubText}>
              {activeTab === 'sale' ? 'Aucun véhicule à vendre' : 
               activeTab === 'rent' ? 'Aucun véhicule à louer' : 
               'Essayez d\'autres termes de recherche ou modifiez vos filtres'}
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
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

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

                {/* Filtre par transmission (boîte de vitesse) */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Boîte de vitesse</Text>
                  <View style={styles.transmissionContainer}>
                    {transmissionTypes.map((transmission) => (
                      <TouchableOpacity
                        key={transmission}
                        style={[
                          styles.transmissionButton,
                          advancedFilters.transmission === transmission && styles.transmissionButtonActive
                        ]}
                        onPress={() => setAdvancedFilters({
                          ...advancedFilters,
                          transmission: advancedFilters.transmission === transmission ? '' : transmission
                        })}
                      >
                        <Text style={[
                          styles.transmissionButtonText,
                          advancedFilters.transmission === transmission && styles.transmissionButtonTextActive
                        ]}>
                          {transmission.charAt(0) + transmission.slice(1).toLowerCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

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
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => {
                    setAdvancedFilters({
                      minPrice: '',
                      maxPrice: '',
                      withWarranty: false,
                      withInsurance: false,
                      minMileage: '',
                      maxMileage: '',
                      minYear: '',
                      maxYear: '',
                      transmission: '',
                    });
                  }}
                >
                  <Text style={styles.resetButtonText}>Réinitialiser</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={applyAdvancedFilters}
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    paddingLeft: 55,
    paddingTop: 15,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1d1d1f',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterToggleButton: {
    padding: 8,
  },
  // Styles pour les onglets
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f2f2f7',
  },
  tabActive: {
    backgroundColor: '#ff7d00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#ff7d00',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
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
  // Styles pour la transmission (boîte de vitesse)
  transmissionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  transmissionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  transmissionButtonActive: {
    backgroundColor: '#ff7d00',
    borderColor: '#ff7d00',
  },
  transmissionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  transmissionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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

export default ListVoiture;