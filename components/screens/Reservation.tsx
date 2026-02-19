import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  TextInput,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router, useFocusEffect } from "expo-router";
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

// Composant helper pour les icônes dynamiques
type AnyIcon = typeof Ionicons | typeof MaterialIcons | typeof FontAwesome5 | typeof MaterialCommunityIcons;
type IconDesc = { name: string; color: string; icon: AnyIcon };

interface DynamicIconProps {
  iconDesc: IconDesc;
  size?: number;
  style?: any;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ iconDesc, size = 14, style }) => {
  const { icon: IconComponent, name, color } = iconDesc;
  return <IconComponent name={name as any} size={size} color={color} style={style} />;
};

const getStatusIcon = (status: ReservationStatus): IconDesc => {
  switch (status) {
    case "PENDING": return { name: "clock-outline", color: "#FF9800", icon: MaterialCommunityIcons };
    case "ACCEPTED": return { name: "check-circle-outline", color: "#4CAF50", icon: MaterialCommunityIcons };
    case "COMPLETED": return { name: "flag-checkered", color: "#2196F3", icon: MaterialCommunityIcons };
    case "CANCELED": return { name: "close-circle-outline", color: "#F44336", icon: MaterialCommunityIcons };
    default: return { name: "help-circle-outline", color: "#757575", icon: MaterialCommunityIcons };
  }
};

const getTypeIcon = (type: ReservationType): IconDesc => {
  switch (type) {
    case "ACHAT": return { name: "shopping-cart", color: "#9C27B0", icon: MaterialIcons };
    case "LOCATION": return { name: "calendar-clock", color: "#FF6200", icon: MaterialCommunityIcons };
    default: return { name: "help-outline", color: "#757575", icon: MaterialIcons };
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

// Déterminer l'onglet basé sur le statut ET la date (logique backend)
const mapStatusToTab = (reservation: Reservation): "À venir" | "Terminée" | "Annulée" => {
  // Priorité 1: Annulée
  if (reservation.status === "CANCELED") return "Annulée";

  // Priorité 2: Terminée (date de fin dépassée OU statut COMPLETED)
  if (reservation.dateFin && isDatePassed(reservation.dateFin)) {
    return "Terminée";
  }
  if (reservation.status === "COMPLETED") return "Terminée";

  // Priorité 3: À venir (PENDING ou ACCEPTED avec date de fin non dépassée)
  return "À venir";
};

// ------------------------------------------------------
//          COMPOSANT PRINCIPAL
// ------------------------------------------------------
type ReservationListProps = {
  fetchReservations: () => Promise<Reservation[]>;
  cancelReservation: (id: number, reason?: string) => Promise<void>;
  acceptReservation?: (id: number) => Promise<void>;
  declineReservation?: (id: number, reason?: string) => Promise<void>;
  isParking?: boolean;
};

const ReservationPage: React.FC<ReservationListProps> = ({
  fetchReservations,
  cancelReservation,
  acceptReservation,
  declineReservation,
  isParking = false,
}) => {
  const { authState, refreshAuth } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<"À venir" | "Terminée" | "Annulée">("À venir");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Fonction pour afficher une modal de succès
  const showSuccess = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType("success");
    setShowSuccessModal(true);
  };

  // Fonction pour afficher une modal d'erreur
  const showError = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType("error");
    setShowErrorModal(true);
  };

  // Fonction pour afficher une modal d'information
  const showInfo = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType("info");
    setShowErrorModal(true);
  };

  // ✅ Gestion des mises à jour en temps réel via Pusher
  const handleReservationUpdate = useCallback(async (data: any) => {
    console.log("Mise à jour réservation reçue:", data);
    
    // Mise à jour immédiate de l'état local
    if (data.reservation) {
      setReservations(prevReservations => {
        // Vérifier si la réservation existe déjà
        const exists = prevReservations.some(r => r.id === data.reservation.id);
        
        if (exists) {
          // Mise à jour
          return prevReservations.map(r => 
            r.id === data.reservation.id ? { ...r, ...data.reservation } : r
          );
        } else {
          // Nouvelle réservation
          return [data.reservation, ...prevReservations];
        }
      });
    } else {
      // Rechargement complet si pas de données spécifiques
      loadReservations();
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Mise à jour de réservation",
          body: "Le statut de votre réservation a changé.",
          sound: 'default',
        },
        trigger: null,
      });
    } catch (e) {
      console.log('Erreur notification locale', e);
    }
  }, []);

  // ✅ Événements Pusher
  const pusherEvents = useMemo(() => [
    { eventName: 'reservationCreated', handler: handleReservationUpdate },
    { eventName: 'reservationAccepted', handler: handleReservationUpdate },
    { eventName: 'reservationDeclined', handler: handleReservationUpdate },
    { eventName: 'reservationCanceled', handler: handleReservationUpdate },
    { eventName: 'reservationCompleted', handler: handleReservationUpdate },
  ], [handleReservationUpdate]);

  usePusherChannel(pusherEvents);

  // ✅ Rechargement quand l'écran reçoit le focus
  useFocusEffect(
    useCallback(() => {
      console.log("Écran réservations focus - rechargement");
      loadReservations();
    }, [])
  );

  const loadReservations = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchReservations();
      setReservations(data);
    } catch (err: any) {
      console.error("Erreur chargement réservations:", err);

      if (err.response && err.response.status === 403) {
        const refreshed = await refreshAuth();
        if (refreshed) {
          try {
            const data = await fetchReservations();
            setReservations(data);
            return;
          } catch (retryErr: any) {
            setError(retryErr.message || "Impossible de charger après refresh");
          }
        } else {
          setError("Session expirée, veuillez vous reconnecter");
          showError("Session expirée", "Votre session a expiré. Veuillez vous reconnecter.");
        }
      } else {
        setError(err.message || "Impossible de charger les réservations");
        showError("Erreur", "Impossible de charger les réservations");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchReservations, refreshAuth]);

  // Auto-refresh lors du chargement initial
  useEffect(() => {
    if (!authState?.accessToken) {
      showError("Erreur", "Vous devez vous connecter.");
      router.push("/(auth)/LoginScreen");
      return;
    }
    loadReservations();
  }, [authState, loadReservations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  const handleAccept = async (id: number) => {
    if (!acceptReservation) return;
    setIsProcessing(true);
    try {
      await acceptReservation(id);
      // MISE À JOUR OPTIMISTE
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === id 
            ? { ...res, status: "ACCEPTED" as ReservationStatus } 
            : res
        )
      );
      showSuccess("Succès", "Réservation acceptée avec succès");
      setShowActionModal(false);
      setSelectedReservation(null);
    } catch (err: any) {
      showError("Erreur", err.message || "Impossible d'accepter");
      loadReservations();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (id: number, reason?: string) => {
    if (!declineReservation) return;
    setIsProcessing(true);
    try {
      await declineReservation(id, reason);
      // MISE À JOUR OPTIMISTE
      setReservations(prevReservations => 
        prevReservations.map(res => 
          res.id === id 
            ? { ...res, status: "CANCELED" as ReservationStatus } 
            : res
        )
      );
      showSuccess("Succès", "Réservation déclinée");
      setShowActionModal(false);
      setSelectedReservation(null);
    } catch (err: any) {
      showError("Erreur", err.message || "Impossible de décliner");
      loadReservations();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (id: number, reason?: string) => {
    setIsProcessing(true);
    try {
      await cancelReservation(id, reason);
      
      // MISE À JOUR OPTIMISTE
      setReservations(prevReservations => {
        const updatedReservations = prevReservations.map(res => 
          res.id === id 
            ? { ...res, status: "CANCELED" as ReservationStatus } 
            : res
        );
        return updatedReservations;
      });

      if (Platform.OS === 'android') {
        ToastAndroid.show("Réservation annulée avec succès", ToastAndroid.SHORT);
      }

      showSuccess("Succès", "Réservation annulée avec succès");
      setShowCancelModal(false);
      setSelectedReservation(null);
      setCancelReason("");
      
      // Rechargement en arrière-plan pour synchronisation
      setTimeout(() => {
        loadReservations();
      }, 500);
      
    } catch (err: any) {
      console.error("Erreur lors de l'annulation:", err);

      let errorMessage = "Impossible d'annuler la réservation";

      if (err.response) {
        const serverMessage = err.response.data?.message;

        if (err.response.status === 403) {
          errorMessage = serverMessage || "Vous n'avez pas la permission d'annuler cette réservation";
        } else if (err.response.status === 400) {
          errorMessage = serverMessage || "Annulation impossible";

          // Messages spécifiques du backend
          if (errorMessage.includes("12h") || errorMessage.includes("délai")) {
            errorMessage = "Annulation impossible : vous devez annuler au moins 12h avant le début de la location";
          } else if (errorMessage.includes("déjà annulée")) {
            errorMessage = "Cette réservation est déjà annulée";
          }
        } else if (err.response.status === 404) {
          errorMessage = "Réservation introuvable";
        } else {
          errorMessage = serverMessage || errorMessage;
        }
      }

      showError("Erreur d'annulation", errorMessage);
      loadReservations();
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ CORRECTION : Règle des 12h AVANT le début de la location (strictement comme backend)
  const confirmCancel = (item: Reservation) => {
    // CLIENT UNIQUEMENT - Vérifier la règle des 12h AVANT LE DÉBUT de la location
    if (!isParking && item.type === "LOCATION" && item.dateDebut) {
      const startDate = new Date(item.dateDebut);
      const now = new Date();
      
      // Délai de 12h AVANT le début (EXACTEMENT comme backend)
      const minCancelTime = new Date(startDate);
      minCancelTime.setHours(minCancelTime.getHours() - 12);

      // ⚠️ MÊME LOGIQUE QUE BACKEND : now > minCancelTime
      if (now > minCancelTime) {
        if (now < startDate) {
          // Cas 1: Dans les 12h avant le début (annulation impossible)
          const timeUntilStart = startDate.getTime() - now.getTime();
          const hoursUntilStart = Math.floor(timeUntilStart / (1000 * 60 * 60));
          const minutesUntilStart = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
          
          // Calculer depuis quand l'annulation est bloquée
          const timeSinceLimit = now.getTime() - minCancelTime.getTime();
          const hoursSinceLimit = Math.floor(timeSinceLimit / (1000 * 60 * 60));
          const minutesSinceLimit = Math.floor((timeSinceLimit % (1000 * 60 * 60)) / (1000 * 60));
          
          showError(
            "Annulation impossible",
            `❌ Période d'annulation dépassée depuis ${hoursSinceLimit}h ${minutesSinceLimit}min\n\n` +
            `⏰ La location commence dans ${hoursUntilStart}h ${minutesUntilStart}min\n` +
            `📅 Début : ${formatDate(item.dateDebut)}\n` +
            `⛔ Dernière annulation : ${formatDate(minCancelTime.toISOString())}`
          );
        } else {
          // Cas 2: La location a déjà commencé
          const timeSinceStart = now.getTime() - startDate.getTime();
          const hoursSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60));
          
          showError(
            "Annulation impossible",
            `❌ Location déjà commencée depuis ${hoursSinceStart}h\n\n` +
            `📅 Début : ${formatDate(item.dateDebut)}\n` +
            `📍 Contactez le parking pour toute assistance.`
          );
        }
        return;
      }
      
      // Cas où l'annulation est possible (now <= minCancelTime)
      // Calcul du temps restant pour informer l'utilisateur
      const timeUntilLimit = minCancelTime.getTime() - now.getTime();
      const hoursRemaining = Math.floor(timeUntilLimit / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeUntilLimit % (1000 * 60 * 60)) / (1000 * 60));
      
      // Message personnalisé selon le temps restant
      let warningMessage = "";
      if (hoursRemaining < 1) {
        warningMessage = `⚠️ URGENT : Il ne reste que ${minutesRemaining}min pour annuler !\n\n`;
      } else if (hoursRemaining < 3) {
        warningMessage = `⚠️ Attention : Il ne reste que ${hoursRemaining}h ${minutesRemaining}min pour annuler.\n\n`;
      }
      
      setCancelReason("");
      setSelectedReservation(item);
      setModalTitle("Confirmer l'annulation");
      setModalMessage(
        `${warningMessage}Êtes-vous sûr de vouloir annuler votre location ?\n\n` +
        `✅ Délai restant pour annuler : ${hoursRemaining}h ${minutesRemaining}min\n` +
        `📅 Début de location : ${formatDate(item.dateDebut)}\n` +
        `⏰ Dernière annulation possible : ${formatDate(minCancelTime.toISOString())}\n\n` +
        `Cette action est irréversible.`
      );
      setModalType("info");
      setShowCancelModal(true);
      return;
    }

    // Pour les achats
    if (!isParking && item.type === "ACHAT") {
      setCancelReason("");
      setSelectedReservation(item);
      setModalTitle("Confirmer l'annulation");
      setModalMessage(
        `Êtes-vous sûr de vouloir annuler votre demande d'achat ?\n\n` +
        `Cette action est irréversible.`
      );
      setModalType("info");
      setShowCancelModal(true);
      return;
    }

    // Pour le parking
    setCancelReason("");
    setSelectedReservation(item);
    setModalTitle("Confirmer l'annulation");
    setModalMessage(
      "Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."
    );
    setModalType("info");
    setShowCancelModal(true);
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
  const filtered = useMemo(() => {
    return reservations
      .filter((r) => mapStatusToTab(r) === activeTab)
      .sort((a, b) => b.id - a.id);
  }, [reservations, activeTab]);

  const getTypeBadgeStyle = (status: ReservationStatus) => {
    switch (status) {
      case "PENDING": return { bg: "#FFF3E0", color: "#FF9800" };
      case "ACCEPTED": return { bg: "#E8F5E9", color: "#4CAF50" };
      case "COMPLETED": return { bg: "#E3F2FD", color: "#2196F3" };
      case "CANCELED": return { bg: "#FFEBEE", color: "#F44336" };
      default: return { bg: "#F5F5F5", color: "#757575" };
    }
  };

  // ============= LOGIQUE METIER POUR LES BOUTONS =============
  const getButtonText = (item: Reservation): string => {
    const isPast = item.dateFin ? isDatePassed(item.dateFin) : false;
    
    // ----- PARKING -----
    if (isParking) {
      if (item.status === "PENDING") return "GÉRER LA RÉSERVATION";
      if (item.status === "ACCEPTED" && !isPast) return "ANNULER LA RÉSERVATION";
      return "VOIR LES DÉTAILS";
    } 
    
    // ----- CLIENT -----
    else {
      // RÉSERVATIONS ANNULÉES → Réserver à nouveau
      if (item.status === "CANCELED") return "RÉSERVER À NOUVEAU";
      
      // RÉSERVATIONS TERMINÉES (date passée OU statut COMPLETED) → Louer/Acheter à nouveau
      if (item.status === "COMPLETED" || isPast) return "LOUER À NOUVEAU";
      
      // RÉSERVATIONS ACTIVES (PENDING ou ACCEPTED avec date non dépassée) → UNIQUEMENT ANNULER
      return "ANNULER LA RÉSERVATION";
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

    // ----- PARKING -----
    if (isParking) {
      if (item.status === "PENDING") {
        openActionModal(item);
      } else if (item.status === "ACCEPTED" && !isPast) {
        confirmCancel(item);
      } else {
        router.push(`/reservations/${item.id}`);
      }
      return;
    }

    // ----- CLIENT -----
    // CAS 1 : Réservation active (PENDING ou ACCEPTED avec date non dépassée) → ANNULATION
    if ((item.status === "PENDING" || item.status === "ACCEPTED") && !isPast) {
      confirmCancel(item);
    }
    // CAS 2 : Réservation terminée (COMPLETED ou date passée) → Relouer/Réacheter
    else if (item.status === "COMPLETED" || isPast) {
      router.push({
        pathname: '/(Clients)/CreateListingScreen',
        params: { vehicule: JSON.stringify(item.vehicle) }
      });
    }
    // CAS 3 : Réservation annulée → Réserver à nouveau
    else if (item.status === "CANCELED") {
      router.push({
        pathname: '/(Clients)/CreateListingScreen',
        params: {
          vehicule: JSON.stringify(item.vehicle),
          prefillReservation: 'true',
          reservationType: item.type,
          dateDebut: item.dateDebut || '',
          dateFin: item.dateFin || ''
        }
      });
    }
    // CAS 4 : Autres cas
    else {
      router.push({
        pathname: '/(Clients)/CreateListingScreen',
        params: { vehicule: JSON.stringify(item.vehicle) }
      });
    }
  };

  // Vérifier si le bouton doit être rouge (annulation)
  const isCancelAction = (item: Reservation): boolean => {
    if (isParking) {
      return (item.status === "ACCEPTED" && !isDatePassed(item.dateFin));
    } else {
      // Client : bouton rouge pour PENDING et ACCEPTED non passés
      return (item.status === "PENDING" || item.status === "ACCEPTED") && !isDatePassed(item.dateFin);
    }
  };

  // Fonction pour rendre une modal générique
  const renderGenericModal = (
    visible: boolean,
    title: string,
    message: string,
    type: "success" | "error" | "info",
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    showInput: boolean = false,
    inputValue: string = "",
    onInputChange?: (text: string) => void,
    inputPlaceholder: string = "Entrez un motif..."
  ) => {
    const getIcon = () => {
      switch (type) {
        case "success": return { icon: "check-circle", color: "#4CAF50", component: MaterialIcons };
        case "error": return { icon: "error-outline", color: "#F44336", component: MaterialIcons };
        case "info": return { icon: "info", color: "#2196F3", component: MaterialIcons };
        default: return { icon: "info", color: "#2196F3", component: MaterialIcons };
      }
    };

    const iconConfig = getIcon();
    const IconComponent = iconConfig.component;

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={onCancel}>
            <View style={styles.modalOverlayTouchable} />
          </TouchableWithoutFeedback>

          <View style={styles.genericModalContent}>
            {/* Icon */}
            <View style={[styles.modalIconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
              <IconComponent name={iconConfig.icon as any} size={40} color={iconConfig.color} />
            </View>

            {/* Title */}
            <Text style={styles.genericModalTitle}>{title}</Text>

            {/* Message */}
            <Text style={styles.genericModalMessage}>{message}</Text>

            {/* Input optionnel */}
            {showInput && (
              <View style={styles.cancelInputContainer}>
                <Text style={styles.cancelInputLabel}>Motif (Optionnel)</Text>
                <TextInput
                  style={styles.cancelInput}
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  onChangeText={onInputChange}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.genericModalActions}>
              {onCancel && (
                <TouchableOpacity
                  style={[styles.genericModalButton, styles.genericModalButtonCancel]}
                  onPress={onCancel}
                  disabled={isProcessing}
                >
                  <Text style={styles.genericModalButtonCancelText}>
                    {cancelText || "Annuler"}
                  </Text>
                </TouchableOpacity>
              )}

              {onConfirm && (
                <TouchableOpacity
                  style={[
                    styles.genericModalButton,
                    type === "success" && styles.genericModalButtonSuccess,
                    type === "error" && styles.genericModalButtonError,
                    type === "info" && styles.genericModalButtonInfo,
                  ]}
                  onPress={onConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.genericModalButtonConfirmText}>
                      {confirmText || "Confirmer"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {!onConfirm && !onCancel && (
                <TouchableOpacity
                  style={[styles.genericModalButton, styles.genericModalButtonClose]}
                  onPress={onCancel || (() => { })}
                >
                  <Text style={styles.genericModalButtonCloseText}>Fermer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderActionModal = () => {
    if (!selectedReservation) return null;

    const isPast = selectedReservation.dateFin ? isDatePassed(selectedReservation.dateFin) : false;
    const vehicleName = selectedReservation.vehicle.marqueRef
      ? `${selectedReservation.vehicle.marqueRef.name} ${selectedReservation.vehicle.model}`
      : `${selectedReservation.vehicle.marque} ${selectedReservation.vehicle.model}`;
    const statusIcon = getStatusIcon(selectedReservation.status);
    const typeIcon = getTypeIcon(selectedReservation.type);

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
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalTitleRow}>
                  <MaterialIcons name="receipt-long" size={24} color="#FFF" />
                  <Text style={styles.modalTitle}>
                    {isParking ? "Gérer la réservation" : "Détails de la réservation"}
                  </Text>
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
                  <DynamicIcon iconDesc={statusIcon} size={16} />
                  <Text style={[styles.modalStatusText, { color: statusIcon.color }]}>
                    {translateStatus(selectedReservation.status)}
                  </Text>
                </View>
                <View style={[
                  styles.modalTypeBadge,
                  { backgroundColor: getTypeBadgeStyle(selectedReservation.status).bg }
                ]}>
                  <DynamicIcon iconDesc={typeIcon} size={16} />
                  <Text style={[styles.modalTypeText, { color: getTypeBadgeStyle(selectedReservation.status).color }]}>
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

            {/* Actions - UNIQUEMENT POUR PARKING */}
            {isParking && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowActionModal(false);
                    setSelectedReservation(selectedReservation);
                    setShowCancelModal(true);
                  }}
                >
                  <Ionicons name="close-circle-outline" size={22} color="#F44336" />
                  <Text style={styles.modalButtonCancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDecline]}
                  onPress={() => {
                    setShowActionModal(false);
                    handleDecline(selectedReservation.id, "Refusée par le parking");
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
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Modals génériques
  const renderSuccessModal = renderGenericModal(
    showSuccessModal,
    modalTitle,
    modalMessage,
    "success",
    () => setShowSuccessModal(false),
    () => setShowSuccessModal(false),
    "OK"
  );

  const renderErrorModal = renderGenericModal(
    showErrorModal,
    modalTitle,
    modalMessage,
    modalType,
    () => setShowErrorModal(false),
    () => setShowErrorModal(false),
    "OK"
  );

  const renderCancelModal = renderGenericModal(
    showCancelModal,
    modalTitle,
    modalMessage,
    "info",
    () => {
      if (selectedReservation) {
        const defaultReason = isParking 
          ? "Annulée par le parking" 
          : selectedReservation?.type === "LOCATION"
            ? "Annulation de location par le client"
            : "Annulation d'achat par le client";
        
        const finalReason = cancelReason.trim() || defaultReason;
        handleCancel(selectedReservation.id, finalReason);
      }
    },
    () => {
      setShowCancelModal(false);
      setSelectedReservation(null);
      setCancelReason("");
    },
    "Oui, annuler",
    "Non",
    true,
    cancelReason,
    (text) => setCancelReason(text),
    isParking 
      ? "Précisez la raison de l'annulation..." 
      : "Pourquoi annulez-vous ? (optionnel)"
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6200" />
        <Text style={styles.loadingText}>Chargement des réservations...</Text>
      </View>
    );
  }

  if (error && reservations.length === 0) {
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
      {renderSuccessModal}
      {renderErrorModal}
      {renderCancelModal}

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

      {/* TABS */}
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
            const typeIcon = getTypeIcon(item.type);

            const carName = item.vehicle.marqueRef
              ? `${item.vehicle.marqueRef.name} ${item.vehicle.model}`
              : `${item.vehicle.marque} ${item.vehicle.model}`;

            const isPast = item.dateFin ? isDatePassed(item.dateFin) : false;
            const showCompletedBadge = isPast && item.status !== "CANCELED";

            const reservationDays = calculateDays(item.dateDebut, item.dateFin);
            const isCancel = isCancelAction(item);

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
                      <DynamicIcon iconDesc={statusIcon} size={14} />
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
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeBadgeStyle(item.status).bg }
                    ]}>
                      <DynamicIcon iconDesc={typeIcon} size={12} />
                      <Text style={[styles.typeText, { color: getTypeBadgeStyle(item.status).color }]}>
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

                  {/* Détails techniques */}
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
                      isCancel && styles.actionButtonCancel,
                    ]}
                    onPress={() => handleButtonAction(item)}
                    disabled={isProcessing}
                  >
                    <Text style={styles.actionButtonText}>
                      {getButtonText(item)}
                    </Text>
                    <MaterialIcons 
                      name={isCancel ? "close" : "arrow-forward"} 
                      size={18} 
                      color="#FFF" 
                    />
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

// Styles
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
  actionButtonCancel: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: "Inter_700Bold",
  },
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
  genericModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "85%",
    maxWidth: 400,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  cancelInputContainer: {
    width: "100%",
    marginTop: 16,
  },
  cancelInputLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    fontFamily: "Inter_500Medium",
  },
  cancelInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#333",
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  genericModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "Inter_700Bold",
  },
  genericModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: "Inter_400Regular",
  },
  genericModalActions: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 12,
  },
  genericModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 48,
  },
  genericModalButtonCancel: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  genericModalButtonCancelText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  genericModalButtonSuccess: {
    backgroundColor: "#4CAF50",
  },
  genericModalButtonError: {
    backgroundColor: "#F44336",
  },
  genericModalButtonInfo: {
    backgroundColor: "#2196F3",
  },
  genericModalButtonClose: {
    backgroundColor: "#FF6200",
  },
  genericModalButtonConfirmText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  genericModalButtonCloseText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});

export default ReservationPage;