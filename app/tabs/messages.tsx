
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChat } from '../../hooks/useChat';
import { getParkings, Parking } from '../../components/services/parkingApi';
import { ChatList } from './../../components/chat/ChatList';
import { ChatWindow } from './../../components/chat/ChatWindow';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../app/type/chat';

interface Props { initialParkingId?: number; }

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const Messages: React.FC<Props> = ({ initialParkingId }) => {
  const { authState, isLoading } = useAuth();
  // Déduire un objet user minimal depuis authState
  const user = authState && authState.userId ? {
    id: Number(authState.userId),
    nom: authState.nom,
    prenom: authState.prenom,
    role: authState.role,
  } : null;
  const {
    messages, conversations, loading, sendMessage, loadConversation,
    deleteMessage, updateMessage, setCurrentParkingId,
  } = useChat(initialParkingId);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [parkingName, setParkingName] = useState<string>('');
  const [parkingLogo, setParkingLogo] = useState<string | null>(null);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(false);

  React.useEffect(() => {
    if (initialParkingId) setCurrentParkingId(initialParkingId);
  }, [initialParkingId, setCurrentParkingId]);

  const handleSelectConversation = (userId: number, name: string, logo?: string | null, parkingId?: number) => {
    // Naviguer vers la page de chat (route dédiée) pour garder l'URL/navigabilité
    // router.push({
    //   pathname: '/(Clients)/(profil)/chatpage',
    //   params: {
    //     userId: userId.toString(),
    //     userName: name,
    //     userAvatar: logo || 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    //   },
    // });
    // pour les écrans large on conserve l'état local si besoin
    setSelectedUserId(userId);
    setParkingName(name);
    setParkingLogo(logo || null);
    if (parkingId) {
      setCurrentParkingId(parkingId);
    }
    loadConversation(userId);
  };

  // Charger la liste des parkings pour l'affichage initial
  React.useEffect(() => {
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
  }, []);

  if (isLoading) {
    return <View style={styles.center}><Text>Chargement...</Text></View>;
  }

  if (!user) {
    return <View style={styles.center}><Text>Connectez-vous pour chatter</Text></View>;
  }

  // Mobile layout
  if (!isTablet) {
    if (selectedUserId) {
      return (
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          onDeleteMessage={deleteMessage}
          onUpdateMessage={updateMessage}
          receiverId={selectedUserId}
          parkingName={parkingName}
          loading={loading}
          onBack={() => setSelectedUserId(null)}
            parkingLogo={parkingLogo}
        />
      );
    }

    // Show parkings list first on mobile
    if (loadingParkings) {
      return <View style={styles.center}><Text>Chargement des parkings...</Text></View>;
    }

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Parkings</Text>
        {parkings.map(p => (
          <TouchableOpacity
            key={p.id}
            onPress={() => {
              if (p.user && p.user.id) {
                handleSelectConversation(p.user.id, p.name, p.logo, p.id);
              } else {
                console.warn('Parking sans utilisateur associé', p.id);
              }
            }}
            style={styles.parkingCard}
          >
            <Image
              source={{ uri: p.logo || 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }}
              style={styles.parkingLogo}
            />
            <View style={styles.parkingInfo}>
              <Text style={styles.parkingName}>{p.name}</Text>
              <Text style={styles.parkingMeta}>{p.city} • {p.capacity} places</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <ChatList
          conversations={conversations}
          onSelectConversation={(userId, name, parkingId) => handleSelectConversation(userId, name, undefined, parkingId)}
          currentUserId={user.id}
        />
      </View>
      <View style={styles.main}>
        {selectedUserId ? (
          <ChatWindow
            messages={messages}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            onUpdateMessage={updateMessage}
            receiverId={selectedUserId}
            parkingName={parkingName}
            loading={loading}
              onBack={() => setSelectedUserId(null)}
              parkingLogo={parkingLogo}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sélectionnez une conversation</Text>
            <Text>ou commencez un nouveau chat avec un parking</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Messages;

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 300, borderRightWidth: 1, borderRightColor: '#E5E5EA' },
  main: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  parkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  parkingLogo: { width: 56, height: 56, borderRadius: 8, marginRight: 12, backgroundColor: '#f0f0f0' },
  parkingInfo: { flex: 1 },
  parkingName: { fontSize: 16, fontWeight: '600' },
  parkingMeta: { color: '#666', marginTop: 4 },
});