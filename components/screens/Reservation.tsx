import React, { useEffect, useState, useMemo } from "react";
import * as Notifications from 'expo-notifications';
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
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ToastAndroid,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePusherChannel } from "../../hooks/usePusherChannel";

// ---------------- TYPES BACKEND ------------------
export type ReservationStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELED";
export type ReservationType = "ACHAT" | "LOCATION";

export type Reservation = {
  id: number;
  status: ReservationStatus;
  user?: {
    id: number;
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
      id: number;
      nom: string;
    };
    prix: number;
    fuelType: string;
    mileage: number;
    marqueRef?: { id: number; name: string };
    forSale?: boolean;
    forRent?: boolean;
  };
  dateDebut: string | null;
  dateFin: string | null;
  type: ReservationType;
};

// ------------------ UTILS ------------------------
const translateStatus = (status: ReservationStatus): string => {
  const map: Record<ReservationStatus, string> = {
    PENDING: "En attente",
    ACCEPTED: "Acceptée",
    COMPLETED: "Terminée",
    CANCELED: "Annulée",
  };
  return map[status] || status;
};

const getStatusIcon = (status: ReservationStatus) => {
  switch (status) {
    case "PENDING": return { name: "clock", color: "#FF9800", icon: MaterialCommunityIcons };
    case "ACCEPTED": return { name: "check-circle", color: "#4CAF50", icon: MaterialCommunityIcons };
    case "COMPLETED": return { name: "flag-checkered", color: "#2196F3", icon: MaterialCommunityIcons };
    case "CANCELED": return { name: "close-circle", color: "#F44336", icon: MaterialCommunityIcons };
    default: return { name: "help-circle", color: "#757575", icon: MaterialCommunityIcons };
  }
};

const getTypeIcon = (type: ReservationType) => {
  switch (type) {
    case "ACHAT": return { name: "shopping", color: "#9C27B0", icon: MaterialIcons };
    case "LOCATION": return { name: "car-rental", color: "#FF6200", icon: MaterialIcons };
    default: return { name: "help", color: "#757575", icon: MaterialIcons };
  }
};

const getStatusBgColor = (status: ReservationStatus): string => {
  const colors: Record<ReservationStatus, string> = {
    PENDING: "#FFF3E0",
    ACCEPTED: "#E8F5E9",
    COMPLETED: "#E3F2FD",
    CANCELED: "#FFEBEE",
  };
  return colors[status] || "#F5F5F5";
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateDays = (start: string | null, end: string | null): number => {
  if (!start || !end) return 1;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(price);
};

// Vérifier si la date de fin est dépassée
const isDatePassed = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

// Déterminer l'onglet basé sur le statut ET la date
const mapStatusToTab = (reservation: Reservation): "À venir" | "Terminée" | "Annulée" => {
  if (reservation.status === "CANCELED") return "Annulée";

  // Si la date de fin est dépassée, c'est terminé
  if (reservation.dateFin && isDatePassed(reservation.dateFin)) {
    return "Terminée";
  }

  if (reservation.status === "COMPLETED") return "Terminée";
  if (reservation.status === "PENDING" || reservation.status === "ACCEPTED") return "À venir";

  return "À venir";
};

// ------------------------------------------------------
//          COMPOSANT PRINCIPAL
// ------------------------------------------------------
type ReservationListProps = {
  fetchReservations: () => Promise<Reservation[]>;
  cancelReservation: (id: number) => Promise<void>;
  acceptReservation?: (id: number) => Promise<void>;
  declineReservation?: (id: number) => Promise<void>;
  isParking?: boolean;
};

const ReservationPage: React.FC<ReservationListProps> = ({
  fetchReservations,
  cancelReservation,
  acceptReservation,
  declineReservation,
  isParking = false,
}) => {
  const { authState } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<"À venir" | "Terminée" | "Annulée">("À venir");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);



  // ... (existing imports)

  // ... (inside component)

  // ------------------------ PUSHER EVENTS ----------------
  const handleReservationUpdate = async (data: any) => {
    // 1. Rafraîchir les données
    loadReservations();

    // 2. Notification Locale
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Mise à jour de réservation",
          body: "Le statut de votre réservation a changé.",
          sound: 'default',
        },
        trigger: null, // Immédiat
      });
    } catch (e) {
      console.log('Erreur notification locale', e);
    }
  };

  const pusherEvents = useMemo(() => [
    { eventName: 'reservationAccepted', handler: handleReservationUpdate },
    { eventName: 'reservationDeclined', handler: handleReservationUpdate },
  ], []);

  usePusherChannel(pusherEvents);

  // ------------------------ API CALL ---------------------
  const loadReservations = async () => {
    try {
      setError(null);
      const data = await fetchReservations();
      setReservations(data);
    } catch (err: any) {
      console.error("Erreur chargement réservations:", err);
      setError(err.message || "Impossible de charger les réservations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authState?.accessToken) {
      Alert.alert("Erreur", "Vous devez vous connecter.");
      router.push("/(auth)/LoginScreen");
      return;
    }
    loadReservations();
  }, [authState]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  // ------------------------ ACTIONS ----------------------
  const handleAccept = async (id: number) => {
    if (!acceptReservation) return;
    try {
      await acceptReservation(id);
      await loadReservations();
      Alert.alert("Succès", "Réservation acceptée avec succès");
      setShowActionModal(false);
      setSelectedReservation(null);
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible d'accepter");
    }
  };

  const handleDecline = async (id: number) => {
    if (!declineReservation) return;
    try {
      await declineReservation(id);
      await loadReservations();
      Alert.alert("Succès", "Réservation déclinée");
      setShowActionModal(false);
      setSelectedReservation(null);
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Impossible de décliner");
    }
  };

  const handleCancel = async (id: number) => {
    Alert.alert(
      "Annuler la réservation",
      "Êtes-vous sûr de vouloir annuler cette réservation ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelReservation(id);
              await loadReservations();
              Alert.alert("Succès", "Réservation annulée");
              setShowActionModal(false);
              setSelectedReservation(null);
            } catch (err: any) {
              Alert.alert("Erreur", err.message || "Impossible d'annuler");
            }
          },
        },
      ]
    );
  };

  const handleImageError = (id: number) => {
    setImageErrors((prev) => new Set(prev).add(id));
  };

  // Calculer le prix total
  const calculateTotal = (r: Reservation): number => {
    if (r.type === "ACHAT") return r.vehicle.prix;
    const days = calculateDays(r.dateDebut, r.dateFin);
    return r.vehicle.prix * days;
  };

  // Filtrer les réservations par onglet
  const filtered = reservations.filter((r) => mapStatusToTab(r) === activeTab);

  // ------------------ LOGIQUE BOUTONS ------------------
  const getButtonText = (status: ReservationStatus, isDatePassed: boolean): string => {
    if (isParking) {
      if (status === "PENDING") return "GÉRER LA RÉSERVATION";
      // Seulement si la date n'est pas passée, on peut annuler
      if (status === "ACCEPTED" && !isDatePassed) return "ANNULER LA RÉSERVATION";
      return "VOIR LES DÉTAILS";
    } else {
      // Priorité aux états terminés
      if (status === "COMPLETED" || isDatePassed) return "LOUER À NOUVEAU";

      if (status === "PENDING" || status === "ACCEPTED") return "ANNULER LA RÉSERVATION";

      if (status === "CANCELED") return "RÉSERVER À NOUVEAU";
      return "VOIR LES DÉTAILS";
    }
  };

  // Ouvrir le popup de gestion pour les réservations en attente (parking)
  const openActionModal = (item: Reservation) => {
    setSelectedReservation(item);
    setShowActionModal(true);
  };

  // Gestion des actions des boutons
  const handleButtonAction = (item: Reservation) => {
    const isPast = item.dateFin ? isDatePassed(item.dateFin) : false;

    if (isParking) {
      if (item.status === "PENDING") {
        openActionModal(item);
      } else if (item.status === "ACCEPTED" && !isPast) {
        handleCancel(item.id);
      } else {
        // Pour les autres statuts (y compris ACCEPTED passé), navigation vers les détails
        router.push(`/reservations/${item.id}`);
      }
      return;
    }

    // Client
    // Si c'est Terminé (Completed ou date passée) -> Louer à nouveau (page véhicule)
    if (item.status === "COMPLETED" || isPast) {
      router.push(`/vehicles/${item.vehicle.id}`);
    } else if (item.status === "PENDING" || item.status === "ACCEPTED") {
      handleCancel(item.id);
    } else if (item.status === "CANCELED") {
      router.push(`/vehicles/${item.vehicle.id}`);
    } else {
      router.push(`/vehicles/${item.vehicle.id}`);
    }
  };

  // ------------------------ MODAL ----------------------
  const renderActionModal = () => {
    if (!selectedReservation) return null;

    const isPast = selectedReservation.dateFin ? isDatePassed(selectedReservation.dateFin) : false;
    const vehicleName = selectedReservation.vehicle.marqueRef
      ? `${selectedReservation.vehicle.marqueRef.name} ${selectedReservation.vehicle.model}`
      : `${selectedReservation.vehicle.marque} ${selectedReservation.vehicle.model}`;
    const statusIcon = getStatusIcon(selectedReservation.status);
    const StatusIconComponent = statusIcon.icon;
    const typeIcon = getTypeIcon(selectedReservation.type);
    const TypeIconComponent = typeIcon.icon;

    return (
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowActionModal(false);
          setSelectedReservation(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {
            setShowActionModal(false);
            setSelectedReservation(null);
          }}>
            <View style={styles.modalOverlayTouchable} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            {/* Header avec gradient */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalTitleRow}>
                  <MaterialIcons name="receipt-long" size={24} color="#FFF" />
                  <Text style={styles.modalTitle}>Gérer la réservation</Text>
                </View>
                <Text style={styles.modalSubtitle}>#{selectedReservation.id}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowActionModal(false);
                  setSelectedReservation(null);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Statut et type */}
              <View style={styles.modalStatusContainer}>
                <View style={[styles.modalStatusBadge, { backgroundColor: getStatusBgColor(selectedReservation.status) }]}>
                  <StatusIconComponent name={statusIcon.name} size={16} color={statusIcon.color} />
                  <Text style={[styles.modalStatusText, { color: statusIcon.color }]}>
                    {translateStatus(selectedReservation.status)}
                  </Text>
                </View>
                <View style={[styles.modalTypeBadge, { backgroundColor: `${typeIcon.color}15` }]}>
                  <TypeIconComponent name={typeIcon.name} size={16} color={typeIcon.color} />
                  <Text style={[styles.modalTypeText, { color: typeIcon.color }]}>
                    {selectedReservation.type === "ACHAT" ? "Achat" : "Location"}
                  </Text>
                </View>
              </View>

              {/* Info client */}
              {selectedReservation.user && (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="person" size={20} color="#555" />
                    <Text style={styles.sectionTitle}>Informations client</Text>
                  </View>
                  <View style={styles.modalCard}>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <Ionicons name="person-circle-outline" size={18} color="#666" />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Nom complet</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedReservation.user.prenom} {selectedReservation.user.nom}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <Ionicons name="mail-outline" size={18} color="#666" />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Email</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedReservation.user.email}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Info véhicule */}
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="directions-car" size={20} color="#555" />
                  <Text style={styles.sectionTitle}>Informations véhicule</Text>
                </View>
                <View style={styles.modalCard}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <FontAwesome5 name="car" size={16} color="#666" />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Véhicule</Text>
                      <Text style={styles.modalInfoValue} numberOfLines={2}>
                        {vehicleName}
                      </Text>
                    </View>
                  </View>
                  {selectedReservation.vehicle.parking && (
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <Ionicons name="location-outline" size={18} color="#666" />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Parking</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedReservation.vehicle.parking.nom}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Dates */}
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="date-range" size={20} color="#555" />
                  <Text style={styles.sectionTitle}>Dates de réservation</Text>
                </View>
                <View style={styles.modalCard}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalInfoIcon}>
                      <MaterialIcons name="play-arrow" size={18} color="#4CAF50" />
                    </View>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Date de début</Text>
                      <Text style={styles.modalInfoValue}>
                        {formatDate(selectedReservation.dateDebut)}
                      </Text>
                    </View>
                  </View>
                  {selectedReservation.dateFin && (
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <MaterialIcons name="stop" size={18} color={isPast ? "#F44336" : "#FF9800"} />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Date de fin</Text>
                        <Text style={[styles.modalInfoValue, isPast && styles.pastDateText]}>
                          {formatDate(selectedReservation.dateFin)}
                          {isPast && " (Terminé)"}
                        </Text>
                      </View>
                    </View>
                  )}
                  {selectedReservation.type === "LOCATION" && selectedReservation.dateDebut && selectedReservation.dateFin && (
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoIcon}>
                        <MaterialIcons name="timelapse" size={18} color="#2196F3" />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Durée</Text>
                        <Text style={styles.modalInfoValue}>
                          {calculateDays(selectedReservation.dateDebut, selectedReservation.dateFin)} jours
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Prix */}
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="attach-money" size={20} color="#555" />
                  <Text style={styles.sectionTitle}>Prix et paiement</Text>
                </View>
                <View style={[styles.modalCard, styles.priceCard]}>
                  <View style={styles.priceRow}>
                    <View style={styles.priceInfo}>
                      <MaterialCommunityIcons name="cash-multiple" size={24} color="#FF9800" />
                      <View style={styles.priceDetails}>
                        <Text style={styles.priceLabel}>Prix total</Text>
                        <Text style={styles.priceValue}>
                          {formatPrice(calculateTotal(selectedReservation))}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.priceBreakdown}>
                      <Text style={styles.priceBreakdownText}>
                        {selectedReservation.type === "ACHAT"
                          ? "Prix d'achat"
                          : `${selectedReservation.vehicle.prix.toLocaleString('fr-FR')} FCFA × ${calculateDays(selectedReservation.dateDebut, selectedReservation.dateFin)} jours`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowActionModal(false);
                  handleCancel(selectedReservation.id);
                }}
              >
                <Ionicons name="close-circle-outline" size={22} color="#F44336" />
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDecline]}
                onPress={() => {
                  setShowActionModal(false);
                  handleDecline(selectedReservation.id);
                }}
              >
                <MaterialIcons name="thumb-down" size={22} color="#FFF" />
                <Text style={styles.modalButtonDeclineText}>Refuser</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAccept]}
                onPress={() => {
                  setShowActionModal(false);
                  handleAccept(selectedReservation.id);
                }}
              >
                <MaterialIcons name="check-circle" size={22} color="#FFF" />
                <Text style={styles.modalButtonAcceptText}>Accepter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ------------------------ RENDER ----------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6200" />
        <Text style={styles.loadingText}>Chargement des réservations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="error-outline" size={60} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReservations}>
          <Ionicons name="refresh" size={18} color="#FFF" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {renderActionModal()}

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="receipt-long" size={28} color="#FF6200" />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {isParking ? "Réservations à gérer" : "Mes réservations"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {reservations.length} réservation{reservations.length > 1 ? 's' : ''} au total
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* TABS - Icônes retirées */}
      <View style={styles.tabContainer}>
        {["À venir", "Terminée", "Annulée"].map((tab) => {
          const tabReservations = reservations.filter(r => mapStatusToTab(r) === tab);
          const isActive = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab as any)}
            >
              <View style={styles.tabContent}>
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab}
                </Text>
                {tabReservations.length > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {tabReservations.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LISTE */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6200"]}
            tintColor="#FF6200"
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory-2" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptyText}>
              {activeTab === "À venir"
                ? isParking
                  ? "Aucune réservation en attente pour le moment"
                  : "Vous n'avez pas de réservation à venir"
                : activeTab === "Terminée"
                  ? "Aucune réservation terminée"
                  : "Aucune réservation annulée"}
            </Text>
          </View>
        ) : (
          filtered.map((item) => {
            const total = calculateTotal(item);
            const statusIcon = getStatusIcon(item.status);
            const StatusIconComponent = statusIcon.icon;
            const typeIcon = getTypeIcon(item.type);
            const TypeIconComponent = typeIcon.icon;

            const carName = item.vehicle.marqueRef
              ? `${item.vehicle.marqueRef.name} ${item.vehicle.model}`
              : `${item.vehicle.marque} ${item.vehicle.model}`;

            const isPast = item.dateFin ? isDatePassed(item.dateFin) : false;
            const showCompletedBadge = isPast && item.status !== "CANCELED";

            // Calculer le nombre de jours pour cette réservation
            const reservationDays = calculateDays(item.dateDebut, item.dateFin);

            return (
              <View key={item.id} style={styles.card}>
                {/* Image du véhicule avec overlay */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri:
                        item.vehicle.photos?.length > 0 && !imageErrors.has(item.id)
                          ? item.vehicle.photos[0]
                          : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=200&fit=crop",
                    }}
                    style={styles.carImage}
                    resizeMode="cover"
                    onError={() => handleImageError(item.id)}
                  />
                  <View style={styles.imageOverlay} />

                  {/* Badge de statut */}
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
                      <StatusIconComponent name={statusIcon.name} size={14} color={statusIcon.color} />
                      <Text style={[styles.statusText, { color: statusIcon.color }]}>
                        {translateStatus(item.status)}
                      </Text>
                      {showCompletedBadge && (
                        <View style={styles.completedBadge}>
                          <MaterialIcons name="timelapse" size={10} color="#FFF" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Badge type */}
                  <View style={styles.typeBadgeContainer}>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeIcon.color}20` }]}>
                      <TypeIconComponent name={typeIcon.name} size={12} color={typeIcon.color} />
                      <Text style={[styles.typeText, { color: typeIcon.color }]}>
                        {item.type === "ACHAT" ? "Achat" : "Location"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  {/* Titre et prix */}
                  <View style={styles.titleRow}>
                    <View style={styles.titleContent}>
                      <Text style={styles.carName} numberOfLines={1}>{carName}</Text>
                      {item.vehicle.parking && (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={12} color="#666" />
                          <Text style={styles.locationText}>{item.vehicle.parking.nom}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>{formatPrice(total)}</Text>
                      {item.type === "LOCATION" && (
                        <Text style={styles.priceDetail}>/{reservationDays} jours</Text>
                      )}
                    </View>
                  </View>

                  {/* Détails techniques - MODIFIÉ : Icône voiture remplacée par "Jours" */}
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="speed" size={16} color="#666" />
                      <Text style={styles.detailText}>{item.vehicle.mileage?.toLocaleString('fr-FR') || "0"} km</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="fuel" size={16} color="#666" />
                      <Text style={styles.detailText}>{item.vehicle.fuelType || "—"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="calendar-range" size={14} color="#666" />
                      <Text style={styles.detailText}>{reservationDays} jours</Text>
                    </View>
                  </View>

                  {/* Dates */}
                  <View style={styles.dateContainer}>
                    <View style={styles.dateItem}>
                      <MaterialIcons name="play-arrow" size={14} color="#4CAF50" />
                      <View>
                        <Text style={styles.dateLabel}>Début</Text>
                        <Text style={styles.dateText}>{formatDate(item.dateDebut)}</Text>
                      </View>
                    </View>
                    {item.dateFin && (
                      <View style={styles.dateItem}>
                        <MaterialIcons name="stop" size={14} color={isPast ? "#F44336" : "#FF9800"} />
                        <View>
                          <Text style={styles.dateLabel}>Fin</Text>
                          <Text style={[styles.dateText, isPast && styles.pastDate]}>
                            {formatDate(item.dateFin)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Info client (parking seulement) */}
                  {isParking && item.user && (
                    <View style={styles.clientContainer}>
                      <View style={styles.clientAvatar}>
                        <MaterialIcons name="person" size={16} color="#666" />
                      </View>
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientLabel}>Client</Text>
                        <Text style={styles.clientText}>
                          {item.user.prenom} {item.user.nom}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Séparateur */}
                  <View style={styles.separator} />

                  {/* Bouton d'action */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      item.status === "CANCELED" && styles.actionButtonCanceled,
                      (item.status === "COMPLETED" || isPast) && styles.actionButtonCompleted,
                      item.status === "PENDING" && isParking && styles.actionButtonPending,
                    ]}
                    onPress={() => handleButtonAction(item)}
                  >
                    <Text style={styles.actionButtonText}>
                      {getButtonText(item.status, isPast)}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: "Inter_500Medium",
  },
  retryButton: {
    backgroundColor: "#FF6200",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  activeTab: {
    backgroundColor: "#FF6200",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    fontFamily: "Inter_600SemiBold",
  },
  activeTabText: {
    color: "#FFF",
  },
  tabBadge: {
    position: "absolute",
    top: 6,
    right: 10,
    backgroundColor: "#E0E0E0",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: "#FFF",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    fontFamily: "Inter_700Bold",
  },
  tabBadgeTextActive: {
    color: "#FF6200",
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Inter_600SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  imageContainer: {
    position: "relative",
  },
  carImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#E0E0E0",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  statusContainer: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "Inter_700Bold",
  },
  typeBadgeContainer: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "Inter_700Bold",
  },
  completedBadge: {
    marginLeft: 4,
    backgroundColor: "#2196F3",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContent: {
    flex: 1,
    marginRight: 12,
  },
  carName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Inter_400Regular",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6200",
    fontFamily: "Inter_700Bold",
  },
  priceDetail: {
    fontSize: 11,
    color: "#888",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#F5F5F5",
    borderBottomColor: "#F5F5F5",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: "#888",
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  pastDate: {
    color: "#F44336",
  },
  clientContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  clientText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  actionButton: {
    backgroundColor: "#FF6200",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonCanceled: {
    backgroundColor: "#666",
  },
  actionButtonCompleted: {
    backgroundColor: "#4CAF50",
  },
  actionButtonPending: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: "Inter_700Bold",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlayTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#FF6200",
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    fontFamily: "Inter_700Bold",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalStatusContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginBottom: 16,
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  modalTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  modalTypeText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Inter_600SemiBold",
  },
  modalCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  priceCard: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  modalInfoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  priceRow: {
    flexDirection: "column",
    gap: 8,
  },
  priceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceDetails: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF6200",
    fontFamily: "Inter_700Bold",
  },
  priceBreakdown: {
    paddingLeft: 44,
  },
  priceBreakdownText: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Inter_400Regular",
  },
  pastDateText: {
    color: "#F44336",
    fontStyle: "italic",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 4,
    gap: 8,
  },
  modalButtonCancel: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  modalButtonCancelText: {
    color: "#F44336",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  modalButtonDecline: {
    backgroundColor: "#F44336",
  },
  modalButtonDeclineText: {
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  modalButtonAccept: {
    backgroundColor: "#4CAF50",
  },
  modalButtonAcceptText: {
    color: "#FFF",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});

export default ReservationPage;