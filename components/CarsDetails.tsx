import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { BASE_URL } from './services/listeVoiture';

interface Vehicule {
  id: number;
  marque: string;
  model: string;
  prix: number;
  photos: string[] | string;
  dureeGarantie?: number;
  mileage?: number;
  fuelType?: string;
  carteGrise?: boolean;
  assurance?: boolean;
  vignette?: boolean;
}

const { width } = Dimensions.get('window');

function CarDetailScreen() {
  const route = useRoute<any>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Vérifier si le véhicule est passé en paramètre
  let vehicule: Vehicule | null = null;
  
  if (route.params?.vehicule) {
    try {
      // Si le véhicule est passé comme string JSON, le parser
      if (typeof route.params.vehicule === 'string') {
        vehicule = JSON.parse(route.params.vehicule);
      } else {
        vehicule = route.params.vehicule;
      }
    } catch (error) {
      console.error('Erreur lors du parsing du véhicule:', error);
    }
  }

  // Afficher un loader si les données ne sont pas encore disponibles
  if (!vehicule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6F00" />
          <Text style={{ marginTop: 10 }}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Préparer les URLs des photos
  const getPhotoUrls = (photos: string[] | string | undefined): string[] => {
    if (!photos) return [];
    
    if (Array.isArray(photos)) {
      return photos.map(photo => 
        photo.startsWith('http') ? photo : `${BASE_URL}${photo}`
      );
    }
    
    return [photos.startsWith('http') ? photos : `${BASE_URL}${photos}`];
  };

  const photoUrls = getPhotoUrls(vehicule.photos);

  // Fonction pour afficher seulement les détails disponibles
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

  // Rendu d'une image dans le carrousel
  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.carImage} resizeMode="cover" />
    </View>
  );

  // Indicateurs de pagination pour le carrousel
  const renderPagination = () => {
    if (photoUrls.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {photoUrls.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentImageIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Carrousel d'images du véhicule */}
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
                const newIndex = Math.floor(
                  event.nativeEvent.contentOffset.x / width
                );
                setCurrentImageIndex(newIndex);
              }}
            />
            {renderPagination()}
          </View>
        ) : (
          <View style={[styles.imageContainer, styles.placeholderImage]}>
            <FontAwesome5 name="car" size={60} color="#ccc" />
          </View>
        )}

        {/* En-tête avec nom et prix */}
        <View style={styles.headerCard}>
          <Text style={styles.carName}>{vehicule.marque || 'Marque inconnue'} {vehicule.model || 'Modèle inconnu'}</Text>
          <Text style={styles.priceValue}>
            {vehicule.prix ? `${vehicule.prix.toLocaleString()} FCFA` : 'Prix non disponible'}
          </Text>
        </View>

        {/* Bouton de réservation */}
        <TouchableOpacity style={styles.reserveButton}>
          <Text style={styles.reserveButtonText}>Réserver</Text>
        </TouchableOpacity>

        {/* Détails du véhicule - Seulement les champs disponibles */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Détails du véhicule</Text>
          
          <View style={styles.featuresGrid}>
            {/* Première ligne */}
            <View style={styles.featureRow}>
              {renderFeatureItem(
                <MaterialIcons name="branding-watermark" size={22} color="#FF6F00" />,
                'Marque',
                vehicule.marque,
                !!vehicule.marque
              )}
              
              {renderFeatureItem(
                <FontAwesome5 name="tachometer-alt" size={20} color="#FF6F00" />,
                'Kilométrage',
                vehicule.mileage ? `${vehicule.mileage.toLocaleString()} km` : null,
                vehicule.mileage !== undefined
              )}
            </View>

            {/* Deuxième ligne */}
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
                vehicule.dureeGarantie ? `${vehicule.dureeGarantie} mois` : null,
                vehicule.dureeGarantie !== undefined
              )}
            </View>
          </View>
        </View>

        {/* Options supplémentaires - Uniquement si au moins une option existe */}
        {(vehicule.carteGrise !== undefined || vehicule.assurance !== undefined || vehicule.vignette !== undefined) && (
          <View style={styles.optionsCard}>
            <Text style={styles.sectionTitle}>Options</Text>
            
            <View style={styles.optionsList}>
              {vehicule.carteGrise !== undefined && (
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
              )}
              
              {vehicule.assurance !== undefined && (
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
              )}
              
              {vehicule.vignette !== undefined && (
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
              )}
            </View>
          </View>
        )}

        {/* Description ou message si peu d'informations */}
        {(vehicule.marque === undefined && vehicule.model === undefined && vehicule.prix === undefined) && (
          <View style={styles.infoMessage}>
            <MaterialIcons name="info" size={24} color="#666" />
            <Text style={styles.infoMessageText}>
              Informations limitées disponibles pour ce véhicule
            </Text>
          </View>
        )}
      </ScrollView>
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
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#FF6F00'
  },
  reserveButton: {
    backgroundColor: '#FF6F00',
    marginHorizontal: 16,
    marginVertical: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featuresGrid: {
    marginBottom: 8,
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
  infoMessage: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoMessageText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    textAlign: 'center',
  },
});

export default CarDetailScreen;