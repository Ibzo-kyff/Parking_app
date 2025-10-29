import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChat } from '../../hooks/useChat';
import { getParkings, Parking } from '../../components/services/parkingApi';
import { ChatList } from './../../components/chat/ChatList';
import { ChatWindow } from './../../components/chat/ChatWindow';
import { useAuth } from '../../context/AuthContext';

interface Props {
  initialParkingId?: number;
}

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const Messages: React.FC<Props> = ({ initialParkingId }) => {
  const { authState, isLoading: authLoading } = useAuth();

  const user = authState && authState.userId
    ? {
        id: Number(authState.userId),
        nom: authState.nom,
        prenom: authState.prenom,
        role: authState.role,
        parkingId: authState.parkingId ? Number(authState.parkingId) : undefined,
      }
    : null;

  const {
    messages,
    conversations,
    loading,
    sendMessage,
    loadConversation,
    deleteMessage,
    updateMessage,
    setCurrentParkingId,
  } = useChat(initialParkingId);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState<string>('');
  const [receiverAvatar, setReceiverAvatar] = useState<string | null>(null);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(false);

  // Charger les parkings (USER uniquement)
  useEffect(() => {
    if (!user || user.role !== 'USER') return;

    const fetchParkings = async () => {
      setLoadingParkings(true);
      try {
        const data = await getParkings();
        setParkings(data || []);
      } catch (err) {
        console.error('Erreur chargement parkings:', err);
      } finally {
        setLoadingParkings(false);
      }
    };
    fetchParkings();
  }, [user?.role]);

  // Initialiser le parking
  useEffect(() => {
    if (initialParkingId) {
      setCurrentParkingId(initialParkingId);
    }
  }, [initialParkingId, setCurrentParkingId]);

  const handleSelectConversation = (
    userId: number,
    name: string,
    logo?: string | null,
    parkingId?: number
  ) => {
    setSelectedUserId(userId);
    setReceiverName(name);
    setReceiverAvatar(logo || null);
    if (parkingId) setCurrentParkingId(parkingId);
    loadConversation(userId);
  };

  // === CHARGEMENT / AUTH ===
  if (authLoading) {
    return <View style={styles.center}><Text>Chargement...</Text></View>;
  }

  if (!user) {
    return <View style={styles.center}><Text>Connectez-vous pour accéder au chat</Text></View>;
  }

  // === LAYOUT MOBILE ===
  if (!isTablet) {
    return (
      <View style={{ flex: 1 }}>
        {/* HEADER UNIQUEMENT SI PAS DE CHAT OUVERT */}
        {!selectedUserId && (
          <View style={styles.header}>
 */}
            <Text style={styles.headerTitle}>Messages</Text>
          </View>
        )}

        {/* CONTENU */}
        {selectedUserId ? (
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            onUpdateMessage={updateMessage}
            receiverId={selectedUserId}
            receiverName={receiverName}
            receiverAvatar={receiverAvatar}
            loading={loading}
            onBack={() => setSelectedUserId(null)}
          />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* TITRE UNIQUEMENT POUR USER */}
            {user.role === 'USER' && (
              <Text style={styles.sectionTitle}>Parkings</Text>
            )}

            {user.role === 'PARKING' ? (
              // JUSTE LA LISTE DES CLIENTS
              <ChatList
                conversations={conversations}
                onSelectConversation={handleSelectConversation}
                currentUserId={user.id}
                currentUserRole={user.role}
              />
            ) : loadingParkings ? (
              <Text style={styles.loadingText}>Chargement des parkings...</Text>
            ) : parkings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Aucun parking disponible</Text>
              </View>
            ) : (
              parkings.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    if (p.user?.id) {
                      handleSelectConversation(p.user.id, p.name, p.logo, p.id);
                    }
                  }}
                  style={styles.parkingCard}
                >
                  <Image
                    source={{
                      uri: p.logo || 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    }}
                    style={styles.parkingLogo}
                  />
                  <View style={styles.parkingInfo}>
                    <Text style={styles.parkingName}>{p.name}</Text>
                    <Text style={styles.parkingMeta}>{p.city} • {p.capacity} places</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // === LAYOUT TABLETTE / DESKTOP ===
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.headerDesktop}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {user.role === 'PARKING' ? (
          // JUSTE LA LISTE DES CLIENTS
          <ChatList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            currentUserId={user.id}
            currentUserRole={user.role}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <Text style={styles.sidebarTitle}>Parkings</Text>
            {parkings.length === 0 ? (
              <Text style={styles.emptySidebarText}>Aucun parking</Text>
            ) : (
              parkings.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    if (p.user?.id) {
                      handleSelectConversation(p.user.id, p.name, p.logo, p.id);
                    }
                  }}
                  style={[
                    styles.sidebarItem,
                    selectedUserId === p.user?.id && styles.sidebarItemActive,
                  ]}
                >
                  <Image
                    source={{
                      uri: p.logo || 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                    }}
                    style={styles.sidebarLogo}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sidebarItemText}>{p.name}</Text>
                    <Text style={styles.sidebarMeta}>{p.city}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      <View style={styles.main}>
        {selectedUserId ? (
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            onUpdateMessage={updateMessage}
            receiverId={selectedUserId}
            receiverName={receiverName}
            receiverAvatar={receiverAvatar}
            loading={loading}
            onBack={() => setSelectedUserId(null)}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sélectionnez une conversation</Text>
            <Text style={styles.emptySubtitle}>
              {user.role === 'PARKING'
                ? 'Les clients qui vous ont contacté apparaîtront ici'
                : 'Choisissez un parking pour commencer'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Messages;

// === STYLES MODERNES & PROPRES ===
const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 300, borderRightWidth: 1, borderRightColor: '#E5E5EA', backgroundColor: '#fff' },
  main: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
 header: {
    height: 60,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },

  headerDesktop: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  headerTitle: { 
    color: '#0c0c0cff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: -20, },
    headerIcon: { padding: 4 },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2A44',
    paddingHorizontal: 16,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1F2A44',
    paddingHorizontal: 16,
  },

  // Parking Card (mobile)
  parkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  parkingLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#f0f0f0',
  },
  parkingInfo: { flex: 1 },
  parkingName: { fontSize: 16, fontWeight: '600', color: '#1F2A44' },
  parkingMeta: { color: '#666', marginTop: 4, fontSize: 14 },

  // Sidebar Item (tablet)
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  sidebarItemActive: { backgroundColor: '#e3f2fd' },
  sidebarLogo: { width: 40, height: 40, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0' },
  sidebarItemText: { fontSize: 15, fontWeight: '600', color: '#1F2A44' },
  sidebarMeta: { fontSize: 13, color: '#666' },

  // États vides
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1F2A44' },
  emptySubtitle: { color: '#666', fontSize: 14, textAlign: 'center' },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#999', fontSize: 15 },
  emptySidebarText: { textAlign: 'center', color: '#999', marginTop: 20, paddingHorizontal: 16 },

  loadingText: { textAlign: 'center', color: '#666', marginTop: 20 },
});