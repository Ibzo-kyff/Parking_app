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

export type Reservation = {
  id: number;
  user?: {
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    marque: string;
    modele: string;
    imageUrl: string;
    parking?: {
      nom: string;
    };
  };
  dateDebut: string;
  dateFin: string;
};

type ReservationListProps = {
  fetchReservations: () => Promise<Reservation[]>;
  cancelReservation: (id: number) => Promise<void>;
};

const Reservation: React.FC<ReservationListProps> = ({
  fetchReservations,
  cancelReservation,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

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
            } catch (err: any) {
              console.error("Erreur lors de l'annulation", err);
              Alert.alert("Erreur", err.response?.data?.message || "Impossible d'annuler la réservation");
            }
          }
        }
      ]
    );
  };

  const handleImageError = (reservationId: number) => {
    setImageErrors(prev => new Set(prev).add(reservationId));
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FD6A00" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReservations}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={["#FD6A00"]}
        />
      }
    >
      {reservations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune réservation trouvée</Text>
          <Text style={styles.emptySubText}>Vos réservations apparaîtront ici</Text>
        </View>
      ) : (
        reservations.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.imageContainer}>
              <Image
                source={{ 
                  uri: item.vehicle.imageUrl && !imageErrors.has(item.id) 
                    ? item.vehicle.imageUrl
                    : "https://via.placeholder.com/150" 
                }}
                style={styles.image}
                onError={() => handleImageError(item.id)}
              />
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.title}>
                {item.vehicle.marque} {item.vehicle.modele}
              </Text>
              
              {item.vehicle.parking && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Parking:</Text>
                  <Text style={styles.infoText}>{item.vehicle.parking.nom}</Text>
                </View>
              )}
              
              {item.user ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Client:</Text>
                    <Text style={styles.infoText}>{item.user.prenom} {item.user.nom}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoText}>{item.user.email}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.infoText}>Informations client non disponibles</Text>
              )}
              
              <View style={styles.dateContainer}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Début:</Text>
                  <Text style={styles.dateText}>
                    {new Date(item.dateDebut).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Fin:</Text>
                  <Text style={styles.dateText}>
                    {new Date(item.dateFin).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    // backgroundColor: "#f8f9fa",
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    // backgroundColor: "#f8f9fa",
  },
  error: { 
    color: "#dc3545", 
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#FD6A00",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6c757d",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#adb5bd",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#e9ecef",
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#495057",
  },
  dateContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  dateText: {
    fontSize: 14,
    color: "#495057",
  },
  cancelButton: {
    backgroundColor: "#ffebe9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButtonText: {
    color: "#cf222e",
    fontWeight: "600",
    fontSize: 12,
  },
});

export default Reservation;