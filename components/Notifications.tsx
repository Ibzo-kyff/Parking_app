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
  RefreshControl,
} from "react-native";
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
  type?: string;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      const formatted = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: new Date(n.createdAt).toLocaleDateString(),
        read: n.read,
        type: n.type,
      }));
      setNotifications(formatted);
    } catch (err) {
      console.log("Erreur récupération notifications :", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

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
      Alert.alert("Erreur", "Impossible de supprimer la notification");
    }
  };

  const filteredNotifications =
    activeTab === "all" ? notifications : notifications.filter((n) => !n.read);

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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <Text style={styles.header}>Mes Notifications</Text>

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

        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
              Aucune notification
            </Text>
          }
        />
      </View>

      {/* MODAL DÉTAILS */}
      <Modal visible={!!selectedNotification} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedNotification && (
              <>
                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                <Text style={styles.modalDate}>{selectedNotification.createdAt}</Text>
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

      {/* MODAL CONFIRMATION */}
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
  header: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 20 },
  tabs: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "#FF6B00", marginHorizontal: 5 },
  activeTab: { backgroundColor: "#FF6B00" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#FF6B00" },
  activeTabText: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, elevation: 2 },
  nonLu: { borderLeftWidth: 5, borderLeftColor: "#FF6B00" },
  titre: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  date: { fontSize: 12, color: "gray", marginBottom: 6 },
  message: { fontSize: 14, color: "#555" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "#fff", padding: 16, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  modalMessage: { color: "#555", marginBottom: 10 },
  modalDate: { fontSize: 12, color: "gray", marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, marginLeft: 10 },
  modalCancel: { backgroundColor: "#F1F3F4" },
  modalCancelText: { color: "#111" },
  modalDelete: { backgroundColor: "#D93025" },
  modalDeleteText: { color: "#fff", fontWeight: "700" },
});

export default NotificationsScreen;
