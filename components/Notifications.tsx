import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../components/services/Notification";

interface Notification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: "reservation" | "paiement" | "update";
  louee?: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [parkingId, setParkingId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // 🔁 Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("🔄 Chargement des informations utilisateur...");
        
        const id = await AsyncStorage.getItem("userId");
        const parking = await AsyncStorage.getItem("parkingId");
        const role = await AsyncStorage.getItem("userRole");
        const token = await AsyncStorage.getItem("userToken");
        
        console.log(`👤 Rôle: ${role}, UserId: ${id}, ParkingId: ${parking}, Token: ${token ? "PRÉSENT" : "MANQUANT"}`);
        
        if (id) setUserId(Number(id));
        if (parking) setParkingId(Number(parking));
        if (role) {
          setUserRole(role);
        } else {
          // 🔍 Déduire le rôle si non trouvé
          if (parking) {
            setUserRole('PARKING');
            console.log("🅿️ Rôle déduit: PARKING (parkingId présent)");
          } else if (id) {
            setUserRole('USER');
            console.log("👤 Rôle déduit: USER (userId présent)");
          }
        }
        
        setAuthChecked(true);
        
      } catch (err) {
        console.log("❌ Erreur récupération user :", err);
        setAuthChecked(true);
      }
    };
    loadUser();
  }, []);

  // 🔁 Récupérer les notifications en fonction du rôle
  const fetchNotifications = async () => {
    try {
      // Ne pas récupérer si pas d'authentification
      if (!authChecked) {
        console.log("⏳ En attente des informations d'authentification...");
        return;
      }

      setLoading(true);
      let data: any[] = [];

      console.log(`📋 Fetch notifications - Rôle: ${userRole}, UserId: ${userId}, ParkingId: ${parkingId}`);
      
      if (userRole === 'PARKING' && parkingId) {
        // Récupérer les notifications du parking
        console.log(`🅿️ Récupération notifications pour parking: ${parkingId}`);
        data = await getNotifications(undefined, parkingId);
      } else if (userRole === 'USER' && userId) {
        // Récupérer les notifications de l'utilisateur
        console.log(`👤 Récupération notifications pour utilisateur: ${userId}`);
        data = await getNotifications(userId, undefined);
      } else {
        console.warn("⚠️ Aucune entité identifiée pour récupérer les notifications");
        console.log(`Détails - Rôle: ${userRole}, UserId: ${userId}, ParkingId: ${parkingId}`);
      }
      
      // S'assurer que data est un tableau
      const notificationsData = Array.isArray(data) ? data : [];
      
      const formatted = notificationsData.map((n: any) => ({
        id: n.id,
        title: n.title || "Sans titre",
        message: n.message || "Aucun message",
        createdAt: n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : "Date inconnue",
        read: Boolean(n.read),
        type: n.type,
        louee: n.louee,
      }));
      
      setNotifications(formatted);
      console.log(`✅ ${formatted.length} notifications chargées pour ${userRole}`);
    } catch (err) {
      console.log("❌ Erreur récupération notifications :", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Récupération auto quand les infos utilisateur changent
  useEffect(() => {
    if (authChecked) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(), 15000); // 15s
      return () => clearInterval(interval);
    }
  }, [authChecked, userRole, userId, parkingId]);

  // ✅ Marquer notification comme lue
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      const result = await markNotificationAsRead(notification.id);
      if (result) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        
        if (selectedNotification && selectedNotification.id === notification.id) {
          setSelectedNotification({ ...selectedNotification, read: true });
        }
      }
    } catch (err) {
      console.log("Erreur marquer comme lu :", err);
    }
  };

  // ✅ Supprimer notification
  const handleDeleteConfirmed = async () => {
    if (!selectedNotification) return;
    try {
      const result = await deleteNotification(selectedNotification.id);
      if (result.success) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== selectedNotification.id)
        );
        setSelectedNotification(null);
        setConfirmVisible(false);
      } else {
        Alert.alert("Erreur", "Impossible de supprimer la notification");
      }
    } catch (err) {
      console.log("Erreur suppression :", err);
      Alert.alert("Erreur", "Impossible de supprimer la notification");
    }
  };

  // 🔹 Filtrage par onglets
  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => !n.read);

  // 🔹 Affichage d'un item
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.nonLu]}
      onPress={() => {
        setSelectedNotification(item);
        handleMarkAsRead(item);
      }}
    >
      <Text style={styles.titre}>{item.title}</Text>
      <Text style={styles.date}>{item.createdAt}</Text>
      <Text numberOfLines={2} style={styles.message}>
        {item.message}
      </Text>
      {!item.read && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>Nouveau</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // 🔄 Rafraîchir manuellement
  const handleRefresh = () => {
    fetchNotifications();
  };

  // Écran de chargement initial
  if (!authChecked || (loading && notifications.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>
            {!authChecked ? "Vérification de l'authentification..." : "Chargement des notifications..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Vérifier si l'utilisateur est connecté
  const isConnected = userId || parkingId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 40, marginBottom: 20 }}>
          <Text style={styles.header}>Notifications</Text>
          {isConnected && (
            <Text style={styles.subHeader}>
              {userRole === 'PARKING' ? `Parking ID: ${parkingId}` : `Utilisateur ID: ${userId}`}
            </Text>
          )}
        </View>

        {!isConnected ? (
          <View style={styles.notConnectedContainer}>
            <Text style={styles.notConnectedText}>
              Veuillez vous connecter pour voir vos notifications
            </Text>
          </View>
        ) : (
          <>
            {/* Onglets */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "all" && styles.activeTab]}
                onPress={() => setActiveTab("all")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "all" && styles.activeTabText,
                  ]}
                >
                  Toutes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "unread" && styles.activeTab]}
                onPress={() => setActiveTab("unread")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "unread" && styles.activeTabText,
                  ]}
                >
                  Non lues
                </Text>
              </TouchableOpacity>
            </View>

            {/* Liste notifications */}
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              refreshing={loading}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Aucune notification
                  </Text>
                  <Text style={styles.emptySubText}>
                    {userRole === 'PARKING' 
                      ? "Les nouvelles réservations apparaîtront ici" 
                      : "Vos notifications apparaîtront ici"}
                  </Text>
                </View>
              }
            />
          </>
        )}
      </View>

      {/* Modal détails */}
      <Modal visible={!!selectedNotification} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedNotification && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedNotification.title}
                </Text>
                <Text style={styles.modalMessage}>
                  {selectedNotification.message}
                </Text>
                <Text
                  style={{ fontSize: 12, color: "gray", marginBottom: 12 }}
                >
                  {selectedNotification.createdAt}
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalCancel]}
                    onPress={() => setSelectedNotification(null)}
                  >
                    <Text style={styles.modalCancelText}>Fermer</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalDelete]}
                    onPress={() => setConfirmVisible(true)}
                  >
                    <Text style={styles.modalDeleteText}>Supprimer</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmer la suppression</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir supprimer cette notification ?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalDelete]}
                onPress={handleDeleteConfirmed}
              >
                <Text style={styles.modalDeleteText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingHorizontal: 12 },
  header: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#333" },
  subHeader: { fontSize: 14, textAlign: "center", color: "#666", marginTop: 5 },
  tabs: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B00",
    marginHorizontal: 5,
  },
  activeTab: { backgroundColor: "#FF6B00" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#FF6B00" },
  activeTabText: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    marginHorizontal: 8,
    position: "relative",
  },
  nonLu: { borderLeftWidth: 5, borderLeftColor: "#FF6B00" },
  titre: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  date: { fontSize: 12, color: "gray", marginBottom: 6 },
  message: { fontSize: 14, color: "#555", marginRight: 60 },
  unreadBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF6B00",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  notConnectedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  modalMessage: { color: "#555", marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, marginLeft: 10 },
  modalCancel: { backgroundColor: "#F1F3F4" },
  modalCancelText: { color: "#111" },
  modalDelete: { backgroundColor: "#D93025" },
  modalDeleteText: { color: "#fff", fontWeight: "700" },
});

export default Notifications;