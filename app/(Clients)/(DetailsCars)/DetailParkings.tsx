import * as React from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { FontAwesome, MaterialIcons, Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { getParkingById, Parking } from "../../../components/services/parkingApi";

export default function ParkingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parking, setParking] = React.useState<Parking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [imageError, setImageError] = React.useState(false);

  // Debug: Afficher l'ID reçu
  console.log("ID reçu:", id);

  React.useEffect(() => {
    const fetchParkingDetails = async () => {
      if (!id || isNaN(Number(id))) {
        setError("ID de parking invalide");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getParkingById(id);
        console.log("Données reçues:", data);
        setParking(data);
      } catch (err: any) {
        console.error("Erreur détail parking:", err);
        setError(err.message || "Impossible de charger ce parking");
        Alert.alert("Erreur", err.message || "Impossible de charger ce parking");
      } finally {
        setLoading(false);
      }
    };

    fetchParkingDetails();
  }, [id]);

  const handleCall = () => {
    if (parking?.phone) {
      Linking.openURL(`tel:${parking.phone}`);
    } else {
      Alert.alert("Information", "Aucun numéro de téléphone disponible");
    }
  };

  const handleEmail = () => {
    if (parking?.email) {
      Linking.openURL(`mailto:${parking.email}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#ff3b30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!parking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Parking introuvable</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          {parking.logo && !imageError ? (
            <Image
              source={{
                uri: `https://parkapp-pi.vercel.app${parking.logo}`,
              }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons name="parking" size={60} color="#6200ee" />
              <Text style={styles.placeholderText}>{parking.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{parking.name}</Text>
            <View
              style={[
                styles.statusBadge,
                parking.status === "ACTIVE"
                  ? styles.statusActive
                  : parking.status === "INACTIVE"
                  ? styles.statusInactive
                  : styles.statusMaintenance,
              ]}
            >
              <Text style={styles.statusText}>
                {parking.status === "ACTIVE"
                  ? "Actif"
                  : parking.status === "INACTIVE"
                  ? "Inactif"
                  : "Maintenance"}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#6200ee" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{parking.address}</Text>
                <Text style={styles.infoSubValue}>{parking.city}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="time" size={20} color="#6200ee" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Horaires d'ouverture</Text>
                <Text style={styles.infoValue}>
                  {parking.hoursOfOperation || "Non spécifié"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="email" size={20} color="#6200ee" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{parking.email}</Text>
              </View>
            </View>

            {parking.description && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="information-circle" size={20} color="#6200ee" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.infoValue}>{parking.description}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Feather name="book" size={24} color="#fff" />
                </View>
                <Text style={styles.statValue}>{parking.capacity}</Text>
                <Text style={styles.statLabel}>Places totales</Text>
              </View>

              {parking.user && (
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <Text style={styles.statValue}>
                    {parking.user.nom} {parking.user.prenom}
                  </Text>
                  <Text style={styles.statLabel}>Gestionnaire</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#888" />
                <Text style={styles.metaText}>
                  Membre le: {formatDate(parking.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
          <TouchableOpacity
          style={[styles.actionButton, styles.navigateButton]}
          onPress={() => router.navigate("messages")}
        >
          <FontAwesome name="envelope" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Messagerie</Text>
        </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Ajout du style pour le conteneur du bouton fixe
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  // ... (les autres styles restent inchangés)
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
  },
  retryButtonText: {
    color: '#ff7d00',
    fontWeight: "600",
    fontSize: 14,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 15,
    // backgroundColor:  '#ff7d00',
    // borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6200ee",
    fontWeight: "600",
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#4CAF50",
  },
  statusInactive: {
    backgroundColor: "#F44336",
  },
  statusMaintenance: {
    backgroundColor: "#FF9800",
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(98, 0, 238, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    lineHeight: 22,
  },
  infoSubValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor:  '#ff7d00',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6200ee",
    marginTop: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  metaInfo: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
  },
  callButton: {
    backgroundColor: "#4CAF50",
  },
  emailButton: {
    backgroundColor: "#2196F3",
  },
  navigateButton: {
    backgroundColor: "#FF9800",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  actionButtonTextDisabled: {
    color: "#eee",
  },
});