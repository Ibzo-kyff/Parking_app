import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

import { getParkings, Parking } from "../../components/services/parkingApi";

export const unstable_settings = {
  headerShown: false,
};

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 40 - CARD_MARGIN) / 2; // 2 cartes par ligne avec marges

const ParkingList: React.FC = () => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [filteredParkings, setFilteredParkings] = useState<Parking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    const fetchParkings = async () => {
      try {
        setLoading(true);
        const data = await getParkings();
        setParkings(data);
        setFilteredParkings(data);
      } catch (err) {
        console.error("Error fetching parkings:", err);
        setError("Impossible de charger les parkings. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };
    fetchParkings();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredParkings(parkings);
      return;
    }

    setFilteredParkings(
      parkings.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.city.toLowerCase().includes(term) ||
          (p.phone && p.phone.toLowerCase().includes(term)) ||
          (p.address && p.address.toLowerCase().includes(term))
      )
    );
  }, [searchTerm, parkings]);

  const handleViewDetails = (parkingId: number, parkingName: string) => {
    router.push({
      pathname: '/(Clients)/MesVoiture',
      params: {
        parkingId: parkingId.toString(),
        parkingName
      }
    });
  };

  const handleImageError = (parkingId: number) => {
    setImageErrors(prev => ({ ...prev, [parkingId]: true }));
  };

  const renderParkingCard = ({ item: parking }: { item: Parking }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => handleViewDetails(parking.id, parking.name)}
    >
      {/* Image avec overlay */}
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: parking.logo && !imageErrors[parking.id]
              ? parking.logo
              : "https://images.unsplash.com/photo-1565898835704-3d6be4a2c98c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
          }}
          style={styles.image}
          resizeMode="cover"
          onError={() => handleImageError(parking.id)}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.imageOverlay}
        />

        {/* Badge de statut */}
        {parking.status && (
          <View style={[
            styles.statusBadge,
            parking.status === 'ACTIVE' && styles.statusActive,
            parking.status === 'CLOSED' && styles.statusClosed,
          ]}>
            <Ionicons
              name={parking.status === 'ACTIVE' ? "checkmark-circle" : "close-circle"}
              size={12}
              color="#FFF"
            />
            <Text style={styles.statusText}>
              {parking.status === 'ACTIVE' ? 'Ouvert' : 'Fermé'}
            </Text>
          </View>
        )}
      </View>

      {/* Contenu de la carte */}
      <View style={styles.cardContent}>
        {/* Nom du parking */}
        <Text style={styles.parkingName} numberOfLines={2}>
          {parking.name}
        </Text>

        {/* Adresse complète */}
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={12} color="#666" />
          <View style={styles.addressTextContainer}>
            {parking.address && (
              <Text style={styles.parkingAddress} numberOfLines={1}>
                {parking.address}
              </Text>
            )}
            <Text style={styles.parkingCity} numberOfLines={1}>
              {parking.city}
              {parking.zipCode && `, ${parking.zipCode}`}
            </Text>
          </View>
        </View>

        {/* Téléphone masqué intentionnellement */}

        {/* Informations rapides */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="car-sport-outline" size={10} color="#FF6200" />
            <Text style={styles.infoText}>Parking</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={10} color="#FF6200" />
            <Text style={styles.infoText}>24/24</Text>
          </View>
        </View>

        {/* Bouton d'action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleViewDetails(parking.id, parking.name);
          }}
        >
          <LinearGradient
            colors={['#ff7d00', '#ff7d00']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Explorez</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6200" />
        <Text style={styles.loadingText}>Chargement des parkings...</Text>
      </View>
    );
  }

  if (error && parkings.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header compact */}
      <LinearGradient
        colors={['#ff7d00', '#ff7d00']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Parkings</Text>
          <Text style={styles.subtitle}>
            Trouvez votre parking idéal
          </Text>
        </View>
      </LinearGradient>

      {/* Barre de recherche style MesVoiture */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Nom, ville, adresse..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchTerm("")}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="filter-list"
            size={22}
            color="#ff7d00"
          />
        </TouchableOpacity>
      </View>

      {/* Statistiques compactes */}
      <View style={styles.statsWrapper}>
        <Text style={styles.statText}>
          {searchTerm.length > 0 && `${filteredParkings.length} résultat${filteredParkings.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Liste des parkings en grille 2x2 */}
      {filteredParkings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Aucun parking trouvé</Text>
          <Text style={styles.emptyText}>
            Essayez avec d'autres termes de recherche
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setSearchTerm("")}
          >
            <Text style={styles.emptyButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredParkings}
          renderItem={renderParkingCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {/* {filteredParkings.length} résultat{filteredParkings.length > 1 ? 's' : ''} */}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Header compact
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_800ExtraBold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "Inter_400Regular",
  },

  // Search
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1d1d1f',
    height: '100%',
    fontFamily: "Inter_400Regular",
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
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  statText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    minHeight: 18,
  },

  // Grid Container
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -36, // remonter les cartes pour chevaucher légèrement l'en-tête
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },

  // Results Count
  resultsCount: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    fontFamily: "Inter_500Medium",
  },

  // Card (2 par ligne)
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  statusActive: {
    backgroundColor: "rgba(76, 175, 80, 0.9)",
  },
  statusClosed: {
    backgroundColor: "rgba(244, 67, 54, 0.9)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    marginLeft: 4,
  },

  // Card Content (compact)
  cardContent: {
    padding: 12,
    marginTop: 10
  },
  parkingName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36, // Pour 2 lignes de texte
  },

  // Adresse complète
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 6,
  },
  parkingAddress: {
    fontSize: 11,
    color: "#333",
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  parkingCity: {
    fontSize: 11,
    color: "#666",
    fontFamily: "Inter_400Regular",
  },

  // Contact
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  parkingPhone: {
    fontSize: 11,
    color: "#666",
    marginLeft: 6,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 10,
    color: "#666",
    marginLeft: 4,
    fontFamily: "Inter_400Regular",
  },

  // Button
  actionButton: {
    borderRadius: 10,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginRight: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 16,
    fontFamily: "Inter_700Bold",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  retryButton: {
    backgroundColor: "#FF6200",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    fontFamily: "Inter_700Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: "Inter_400Regular",
  },
  emptyButton: {
    backgroundColor: "#FF6200",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});

export default ParkingList;