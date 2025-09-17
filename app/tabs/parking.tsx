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
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import Header from '../Header';
import { getParkings, Parking } from "../../components/services/parkingApi";

export const unstable_settings = {
  headerShown: false,
};

const ParkingList: React.FC = () => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [filteredParkings, setFilteredParkings] = useState<Parking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchParkings = async () => {
      try {
        const data = await getParkings();
        setParkings(data);
        setFilteredParkings(data);
      } catch {
        setError("Impossible de charger les parkings");
      } finally {
        setLoading(false);
      }
    };
    fetchParkings();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredParkings(
      parkings.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.city.toLowerCase().includes(term) ||
          (p.phone && p.phone.toLowerCase().includes(term)) // Phone still searchable
      )
    );
  }, [searchTerm, parkings]);

  const handleViewDetails = (parkingId: number) => {
    router.push(`/DetailParkings?id=${parkingId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Chargement des parkings...</Text>
      </View>
    );
  }
  
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.subtitle}>Trouvez l'emplacement parfait des toutes les parkings </Text>
      </View>

      <View style={styles.searchBarContainer}>
        <FontAwesome name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Rechercher par nom, ville ou téléphone..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm("")}>
            <MaterialIcons name="clear" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {filteredParkings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Aucun parking trouvé</Text>
            <Text style={styles.emptyText}>
              Essayez d'ajuster votre recherche ou vos filtres
            </Text>
          </View>
        ) : (
          filteredParkings.map((parking) => (
            <View key={parking.id} style={styles.card}>
              <Image
                source={{
                  uri: parking.logo
                    ? `https://parkapp-pi.vercel.app${parking.logo}`
                    : "https://images.unsplash.com/photo-1565898835704-3d6be4a2c98c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
                }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.parkingName}>{parking.name}</Text>
                <View style={styles.locationContainer}>
                  <FontAwesome name="map-marker" size={14} color="#6200ee" />
                  <Text style={styles.parkingCity}>{parking.city}</Text>
                </View>
                {/* Removed phone number display */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={() => handleViewDetails(parking.id)}
                  >
                    <Text style={styles.buttonText}>Voir détails</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: { 
    marginRight: 12,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { 
    width: 100, 
    height: "100%",
  },
  cardContent: { 
    flex: 1, 
    padding: 16,
    justifyContent: "center",
  },
  parkingName: { 
    fontWeight: "700", 
    fontSize: 18, 
    color: "#1a1a1a",
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  parkingCity: { 
    color: "#666", 
    fontSize: 14,
    marginLeft: 6,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  parkingPhone: {
    color: "#666", 
    fontSize: 13,
    marginLeft: 6,
  },
  buttonContainer: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  button: {
    backgroundColor:  '#ff7d00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  error: { 
    textAlign: "center", 
    color: "red", 
    marginTop: 20,
    fontSize: 16,
  },
});

export default ParkingList;