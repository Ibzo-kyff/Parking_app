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
} from "react-native";

export type Reservation = {
  id: number;
  user: {
    nom: string;
    prenom: string;
    email: string;
  };
  vehicle: {
    marque: string;
    modele: string;
    imageUrl: string;
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

  const handleCancel = async (id: number) => {
    try {
      await cancelReservation(id);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error("Erreur lors de l’annulation", err);
      alert(err.response?.data?.message || "Impossible d’annuler la réservation");
    }
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
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {reservations.map((item) => (
        <View key={item.id} style={styles.card}>
          <Image
            source={{ uri: item.vehicle.imageUrl || "https://via.placeholder.com/150" }}
            style={styles.image}
          />
          <View style={styles.info}>
            <Text style={styles.title}>
              {item.vehicle.marque} {item.vehicle.modele}
            </Text>
            <Text>Client : {item.user.nom} {item.user.prenom}</Text>
            <Text>Début : {new Date(item.dateDebut).toLocaleDateString()}</Text>
            <Text>Fin : {new Date(item.dateFin).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red", fontSize: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: { width: 100, height: 60, borderRadius: 8, marginRight: 10, backgroundColor: "#eee" },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: "bold", color: "#000" },
  button: { backgroundColor: "#FD6A00", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default Reservation;