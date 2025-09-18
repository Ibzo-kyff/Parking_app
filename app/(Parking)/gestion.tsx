// app/(Parking)/gestion.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getParkingManagementData, setAuthToken } from '../../components/services/back';
import { useAuth } from '../../context/AuthContext';

// Types
type Voiture = {
  id: string;
  marque: string;
  model: string;
  status: string;
  photos: string[];
  prix: number;
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
};

type ParkingData = {
  parking: {
    id: string;
    name: string;
    address: string;
    phone: string;
    logo: string;
  };
  statistics: {
    total: number;
    vendus: number;
    enLocation: number;
    disponibles: number;
    enMaintenance: number;
    indisponibles: number;
    totalVues: number;
    totalReservations: number;
    totalFavoris: number;
    reservationsActives: number;
    monthlySales: number;
    monthlyRentals: number;
  };
  vehicles: Voiture[];
  charts: {
    monthlyData: {
      labels: string[];
      sales: number[];
      rentals: number[];
    };
    statusDistribution: {
      labels: string[];
      data: number[];
    };
  };
  filters: {
    currentStatus: string;
    currentSearch: string;
  };
};

const MonParkingScreen: React.FC = () => {
  const { authState, refreshAuth } = useAuth();
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBottomFilter, setSelectedBottomFilter] = useState('Total');
  const [sticky, setSticky] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchParkingData = async () => {
      setLoading(true);
      try {
        if (authState.accessToken) {
          setAuthToken(authState.accessToken);
          const data = await getParkingManagementData();
          setParkingData(data);
        } else {
          console.error('Aucun token disponible dans authState');
        }
      } catch (error: any) {
        console.error('Erreur API gestion parking:', error);
        if (error.response?.status === 403) {
          console.log("Tentative de rafraîchissement...");
          const success = await refreshAuth();
          if (success && authState.accessToken) {
            setAuthToken(authState.accessToken);
            const data = await getParkingManagementData();
            setParkingData(data);
          } else {
            console.error('Rafraîchissement échoué');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (authState.accessToken) {
      fetchParkingData();
    } else {
      console.error('Token absent, requête non effectuée');
      setLoading(false);
    }
  }, [authState.accessToken]);

  const totalVoitures = parkingData?.statistics.total || 0;
  const voituresLocation = parkingData?.statistics.enLocation || 0;
  const voituresVente = parkingData?.statistics.vendus || 0;
  const voituresDisponibles = parkingData?.statistics.disponibles || 0;

  // Fonction alternative pour le graphique circulaire (sans SVG)
  const renderResumeGraph = () => {
    return (
      <View style={{ alignItems: 'center' }}>
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.centerText}>{totalVoitures}</Text>
            <Text style={styles.centerSubText}>Voitures</Text>
          </View>
        </View>
        <View style={styles.statsLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FD6A00' }]} />
            <Text style={styles.legendText}>Location ({voituresLocation})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD1A3' }]} />
            <Text style={styles.legendText}>Vente ({voituresVente})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Disponibles ({voituresDisponibles})</Text>
          </View>
        </View>
      </View>
    );
  };

  const filteredVoitures = parkingData?.vehicles.filter(v => {
    if (selectedBottomFilter === 'Total') return true;
    if (selectedBottomFilter === 'En vente') return v.status === 'ACHETE';
    if (selectedBottomFilter === 'En location') return v.status === 'EN_LOCATION';
    if (selectedBottomFilter === 'Disponibles') return v.status === 'DISPONIBLE';
    return true;
  }).filter(v => 
    v.marque.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getImageSource = (status: string) => {
    if (status === 'EN_LOCATION') return require('../../assets/images/location.jpeg');
    if (status === 'ACHETE') return require('../../assets/images/vente.png');
    if (status === 'DISPONIBLE') return require('../../assets/images/disponible.png');
    return require('../../assets/images/tout.jpg');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_LOCATION': return 'En location';
      case 'ACHETE': return 'Vendu';
      case 'DISPONIBLE': return 'Disponible';
      case 'EN_MAINTENANCE': return 'Maintenance';
      case 'INDISPONIBLE': return 'Indisponible';
      default: return status;
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        setSticky(event.nativeEvent.contentOffset.y > 300);
      },
    }
  );

  const renderBottomButtons = () => (
    <View style={styles.bottomButtonsContainer}>
      {['Total', 'En vente', 'En location', 'Disponibles'].map(filter => (
        <TouchableOpacity
          key={filter}
          style={[styles.bottomButton, selectedBottomFilter === filter && styles.bottomButtonActive]}
          onPress={() => setSelectedBottomFilter(filter)}
        >
          <Text style={[styles.bottomButtonText, selectedBottomFilter === filter && styles.bottomButtonTextActive]}>
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthlyChart = () => {
    if (!parkingData?.charts.monthlyData) return null;

    const { labels, sales, rentals } = parkingData.charts.monthlyData;
    const maxValue = Math.max(...sales, ...rentals, 1);

    return (
      <View style={styles.monthlyChartContainer}>
        <Text style={styles.chartTitle}>Ventes et locations</Text>
        <View style={styles.chartBars}>
          {labels.map((label, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.salesBar,
                    { height: sales[index] / maxValue * 80 }
                  ]}
                />
                <View
                  style={[
                    styles.rentalsBar,
                    { height: rentals[index] / maxValue * 80 }
                  ]}
                />
              </View>
              <Text style={styles.chartLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FD6A00' }]} />
            <Text style={styles.legendText}>En vente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD1A3' }]} />
            <Text style={styles.legendText}>En location</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FD6A00" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!parkingData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Aucune donnée de parking disponible</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainerSticky}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInputLeft}
          placeholder="Rechercher une voiture..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {sticky && <View style={styles.stickyFloatingButtons}>{renderBottomButtons()}</View>}

      <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Gérer vos voitures</Text>
          <Text style={styles.parkingName}>{parkingData.parking.name}</Text>
        </View>

        <Text style={styles.total}>Total des voitures : {totalVoitures}</Text>

        {renderMonthlyChart()}

        <View style={styles.statsContainer}>
          {renderResumeGraph()}
        </View>

        {!sticky && renderBottomButtons()}

        <View style={{ marginTop: 20 }}>
          {filteredVoitures.map(voiture => (
            <View key={voiture.id} style={styles.voitureCard}>
              <Image 
                source={voiture.photos && voiture.photos.length > 0 
                  ? { uri: voiture.photos[0] } 
                  : getImageSource(voiture.status)
                } 
                style={styles.voitureImageClickable} 
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {voiture.marque} {voiture.model}
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  {getStatusLabel(voiture.status)}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FD6A00' }}>
                  {voiture.prix} €
                </Text>
                {voiture.nextReservation && (
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    Prochaine réservation: {new Date(voiture.nextReservation.date).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View style={styles.statsBadge}>
                <Text style={styles.statsText}>👁️ {voiture.stats.vues}</Text>
                <Text style={styles.statsText}>❤️ {voiture.stats.favoris}</Text>
                <Text style={styles.statsText}>📅 {voiture.stats.reservationsActives}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 },
  parkingName: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  total: { fontSize: 14, color: '#666', marginTop: 8 },
  searchContainerSticky: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 25,
    paddingHorizontal: 8,
    marginBottom: 10,
    height: 50,
  },
  searchInputLeft: { flex: 1, fontSize: 14, color: '#333' },
  stickyFloatingButtons: { 
    position: 'absolute', 
    top: 70, 
    left: 20, 
    right: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    zIndex: 1000,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
  },
  bottomButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20,
    flexWrap: 'wrap',
  },
  bottomButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    borderRadius: 25, 
    backgroundColor: '#FFD1A3',
    margin: 5,
  },
  bottomButtonActive: { backgroundColor: '#FD6A00' },
  bottomButtonText: { color: '#FD6A00', fontWeight: 'bold', fontSize: 12 },
  bottomButtonTextActive: { color: '#fff' },
  voitureCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    padding: 12, 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  voitureImageClickable: { 
    width: 100, 
    height: 80, 
    borderRadius: 10, 
    resizeMode: 'cover' 
  },
  statsContainer: { 
    backgroundColor: '#fff', 
    padding: 15, 
    marginTop: 20, 
    borderRadius: 10, 
    elevation: 3,
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 20,
    borderColor: '#FD6A00',
  },
  centerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  centerSubText: {
    fontSize: 12,
    color: '#666',
  },
  statsLegend: {
    marginTop: 15,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  monthlyChartContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
  },
  chartColumn: {
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 5,
  },
  salesBar: {
    width: 8,
    backgroundColor: '#FD6A00',
    marginRight: 2,
    borderRadius: 2,
  },
  rentalsBar: {
    width: 8,
    backgroundColor: '#FFD1A3',
    borderRadius: 2,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  statsBadge: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  statsText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 16,
  },
});

export default MonParkingScreen;