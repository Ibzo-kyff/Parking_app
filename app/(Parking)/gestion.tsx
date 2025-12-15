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
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getParkingManagementData, setAuthToken } from '../../components/services/back';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';

// Types adaptés à votre backend
type Vehicule = {
  id: string;
  marqueRef: {
    name: string;
  };
  model: string;
  status: string;
  photos: string[];
  prix: number;
  forSale: boolean;
  forRent: boolean;
  stats?: {
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
  // NOUVEAUX CHAMPS POUR LES DÉTAILS
  dureeGarantie?: number;
  mileage?: number;
  fuelType?: string;
  carteGrise?: boolean;
  assurance?: boolean;
  vignette?: boolean;
  description?: string;
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
  vehicles: Vehicule[];
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
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MonParkingScreen: React.FC = () => {
  const { authState, refreshAuth } = useAuth();
  const [parkingData, setParkingData] = useState<ParkingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBottomFilter, setSelectedBottomFilter] = useState('Tous');
  const [sticky, setSticky] = useState(false);
  const [graphType, setGraphType] = useState<'pie' | 'bar'>('pie');
  const [menuVisible, setMenuVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const fetchParkingData = async () => {
      setLoading(true);
      try {
        if (authState.accessToken) {
          console.log('🔑 Token présent, récupération données...');
          setAuthToken(authState.accessToken);
          const data = await getParkingManagementData();
          
          // DEBUG: Vérifier la structure des données
          console.log('✅ Données parking reçues:', {
            parking: data.parking,
            nbVehicles: data.vehicles?.length,
            statistics: data.statistics
          });
          
          // DEBUG: Vérifier le premier véhicule pour voir tous les champs
          if (data.vehicles && data.vehicles.length > 0) {
            console.log('🚗 Premier véhicule complet:', data.vehicles[0]);
            console.log('📋 Champs disponibles:', Object.keys(data.vehicles[0]));
          }
          
          setParkingData(data);
        } else {
          console.warn('❌ Token absent');
        }
      } catch (error: any) {
        console.error('❌ Erreur API gestion parking:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 403) {
          console.log("🔄 Tentative de rafraîchissement...");
          const success = await refreshAuth();
          if (success && authState.accessToken) {
            setAuthToken(authState.accessToken);
            const data = await getParkingManagementData();
            setParkingData(data);
          } else {
            console.error('❌ Rafraîchissement échoué');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (authState.accessToken) {
      fetchParkingData();
    } else {
      console.error('❌ Token absent, requête non effectuée');
      setLoading(false);
    }
  }, [authState.accessToken]);

  // Calcul des statistiques basées sur les données du backend
  const totalVoitures = parkingData?.statistics.total || 0;
  
  // Calcul basé sur les véhicules réels du parking
  const calculateStatisticsFromVehicles = () => {
    if (!parkingData?.vehicles) {
      return {
        voituresVente: 0,
        voituresLocation: 0,
        voituresReservation: 0
      };
    }

    const vehicles = parkingData.vehicles;
    
    const voituresVente = vehicles.filter(v => v.forSale === true && v.status !== 'ACHETE').length;
    const voituresLocation = vehicles.filter(v => v.forRent === true && v.status !== 'EN_LOCATION').length;
    const voituresReservation = vehicles.reduce((total, v) => 
      total + (v.stats?.reservationsActives || 0), 0
    );

    return {
      voituresVente,
      voituresLocation,
      voituresReservation
    };
  };

  const { voituresVente, voituresLocation, voituresReservation } = calculateStatisticsFromVehicles();

  // Calcul des pourcentages pour le graphique
  const pourcentageLocation = totalVoitures ? (voituresLocation / totalVoitures) * 100 : 0;
  const pourcentageVente = totalVoitures ? (voituresVente / totalVoitures) * 100 : 0;
  const pourcentageReservation = totalVoitures ? (voituresReservation / totalVoitures) * 100 : 0;

  // Ajustement pour que la somme fasse 100%
  const totalPourcentage = pourcentageLocation + pourcentageVente + pourcentageReservation;
  const adjustedPourcentageLocation = totalPourcentage > 0 ? (pourcentageLocation / totalPourcentage) * 100 : 0;
  const adjustedPourcentageVente = totalPourcentage > 0 ? (pourcentageVente / totalPourcentage) * 100 : 0;
  const adjustedPourcentageReservation = totalPourcentage > 0 ? (pourcentageReservation / totalPourcentage) * 100 : 0;

  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { 
      value: adjustedPourcentageLocation, 
      color: '#FD6A00', 
      label: 'En location', 
      count: voituresLocation,
      originalPercentage: pourcentageLocation
    },
    { 
      value: adjustedPourcentageVente, 
      color: '#FFD1A3', 
      label: 'En vente', 
      count: voituresVente,
      originalPercentage: pourcentageVente
    },
    { 
      value: adjustedPourcentageReservation, 
      color: '#f1f1f1', 
      label: 'En réservation', 
      count: voituresReservation,
      originalPercentage: pourcentageReservation
    },
  ];

  // Filtrage des voitures selon votre backend
  const filteredVoitures = parkingData?.vehicles.filter(v => {
    if (selectedBottomFilter === 'En vente') return v.forSale === true && v.status !== 'ACHETE';
    if (selectedBottomFilter === 'En location') return v.forRent === true && v.status !== 'EN_LOCATION';
    if (selectedBottomFilter === 'Tous') return true;
    return true;
  }).filter(v =>
    v.marqueRef.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getImageSource = (forSale: boolean, forRent: boolean) => {
    if (forRent) return require('../../assets/images/location.jpeg');
    if (forSale) return require('../../assets/images/vente.png');
    return require('../../assets/images/disponible.png');
  };

  const getStatusLabel = (forSale: boolean, forRent: boolean, status: string) => {
    if (status && status !== 'DISPONIBLE') {
      switch (status) {
        case 'EN_LOCATION': return 'En location';
        case 'ACHETE': return 'Vendu';
        case 'DISPONIBLE': return 'Disponible';
        case 'EN_MAINTENANCE': return 'Maintenance';
        case 'INDISPONIBLE': return 'Indisponible';
        default: return status;
      }
    }
    
    if (forSale && forRent) return 'Vente & Location';
    if (forSale) return 'En vente';
    if (forRent) return 'En location';
    return 'Disponible';
  };

  // FONCTION AMÉLIORÉE : Afficher les détails supplémentaires
  const renderAdditionalDetails = (vehicule: Vehicule) => {
    const details = [];
    
    if (vehicule.mileage) {
      details.push(`${vehicule.mileage.toLocaleString()} km`);
    }
    
    if (vehicule.fuelType) {
      details.push(vehicule.fuelType);
    }
    
    if (vehicule.dureeGarantie) {
      details.push(`Garantie ${vehicule.dureeGarantie} mois`);
    }
    
    if (details.length > 0) {
      return (
        <Text style={styles.additionalDetails}>
          {details.join(' • ')}
        </Text>
      );
    }
    
    return null;
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

  // FONCTION POUR VOIR LES DÉTAILS COMPLETS
  const handleVoiturePress = (vehicule: Vehicule) => {
    console.log('🚗 Navigation vers détails:', vehicule);
    router.push({
      pathname: "/(Clients)/CreateListingScreen",
      params: { 
        vehicule: JSON.stringify(vehicule),
        isParkingView: 'true'
      }
    });
  };

  const renderBottomButtons = () => (
    <View style={styles.bottomButtonsContainer}>
      {['Tous', 'En vente', 'En location'].map(filter => (
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

  const renderBarChart = () => {
    const monthlyData = parkingData?.charts?.monthlyData;
    if (!monthlyData) return null;

    // Afficher seulement les 4 derniers mois
    const numMonths = 4;
    const displayedLabels = monthlyData.labels.slice(-numMonths);
    const displayedSales = monthlyData.sales.slice(-numMonths);
    const displayedRentals = monthlyData.rentals.slice(-numMonths);

    const maxValue = Math.max(...displayedSales, ...displayedRentals, 1);
    const chartHeight = 150;
    const barWidth = 25;
    const spacing = 15;
    const totalWidth = displayedLabels.length * (barWidth * 2 + spacing);
    const chartPadding = 20;
    const yLabelWidth = 5; // Espace supplémentaire pour les labels Y

    return (
      <View style={styles.barChartContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: chartPadding }}
        >
          <Svg width={totalWidth + chartPadding * 2 + yLabelWidth} height={chartHeight + 60}>
            {/* Lignes horizontales et labels Y */}
            <G x={yLabelWidth}>
              {[0, 25, 50, 75, 100].map((percent, index) => {
                const y = chartHeight - (percent / 100) * chartHeight;
                const labelValue = Math.round((percent / 100) * maxValue);
                return (
                  <G key={index}>
                    <Rect
                      x={chartPadding}
                      y={y}
                      width={totalWidth}
                      height={1}
                      fill="#e0e0e0"
                    />
                    <SvgText
                      x={chartPadding - 5}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="#666"
                    >
                      {labelValue}
                    </SvgText>
                  </G>
                );
              })}
            </G>

            {/* Barres et labels */}
            <G x={yLabelWidth}>
              {displayedLabels.map((label, index) => {
                const x = index * (barWidth * 2 + spacing) + chartPadding;
                const salesHeight = (displayedSales[index] / maxValue) * chartHeight;
                const rentalsHeight = (displayedRentals[index] / maxValue) * chartHeight;

                return (
                  <G key={index}>
                    <Rect
                      x={x}
                      y={chartHeight - salesHeight}
                      width={barWidth}
                      height={salesHeight}
                      fill="#FD6A00"
                      rx={4}
                    />
                    <Rect
                      x={x + barWidth + 2}
                      y={chartHeight - rentalsHeight}
                      width={barWidth}
                      height={rentalsHeight}
                      fill="#FFD1A3"
                      rx={4}
                    />
                    
                    <SvgText
                      x={x + barWidth / 2}
                      y={chartHeight - salesHeight - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={displayedSales[index] === 0 ? "#999" : "#333"}
                    >
                      {displayedSales[index]}
                    </SvgText>
                    
                    <SvgText
                      x={x + barWidth * 1.5 + 2}
                      y={chartHeight - rentalsHeight - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={displayedRentals[index] === 0 ? "#999" : "#333"}
                    >
                      {displayedRentals[index]}
                    </SvgText>
                    
                    <SvgText
                      x={x + barWidth}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#666"
                    >
                      {label}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        </ScrollView>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FD6A00' }]} />
            <Text style={styles.legendText}>Ventes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFD1A3' }]} />
            <Text style={styles.legendText}>Locations</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGraphContainer = () => {
    let startAngle = -90;
    const monthlyData = parkingData?.charts?.monthlyData;

    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>
            {graphType === 'pie' ? 'Résumé voitures' : 'Ventes & Locations mensuelles'}
          </Text>
          <TouchableOpacity style={styles.settingsIcon} onPress={() => setMenuVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#FD6A00" />
          </TouchableOpacity>
        </View>

        <Modal transparent visible={menuVisible} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setGraphType('pie'); setMenuVisible(false); }}>
                <Text style={graphType === 'pie' ? styles.menuItemActiveText : styles.menuItemText}>Résumé voitures</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setGraphType('bar'); setMenuVisible(false); }}>
                <Text style={graphType === 'bar' ? styles.menuItemActiveText : styles.menuItemText}>Ventes / Locations</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {graphType === 'pie' ? (
          <View style={styles.pieWrapper}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={size} height={size}>
                <G rotation="-90" originX={size / 2} originY={size / 2}>
                  {segments.map((segment, index) => {
                    const arc = (segment.value / 100) * circumference;
                    const circle = (
                      <Circle
                        key={index}
                        stroke={segment.color}
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arc} ${circumference - arc}`}
                        strokeDashoffset={-(startAngle / 360) * circumference}
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                      />
                    );
                    startAngle += (segment.value / 100) * 360;
                    return circle;
                  })}
                </G>
              </Svg>
              <View style={styles.centerText}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{totalVoitures}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>Voitures</Text>
                <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                  {voituresVente + voituresLocation} actives
                </Text>
              </View>
            </View>

            <View style={styles.statsLegendRight}>
              {segments.map((segment, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: segment.color }]} />
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={styles.legendPercentage}>
                      {segment.originalPercentage.toFixed(0)}%
                    </Text>
                    <Text style={styles.legendStatus}>{segment.label}</Text>
                  </View>
                  <Text style={styles.legendCount}>{segment.count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          renderBarChart()
        )}
      </View>
    );
  };

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#FD6A00" style={{ marginTop: 50 }} /></SafeAreaView>;
  if (!parkingData) return <SafeAreaView style={styles.container}><Text style={styles.errorText}>Aucune donnée de parking disponible</Text></SafeAreaView>;

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
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('../(ParkingDetail)/AjoutParking')}>
            <Ionicons name="add-circle" size={24} color="#FD6A00" />
            <Text style={styles.addText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.total}>Total des voitures : {totalVoitures}</Text>

        {renderGraphContainer()}

        {!sticky && renderBottomButtons()}

        <View style={{ marginTop: 20 }}>
          {filteredVoitures.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {selectedBottomFilter === 'Tous' 
                  ? 'Aucune voiture dans votre parking' 
                  : `Aucune voiture ${selectedBottomFilter.toLowerCase()}`
                }
              </Text>
            </View>
          ) : (
            filteredVoitures.map(voiture => (
              <TouchableOpacity 
                key={voiture.id} 
                style={styles.voitureCard}
                onPress={() => handleVoiturePress(voiture)}
              >
                <View style={styles.voitureInfo}>
                  <Image
                    source={voiture.photos && voiture.photos.length > 0 ? { uri: voiture.photos[0] } : getImageSource(voiture.forSale, voiture.forRent)}
                    style={styles.voitureImageClickable}
                    defaultSource={getImageSource(voiture.forSale, voiture.forRent)}
                  />
                  <View style={styles.voitureDetails}>
                    <Text style={styles.voitureName}>
                      {voiture.marqueRef.name} {voiture.model}
                    </Text>
                    <Text style={styles.voitureStatus}>
                      {getStatusLabel(voiture.forSale, voiture.forRent, voiture.status)}
                    </Text>
                    <Text style={styles.voiturePrice}>{voiture.prix.toLocaleString()} FCFA</Text>
                    
                    {/* AFFICHER LES DÉTAILS SUPPLÉMENTAIRES */}
                    {renderAdditionalDetails(voiture)}
                    
                    {voiture.stats && voiture.stats.reservationsActives > 0 && (
                      <Text style={styles.reservationActive}>
                        {voiture.stats.reservationsActives} réservation(s) active(s)
                      </Text>
                    )}
                    
                    {voiture.nextReservation && (
                      <Text style={styles.nextReservation}>
                        Prochaine réservation: {new Date(voiture.nextReservation.date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  addText: { marginLeft: 5, color: '#FD6A00', fontWeight: 'bold' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20, 
    flexWrap: 'wrap' 
  },
  bottomButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    borderRadius: 25, 
    backgroundColor: '#FFD1A3', 
    margin: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  bottomButtonActive: { backgroundColor: '#FD6A00' },
  bottomButtonText: { color: '#FD6A00', fontWeight: 'bold', fontSize: 12 },
  bottomButtonTextActive: { color: '#fff' },
  voitureCard: { 
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
  voitureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voitureImageClickable: { 
    width: 100, 
    height: 80, 
    borderRadius: 10, 
    resizeMode: 'cover' 
  },
  voitureDetails: {
    flex: 1,
    marginLeft: 10,
  },
  voitureName: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
  },
  voitureStatus: { 
    fontSize: 14, 
    color: '#666',
    marginTop: 2,
  },
  voiturePrice: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#FD6A00',
    marginTop: 4,
  },
  // NOUVEAU STYLE POUR LES DÉTAILS SUPPLÉMENTAIRES
  additionalDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  reservationActive: {
    fontSize: 12, 
    color: '#666', 
    fontWeight: 'bold',
    marginTop: 2,
  },
  nextReservation: {
    fontSize: 12, 
    color: '#666',
    marginTop: 2,
  },
  errorText: { 
    textAlign: 'center', 
    marginTop: 50, 
    color: '#666', 
    fontSize: 16 
  },
  centerText: { 
    position: 'absolute', 
    top: '40%', 
    left: 0, 
    right: 0, 
    alignItems: 'center' 
  },
  graphContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginTop: 20, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pieWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  graphTitle: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#333',
  },
  settingsIcon: { 
    padding: 5,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  menuContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    width: 200,
    elevation: 5,
  },
  menuItem: { 
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuItemText: { 
    fontSize: 14, 
    color: '#333' 
  },
  menuItemActiveText: { 
    fontSize: 14, 
    color: '#FD6A00', 
    fontWeight: 'bold' 
  },
  statsLegendRight: { 
    marginLeft: 20 
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    width: 120,
  },
  legendCircle: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 8 
  },
  legendPercentage: { 
    fontSize: 12, 
    fontWeight: 'bold',
    color: '#333',
  },
  legendStatus: { 
    fontSize: 10, 
    color: '#666' 
  },
  legendCount: { 
    marginLeft: 'auto', 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#FD6A00' 
  },
  barChartContainer: {
    height: 220,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    paddingHorizontal: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MonParkingScreen;