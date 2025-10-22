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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../components/services/Notifications";

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

  // 🔁 Récupérer ID utilisateur connecté depuis AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        if (id) setUserId(Number(id));
      } catch (err) {
        console.log("Erreur récupération userId :", err);
      }
    };
    loadUser();
  }, []);

  // 🔁 Récupérer les notifications
  const fetchNotifications = async (id: number) => {
    try {
      const data = await getNotifications(id);
      const formatted = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: new Date(n.createdAt).toLocaleDateString(),
        read: n.read,
        type: n.type,
        louee: n.louee,
      }));
      setNotifications(formatted);
    } catch (err) {
      console.log("Erreur récupération notifications :", err);
    }
  };

  // 🔄 Récupération auto toutes les 5s
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
      const interval = setInterval(() => fetchNotifications(userId), 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // ✅ Marquer notification comme lue
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.log("Erreur marquer comme lu :", err);
    }
  };

  // ✅ Supprimer notification
  const handleDeleteConfirmed = async () => {
    if (!selectedNotification) return;
    try {
      await deleteNotification(selectedNotification.id);
      setNotifications((prev) =>
        prev.filter((n) => n.id !== selectedNotification.id)
      );
      setSelectedNotification(null);
      setConfirmVisible(false);
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

  // 🔹 Affichage d’un item
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
      <Text numberOfLines={1} style={styles.message}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 40, marginBottom: 20 }}>
          <Text style={styles.header}>Notifications</Text>
        </View>

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
          ListEmptyComponent={
            <Text
              style={{ textAlign: "center", marginTop: 20, color: "#555" }}
            >
              Aucune notification
            </Text>
          }
        />
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
  },
  nonLu: { borderLeftWidth: 5, borderLeftColor: "#FF6B00" },
  titre: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  date: { fontSize: 12, color: "gray", marginBottom: 6 },
  message: { fontSize: 14, color: "#555" },
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