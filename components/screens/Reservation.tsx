import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../app/Header";
// Define Reservation type based on backend data
export type Reservation = {
  id: number;
  user?: {
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    id: number;
    marque: string;
    model: string;
    photos: string[];
    parking?: {
      nom: string;
    };
    prix: number;
    fuelType: string;
    mileage: number;
    description?: string;
  };
  dateDebut: string | null;
  dateFin: string | null;
  type: "ACHAT" | "LOCATION";
};

type ReservationListProps = {
  fetchReservations: () => Promise<Reservation[]>;
  cancelReservation: (id: number) => Promise<void>;
};

const Reservation: React.FC<ReservationListProps> = ({
  fetchReservations,
  cancelReservation,
}) => {
  const { authState } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const loadReservations = async () => {
    try {
      setError(null);
      const data = await fetchReservations();
      setReservations(data);
    } catch (err: any) {
      console.error("Erreur lors du chargement des réservations", err);
      setError(err.response?.data?.message || "Impossible de charger les réservations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = (id: number) => {
    Alert.alert(
      "Annuler la réservation",
      "Êtes-vous sûr de vouloir annuler cette réservation ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          onPress: async () => {
            try {
              await cancelReservation(id);
              setReservations((prev) => prev.filter((r) => r.id !== id));
              Alert.alert("Succès", "Réservation annulée avec succès");
            } catch (err: any) {
              console.error("Erreur lors de l'annulation", err);
              Alert.alert(
                "Erreur",
                err.response?.data?.message || "Impossible d'annuler la réservation"
              );
            }
          },
        },
      ]
    );
  };

  const handleImageError = (reservationId: number) => {
    setImageErrors((prev) => new Set(prev).add(reservationId));
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  useEffect(() => {
    if (!authState.accessToken) {
      Alert.alert("Erreur", "Veuillez vous connecter pour voir vos réservations.");
      router.push("/(auth)/LoginScreen");
      return;
    }
    loadReservations();
  }, [authState.accessToken]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6200" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReservations}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (

     <View style={styles.mainContainer}>
      {/* Header fixe */}
      <Header />
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#FF6200"]}
        />
      }
    >
      {reservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
          <Text style={styles.emptySubText}>Vos réservations apparaîtront ici</Text>
        </View>
      ) : (
        reservations.map((item) => (
          <View key={item.id} style={styles.card}>
            {/* Header avec image et informations principales */}
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      item.vehicle.photos &&
                      item.vehicle.photos.length > 0 &&
                      !imageErrors.has(item.id)
                        ? item.vehicle.photos[0]
                        : "https://via.placeholder.com/150",
                  }}
                  style={styles.vehicleImage}
                  resizeMode="cover"
                  onError={() => handleImageError(item.id)}
                />
              </View>
              
              <View style={styles.mainInfo}>
                <View style={styles.titleContainer}>
                  <Text style={styles.vehicleTitle}>
                    {item.vehicle.marque} {item.vehicle.model}
                  </Text>
                  <View style={[
                    styles.typeBadge,
                    item.type === "LOCATION" ? styles.locationBadge : styles.achatBadge
                  ]}>
                    <Text style={styles.typeBadgeText}>
                      {item.type === "LOCATION" ? "LOCATION" : "ACHAT"}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.vehiclePrice}>
                  {item.vehicle.prix.toLocaleString()} FCFA
                </Text>
                
                {item.vehicle.parking && (
                  <Text style={styles.parkingText}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    {item.vehicle.parking.nom}
                  </Text>
                )}
                
                {item.type === "LOCATION" && item.dateDebut && item.dateFin && (
                  <View style={styles.datePreview}>
                    <Text style={styles.datePreviewText}>
                      {new Date(item.dateDebut).toLocaleDateString("fr-FR")} - {" "}
                      {new Date(item.dateFin).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.expandButton}
                  onPress={() => toggleExpand(item.id)}
                >
                  <Ionicons 
                    name={expandedCards.has(item.id) ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Détails expansibles */}
            {expandedCards.has(item.id) && (
              <View style={styles.expandedContent}>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="speedometer-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.vehicle.mileage} km</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="flash-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.vehicle.fuelType}</Text>
                  </View>
                  
                  {item.user && (
                    <>
                      <View style={styles.detailItem}>
                        <Ionicons name="person-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {item.user.prenom} {item.user.nom}
                        </Text>
                      </View>
                      
                      <View style={styles.detailItem}>
                        <Ionicons name="mail-outline" size={16} color="#666" />
                        <Text style={styles.detailText}>{item.user.email}</Text>
                      </View>
                    </>
                  )}
                </View>
                
                {item.vehicle.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{item.vehicle.description}</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancel(item.id)}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
                  <Text style={styles.cancelButtonText}>Annuler la réservation</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
      </View>
  );
};

// Styles améliorés
const styles = StyleSheet.create({
    mainContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 25,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    padding: 16,

  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#FF6200",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  imageContainer: {
    marginRight: 16,
  },
  vehicleImage: {
    width: 120, // Image agrandie
    height: 100, // Image agrandie
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
  },
  mainInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationBadge: {
    backgroundColor: "#4CAF50", // Vert pour location
  },
  achatBadge: {
    backgroundColor: "#2196F3", // Bleu pour achat
  },
  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6200",
    marginBottom: 6,
  },
  parkingText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  datePreview: {
    marginTop: 4,
  },
  datePreviewText: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
  headerActions: {
    alignItems: "center",
  },
  expandButton: {
    padding: 4,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 6,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  cancelButtonText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default Reservation;