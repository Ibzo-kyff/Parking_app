import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types (inchangés)
type Voiture = {
  id: string;
  marque: string;
  model: string;
  photos: string[];
  status: string;
  prix?: number;
  createdAt: string | number | Date;
  stats: {
    vues: number;
    reservations: number;
    favoris: number;
    reservationsActives: number;
  };
  nextReservation?: {
    type: string;
    date: string;
    client: string;
  };
  marqueRef: {
    id: number;
    name: string;
    logoUrl: string;
  };
  dureeGarantie?: number;
  mileage?: number;
  fuelType?: string;
  carteGrise?: boolean;
  assurance?: boolean;
  vignette?: boolean;
  forRent?: boolean;
  forSale?: boolean;
  description?: string;
};

type StatusType = 'available' | 'rented' | 'sold' | 'maintenance' | 'unavailable';

const PopulairesScreen = () => {
  const { authState, refreshAuth } = useAuth();
  const [vehicles, setVehicles] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalVues, setTotalVues] = useState(0);
  const [totalFavoris, setTotalFavoris] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);

  // Fonctions API (inchangées)
  const fetchData = async (isRetry = false) => {
    try {
      const response = await axios.get('https://parkapp-pi.vercel.app/api/vehicules/parking/management', {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      });

      const data = response.data;
      const sortedVehicles = [...data.vehicles].sort((a, b) => (b.stats?.vues || 0) - (a.stats?.vues || 0));

      const fixedVehicles = sortedVehicles.map((v: Voiture) => ({
        ...v,
        photos: v.photos.map((photo: string) =>
          photo.startsWith('http') ? photo : `https://parkapp-pi.vercel.app${photo}`
        ),
      }));

      setVehicles(fixedVehicles);

      const totalV = fixedVehicles.reduce((sum, v) => sum + (v.stats?.vues || 0), 0);
      const totalF = fixedVehicles.reduce((sum, v) => sum + (v.stats?.favoris || 0), 0);
      const totalR = fixedVehicles.reduce((sum, v) => sum + (v.stats?.reservations || 0), 0);

      setTotalVues(totalV);
      setTotalFavoris(totalF);
      setTotalReservations(totalR);

      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403 && !isRetry) {
        const success = await refreshAuth();
        if (success) {
          await fetchData(true);
          return;
        }
      }

      setError('Erreur lors de la récupération des données');
      console.error('Erreur API:', err);

      if (err.response?.status === 403) {
        Alert.alert(
          'Session expirée',
          'Votre session a expirée. Veuillez vous reconnecter.',
          [
            {
              text: 'Se reconnecter',
              onPress: () => router.replace('/(auth)/LoginScreen')
            }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    if (authState.accessToken) {
      fetchData();
    } else {
      setError('Aucun token d\'authentification disponible');
      setLoading(false);
    }
  }, [authState.accessToken]);

  const handleSelectVoiture = (voiture: Voiture) => {
    router.push({
      pathname: '/(Clients)/CreateListingScreen',
      params: { 
        vehicule: JSON.stringify(voiture),
        fromParking: 'true'
      }
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'available': '#10B981',
      'rented': '#F59E0B',
      'sold': '#6B7280',
      'maintenance': '#EF4444',
      'unavailable': '#6B7280'
    };
    return statusColors[status] || '#6B7280';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'available': 'Disponible',
      'rented': 'En location',
      'sold': 'Vendu',
      'maintenance': 'Maintenance',
      'unavailable': 'Indisponible'
    };
    return statusMap[status] || status;
  };

  // Composant pour la carte véhicule
  const VoitureCard = ({ item, index }: { item: Voiture; index: number }) => {
    const statusColor = getStatusColor(item.status);
    const isFirst = index === 0;
    
    return (
      <TouchableOpacity 
        style={[
          styles.voitureCard,
          isFirst && styles.firstCard
        ]} 
        onPress={() => handleSelectVoiture(item)}
        activeOpacity={0.8}
      >
        {/* Badge de rang avec effet premium */}
        <View style={[styles.rankBadge, isFirst && styles.firstRankBadge]}>
          <Text style={styles.rankText}>#{index + 1}</Text>
          {isFirst && <Ionicons name="trophy" size={12} color="#FFF" style={styles.trophyIcon} />}
        </View>

        {/* Image avec overlay gradient */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.photos[0] || 'https://via.placeholder.com/100x70' }}
            style={styles.voitureImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
            style={styles.imageOverlay}
          />
          
          {/* Status badge positionné sur l'image */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        {/* Contenu de la carte */}
        <View style={styles.cardContent}>
          <View style={styles.titleSection}>
            <View style={styles.titleColumn}>
              <Text style={styles.voitureMarque}>{item.marque}</Text>
              <Text style={styles.voitureModel}>{item.model}</Text>
            </View>
            {item.prix && (
              <Text style={styles.voiturePrix}>{item.prix.toLocaleString()} FCFA</Text>
            )}
          </View>

          {/* Statistiques avec icônes orange */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="eye" size={14} color="#FD6A00" />
              </View>
              <Text style={styles.statValue}>{item.stats.vues}</Text>
              <Text style={styles.statLabel}>Vues</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="heart" size={14} color="#FD6A00" />
              </View>
              <Text style={styles.statValue}>{item.stats.favoris}</Text> 
              <Text style={styles.statLabel}>Favoris</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={14} color="#FD6A00" />
              </View>
              <Text style={styles.statValue}>{item.stats.reservations}</Text>
              <Text style={styles.statLabel}>Résas</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Toutes les cartes stats en orange
  const StatCard = ({ icon, value, label }: { icon: string; value: number; label: string }) => (
    <LinearGradient
      colors={['#FD6A00', '#FF8C42']}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statIconCircle}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <Text style={styles.statCardValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statCardLabel}>{label}</Text>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ActivityIndicator size="large" color="#FD6A00" />
        <Text style={styles.loadingText}>Chargement des véhicules...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <Ionicons name="alert-circle-outline" size={64} color="#FD6A00" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header amélioré */}
      <LinearGradient
        colors={['#f8f9fa', '#f8f9fa']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="chevron-back" size={20} color="#333" />
            </View>
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>Voitures populaires</Text>
            <Text style={styles.subtitle}>Classement par performance</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Statistiques principales TOUTES EN ORANGE */}
      <View style={styles.mainStats}>
        <StatCard icon="eye" value={totalVues} label="Total vues" />
        <StatCard icon="heart" value={totalFavoris} label="Total favoris" />
        <StatCard icon="calendar" value={totalReservations} label="Total résas" />
      </View>

      {/* Liste des véhicules */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <VoitureCard item={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FD6A00']}
            tintColor="#FD6A00"
          />
        }
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} classé{vehicles.length > 1 ? 's' : ''}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: '#FD6A00',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FD6A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'System',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'System',
  },
  titleSection: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  mainStats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'System',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'System',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  listHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'System',
  },
  voitureCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  firstCard: {
    borderWidth: 3,
    borderColor: '#FD6A00',
    shadowColor: '#FD6A00',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  firstRankBadge: {
    backgroundColor: '#FD6A00',
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'System',
  },
  trophyIcon: {
    marginLeft: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  voitureImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'System',
  },
  cardContent: {
    padding: 20,
  },
  titleColumn: {
    flex: 1,
    marginRight: 12,
  },
  voitureMarque: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontFamily: 'System',
  },
  voitureModel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
  },
  voiturePrix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FD6A00',
    fontFamily: 'System',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'System',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
});

export default PopulairesScreen;