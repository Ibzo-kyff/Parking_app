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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Circle } from 'react-native-svg';
import { getUserCars, setAuthToken } from '../../components/services/back';
import { useAuth } from '../../context/AuthContext'; // Import du contexte

type Voiture = {
  id: string;
  marque: string;
  model: string;
  status: 'location' | 'vente' | 'autres';
};

const MonParkingScreen: React.FC = () => {
  const { authState } = useAuth(); // Récupération du contexte
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBottomFilter, setSelectedBottomFilter] = useState('Total');
  const [sticky, setSticky] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchCars = async () => {
      try {
        if (authState.accessToken && authState.userId) {
          setAuthToken(authState.accessToken);
          
          // Utilisation du userId du contexte
          const data = await getUserCars(authState.userId);
          setVoitures(data);
        }
      } catch (error) {
        console.error('Erreur API voitures:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (authState.userId) {
      fetchCars();
    }
  }, [authState.userId, authState.accessToken]); // Dépendances

  const totalVoitures = voitures.length;
  const voituresLocation = voitures.filter(v => v.status === 'location').length;
  const voituresVente = voitures.filter(v => v.status === 'vente').length;
  const voituresAutres = voitures.filter(v => v.status === 'autres').length;

  const pourcentageLocation = totalVoitures ? (voituresLocation / totalVoitures) * 100 : 0;
  const pourcentageVente = totalVoitures ? (voituresVente / totalVoitures) * 100 : 0;
  const pourcentageAutres = totalVoitures ? (voituresAutres / totalVoitures) * 100 : 0;

  // Graphique circulaire
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { value: pourcentageLocation, color: '#FD6A00' },
    { value: pourcentageVente, color: '#FFD1A3' },
    { value: pourcentageAutres, color: '#f1f1f1' },
  ];

  const filteredVoitures = voitures
    .filter(v => {
      if (selectedBottomFilter === 'Total') return true;
      if (selectedBottomFilter === 'En vente') return v.status === 'vente';
      if (selectedBottomFilter === 'En location') return v.status === 'location';
      return true;
    })
    .filter(v => v.marque.toLowerCase().includes(searchQuery.toLowerCase()));

  const getImageSource = (status: string) => {
    if (status === 'location') return require('../../assets/images/location.jpeg');
    if (status === 'vente') return require('../../assets/images/vente.png');
    return require('../../assets/images/tout.jpg');
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
      {['Total', 'En vente', 'En location'].map(filter => (
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

  const renderResumeGraph = () => {
    let startAngle = -90;
    return (
      <View style={{ alignItems: 'center' }}>
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
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{totalVoitures}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>Voitures</Text>
        </View>
      </View>
    );
  };

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

      {loading ? (
        <ActivityIndicator size="large" color="#FD6A00" style={{ marginTop: 50 }} />
      ) : (
        <Animated.ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Gérer vos voitures</Text>
          </View>

          <Text style={styles.total}>Total des voitures : {totalVoitures}</Text>

          <View style={styles.statsContainer}>
            {renderResumeGraph()}
          </View>

          {!sticky && renderBottomButtons()}

          <View style={{ marginTop: 20 }}>
            {filteredVoitures.map(voiture => (
              <View key={voiture.id} style={styles.voitureCard}>
                <Image source={getImageSource(voiture.status)} style={styles.voitureImageClickable} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{voiture.marque}</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>{voiture.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MonParkingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10 },
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
  stickyFloatingButtons: { position: 'absolute', top: 70, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-around', zIndex: 1000 },
  bottomButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  bottomButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, backgroundColor: '#FFD1A3' },
  bottomButtonActive: { backgroundColor: '#FD6A00' },
  bottomButtonText: { color: '#FD6A00', fontWeight: 'bold', fontSize: 14 },
  bottomButtonTextActive: { color: '#fff' },
  voitureCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 8, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  voitureImageClickable: { width: 140, height: 80, borderRadius: 10, resizeMode: 'cover' },
  statsContainer: { backgroundColor: '#fff', padding: 15, marginTop: 20, borderRadius: 10, elevation: 3 },
  centerText: { position: 'absolute', top: '40%', left: '50%', transform: [{ translateX: -20 }], alignItems: 'center' },
});
