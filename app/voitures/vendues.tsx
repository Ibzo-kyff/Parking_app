import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { getVehicules } from '../../components/services/listeVoiture';
import Constants from 'expo-constants';

const VenduesScreen = () => {
  const params = useLocalSearchParams();
  const parkingIdParam = params.parkingId as string | undefined;
  const parkingId = parkingIdParam ? Number(parkingIdParam) : undefined;

  const [vehicules, setVehicules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = Dimensions.get('window');
  const CARD_WIDTH = (width - 36) / 2;
  const BASE_URL = Constants.expoConfig?.extra?.BASE_URL || process.env.BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVehicules();
        let items: any[] = Array.isArray(data) ? data : data.vehicules || [];

        // Filter: belonging to parking and for sale
        if (parkingId) {
          items = items.filter(v => v.parking && Number(v.parking.id) === parkingId);
        }
        items = items.filter(v => v.forSale || v.status === 'sold' || v.forSale === true);

        setVehicules(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [parkingId]);

  const filtered = vehicules.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.marqueRef?.name || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q)
    );
  });

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

  const getPhotoUrl = (photos: string[] | string | undefined) => {
    if (!photos) return null;
    const photo = Array.isArray(photos) ? photos[0] : photos;
    if (typeof photo !== 'string' || !photo) return null;
    return photo.startsWith('http') ? photo : `${BASE_URL}${photo}`;
  };

  const renderVehicleCard = ({ item }: { item: any }) => {
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

    const displayTransmission = item.transmission
      ? item.transmission.charAt(0).toUpperCase() + item.transmission.slice(1).toLowerCase()
      : null;

    return (
      <TouchableOpacity
        style={[styles.card, { width: CARD_WIDTH }]}
        onPress={() => router.push({ pathname: '/(Clients)/CreateListingScreen', params: { vehicule: JSON.stringify(item) } })}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.carImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome name="car" size={32} color="#aaa" />
            </View>
          )}

          {parkingLogoUrl && (
            <View style={styles.parkingBadge}>
              <Image source={{ uri: parkingLogoUrl }} style={styles.parkingBadgeImage} resizeMode="cover" />
            </View>
          )}

          {(item.forSale || item.forRent) && (
            <View style={badgeStyle}>
              <Text style={styles.statusText}>{badgeText}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.carName} numberOfLines={1}>{item.marqueRef?.name || 'Marque'} {item.model}</Text>

          <View style={styles.carDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.year || 'N/A'} • {item.mileage ? formatMileage(item.mileage) : 'N/A km'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="speedometer" size={14} color="#666" />
              <Text style={styles.detailText}>{item.fuelType || 'Non spécifié'}</Text>
            </View>
            {displayTransmission && (
              <View style={styles.detailRow}>
                <Ionicons name="settings-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{displayTransmission}</Text>
              </View>
            )}
          </View>

          <Text style={styles.carPrice}>{item.prix ? formatPrice(item.prix) : 'Prix non spécifié'}</Text>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>{item.parking?.name || 'Localisation non spécifiée'}</Text>
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
        <ActivityIndicator size="large" color="#FD6A00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
                            <TouchableOpacity 
                              style={styles.backButton}
                              onPress={() => router.back()}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="chevron-back" size={24} color="#1d1d1f" />
                            </TouchableOpacity>
        <Text style={styles.headerTitle}>Véhicules vendues</Text>
        {/* <Text style={styles.headerSubtitle}>Affiche uniquement les véhicules du parking connecté</Text> */}
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
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.noResults}>
          <FontAwesome name="car" size={60} color="#ddd" />
          <Text style={styles.noResultsText}>Aucun véhicule vendu trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderVehicleCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
      backgroundColor: '#f5f5f7',
     borderRadius: 20,
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
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
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
});

export default VenduesScreen;
