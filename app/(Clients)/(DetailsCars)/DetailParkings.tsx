
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
  Platform,
  Share,
  RefreshControl,
} from "react-native";
import { 
  FontAwesome, 
  MaterialIcons, 
  Ionicons, 
  Feather, 
  MaterialCommunityIcons,
  FontAwesome5 
} from "@expo/vector-icons";
import { getParkingById, Parking } from "../../../components/services/parkingApi";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExtendedParking extends Parking {
  latitude?: number;
  longitude?: number;
}

interface ExtendedUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  image?: string;
}

export default function ParkingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [parking, setParking] = useState<ExtendedParking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Charger le token utilisateur
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setUserToken(token);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };
    loadToken();
  }, []);

  const fetchParkingDetails = async () => {
    console.log("Fetching parking details for ID:", id);
    
    if (!id || isNaN(Number(id))) {
      setError("ID de parking invalide");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setImageError(false);
      
      console.log("Calling API with token:", userToken ? "Yes" : "No");
      const data = await getParkingById(id);
      
      console.log("Parking data received:", {
        id: data.id,
        name: data.name,
        logo: data.logo,
        status: data.status
      });
      
      setParking(data as ExtendedParking);
    } catch (err: any) {
      console.error("Error loading parking:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = err.message || "Impossible de charger ce parking";
      
      // Messages d'erreur spécifiques
      if (err.response?.status === 404) {
        errorMessage = "Parking introuvable";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (err.message.includes("Network")) {
        errorMessage = "Erreur de connexion. Vérifiez votre internet.";
      }
      
      setError(errorMessage);
      
      Alert.alert(
        "Erreur",
        errorMessage,
        [
          { text: "OK", style: "cancel" },
          { 
            text: "Réessayer", 
            onPress: () => fetchParkingDetails(),
            style: "default" 
          }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchParkingDetails();
    }
  }, [id, userToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParkingDetails();
  };

  const handleEmail = () => {
    if (parking?.email) {
      Linking.openURL(`mailto:${parking.email}`).catch(() => {
        Alert.alert("Erreur", "Impossible d'ouvrir l'application email");
      });
    }
  };

  const handleNavigate = () => {
    if (parking?.latitude && parking?.longitude) {
      const url = Platform.select({
        ios: `maps://app?daddr=${parking.latitude},${parking.longitude}`,
        android: `geo:0,0?q=${parking.latitude},${parking.longitude}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`
      });
      
      Linking.openURL(url!).catch(() => {
        // Fallback pour web
        const address = encodeURIComponent(`${parking.address}, ${parking.city}`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
      });
    } else {
      // Utiliser l'adresse comme fallback
      const address = encodeURIComponent(`${parking?.address}, ${parking?.city}`);
      const url = Platform.select({
        ios: `maps://app?daddr=${address}`,
        android: `geo:0,0?q=${address}`,
        default: `https://www.google.com/maps/search/?api=1&query=${address}`
      });
      
      Linking.openURL(url!).catch(() => {
        Alert.alert("Erreur", "Impossible d'ouvrir l'application de navigation");
      });
    }
  };

  const handleShare = async () => {
    if (!parking) return;
    
    try {
      const message = `Parking ${parking.name}\n📍 ${parking.address}, ${parking.city}\n📧 ${parking.email}\n\nTrouvé sur ParkApp`;
      
      const result = await Share.share({
        message,
        title: `Parking ${parking.name}`,
        url: parking.logo || undefined,
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de partager les informations");
    }
  };

  const handleContactManager = () => {
    const user = parking?.user as ExtendedUser;
    if (user) {
      router.push({
        pathname: "/chat",
        params: {
          receiverId: user.id.toString(),
          receiverName: `${user.nom} ${user.prenom}`,
          receiverAvatar: user.image || "https://via.placeholder.com/150"
        }
      });
    } else {
      Alert.alert("Information", "Aucun gestionnaire associé à ce parking");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Ouvert', color: '#4CAF50', icon: 'checkmark-circle' };
      case 'INACTIVE':
        return { text: 'Fermé', color: '#F44336', icon: 'close-circle' };
      case 'MAINTENANCE':
        return { text: 'En maintenance', color: '#FF9800', icon: 'construct' };
      case 'FULL':
        return { text: 'Complet', color: '#9C27B0', icon: 'alert-circle' };
      default:
        return { text: status, color: '#757575', icon: 'help-circle' };
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7d00" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (error && !parking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ff3b30" />
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubText}>ID: {id}</Text>
        
        <View style={styles.errorButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={fetchParkingDetails}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#ff7d00" />
            <Text style={[styles.buttonText, { color: '#ff7d00' }]}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!parking) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="parking" size={64} color="#666" />
        <Text style={styles.errorTitle}>Parking introuvable</Text>
        <Text style={styles.errorText}>Le parking demandé n'existe pas ou a été supprimé.</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.buttonText}>Retour à la liste</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(parking.status);
  const user = parking.user as ExtendedUser;
  const isUpdated = parking.updatedAt !== parking.createdAt;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff7d00']}
            tintColor="#ff7d00"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec image */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.imageContainer}>
            {parking.logo && !imageError ? (
              <Image
                source={{ uri: parking.logo }}
                style={styles.image}
                resizeMode="cover"
                onError={() => {
                  console.log('Image load error:', parking.logo);
                  setImageError(true);
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialCommunityIcons name="parking" size={70} color="#fff" />
                <Text style={styles.placeholderText}>{parking.name}</Text>
              </View>
            )}
            
            <View style={styles.imageOverlay} />
            
            <View style={styles.titleOverlay}>
              <Text style={styles.parkingName}>{parking.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Ionicons name={statusInfo.icon as any} size={14} color="#fff" />
                <Text style={styles.statusText}>{statusInfo.text}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contenu principal */}
        <View style={styles.content}>
          {/* Actions rapides */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleEmail}
            >
              <MaterialIcons name="email" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleNavigate}
            >
              <FontAwesome name="map-marker" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Y aller</Text>
            </TouchableOpacity>
            
            {user && (
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={handleContactManager}
              >
                <FontAwesome5 name="user" size={18} color="#fff" />
                <Text style={styles.quickActionText}>Contacter</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Informations principales dans une seule carte */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📋 Informations du parking</Text>
            
            <View style={styles.infoCard}>
              {/* Adresse */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={22} color="#ff7d00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>{parking.address}</Text>
                  <Text style={styles.infoSubValue}>{parking.city}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Capacité */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="car" size={20} color="#ff7d00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Capacité</Text>
                  <View style={styles.capacityContainer}>
                    <Text style={styles.capacityValue}>{parking.capacity}</Text>
                    <Text style={styles.capacityLabel}>places disponibles</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Horaires */}
              {parking.hoursOfOperation && (
                <>
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="time-outline" size={22} color="#ff7d00" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Horaires d'ouverture</Text>
                      <Text style={styles.infoValue}>{parking.hoursOfOperation}</Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {/* Email */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="email" size={22} color="#ff7d00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email de contact</Text>
                  <Text style={styles.infoValue}>{parking.email}</Text>
                </View>
              </View>

              {/* Description */}
              {parking.description && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="information-circle-outline" size={24} color="#ff7d00" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Description</Text>
                      <Text style={styles.infoDescription}>{parking.description}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Gestionnaire */}
              {user && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <Ionicons name="person-outline" size={22} color="#ff7d00" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Gestionnaire</Text>
                      <Text style={styles.infoValue}>{user.prenom} {user.nom}</Text>
                      <Text style={styles.infoSubValue}>{user.email}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* Dates de création et mise à jour */}
              <View style={styles.divider} />
              <View style={styles.dateContainer}>
                <View style={styles.dateItem}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.dateText}>
                    Créé le {formatDate(parking.createdAt)}
                  </Text>
                </View>
                
                {isUpdated && (
                  <View style={styles.dateItem}>
                    <Ionicons name="refresh-outline" size={16} color="#666" />
                    <Text style={styles.dateText}>
                      Mis à jour le {formatDate(parking.updatedAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Note pour les parkings fermés */}
          {parking.status !== 'ACTIVE' && (
            <View style={styles.warningCard}>
              <Ionicons name="warning-outline" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                Ce parking est actuellement {statusInfo.text.toLowerCase()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 30,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 25,
  },
  errorButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: "#ff7d00",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ff7d00",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Header
  headerContainer: {
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 280,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#ff7d00",
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  titleOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  parkingName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  // Content
  content: {
    padding: 20,
    paddingTop: 0,
  },
  quickActions: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: -30,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  quickAction: {
    flex: 1,
    backgroundColor: "#ff7d00",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 125, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    lineHeight: 22,
  },
  infoSubValue: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  infoDescription: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
  },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  capacityValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ff7d00",
  },
  capacityLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  dateContainer: {
    marginTop: 4,
    gap: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: "#666",
  },
  // Warning
  warningCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#E65100",
    lineHeight: 20,
  },
});