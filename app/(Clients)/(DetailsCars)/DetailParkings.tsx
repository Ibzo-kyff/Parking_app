import React, { useEffect, useState } from "react";
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
import { FontAwesome, MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";

interface Parking {
  id: number;
  userId: number;
  name: string;
  address: string;
  city: string;
  email: string;
  phone: string | null;
  description: string | null;
  capacity: number;
  hoursOfOperation: string | null;
  status: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
  };
  vehicles?: any[];
}

export default function ParkingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debug: Afficher l'ID reçu
  console.log("ID reçu:", id);

  useEffect(() => {
    const fetchParkingDetails = async () => {
      // Vérifier que l'ID est valide
      if (!id || isNaN(Number(id))) {
        setError("ID de parking invalide");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`https://parkapp-pi.vercel.app/api/parkings/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
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

  const handleNavigate = () => {
    if (parking?.address) {
      const address = encodeURIComponent(`${parking.address}, ${parking.city}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Image
        source={{
          uri: parking.logo
            ? `https://parkapp-pi.vercel.app${parking.logo}`
            : "https://images.unsplash.com/photo-1565898835704-3d6be4a2c98c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
        }}
        style={styles.image}
        resizeMode="cover"
        onError={() => console.log("Erreur de chargement de l'image")}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{parking.name}</Text>
          <View style={[styles.statusBadge, 
            parking.status === 'ACTIVE' ? styles.statusActive : 
            parking.status === 'INACTIVE' ? styles.statusInactive : 
            styles.statusMaintenance
          ]}>
            <Text style={styles.statusText}>
              {parking.status === 'ACTIVE' ? 'Actif' : 
               parking.status === 'INACTIVE' ? 'Inactif' : 'Maintenance'}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={20} color="#6200ee" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Adresse</Text>
              <Text style={styles.infoValue}>{parking.address}</Text>
              <Text style={styles.infoSubValue}>{parking.city}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Ionicons name="time" size={20} color="#6200ee" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Horaires d'ouverture</Text>
              <Text style={styles.infoValue}>
                {parking.hoursOfOperation || "Non spécifié"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {parking.phone && (
            <>
              <View style={styles.infoItem}>
                <FontAwesome name="phone" size={20} color="#6200ee" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Téléphone</Text>
                  <Text style={styles.infoValue}>{parking.phone}</Text>
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={20} color="#6200ee" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{parking.email}</Text>
            </View>
          </View>

          {parking.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color="#6200ee" />
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
              <Feather name="book" size={24} color="#6200ee" />
              <Text style={styles.statValue}>{parking.capacity}</Text>
              <Text style={styles.statLabel}>Capacité totale</Text>
            </View>
            
            {parking.user && (
              <View style={styles.statItem}>
                <Ionicons name="person" size={24} color="#6200ee" />
                <Text style={styles.statValue}>{parking.user.nom} {parking.user.prenom}</Text>
                <Text style={styles.statLabel}>Gestionnaire</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />
          
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>
              Créé le: {formatDate(parking.createdAt)}
            </Text>
            <Text style={styles.metaText}>
              Modifié le: {formatDate(parking.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]} 
            onPress={handleCall}
            disabled={!parking.phone}
          >
            <FontAwesome 
              name="phone" 
              size={20} 
              color={parking.phone ? "#fff" : "#ccc"} 
            />
            <Text style={[
              styles.actionButtonText,
              !parking.phone && styles.actionButtonTextDisabled
            ]}>
              Appeler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.emailButton]} 
            onPress={handleEmail}
          >
            <MaterialIcons name="email" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.navigateButton]} 
            onPress={handleNavigate}
          >
            <FontAwesome name="map-marker" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Itinéraire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  image: {
    width: "100%",
    height: 250,
  },
  content: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontWeight: "700",
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
    fontWeight: "600",
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
  },
  infoSubValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
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
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6200ee",
    marginTop: 4,
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
  metaText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
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