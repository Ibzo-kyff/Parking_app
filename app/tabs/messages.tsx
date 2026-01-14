import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { authState, isLoading: authLoading } = useAuth();
  // Déduire un objet user minimal depuis authState
  const user = authState && authState.userId ? {
    id: Number(authState.userId),
    nom: authState.nom,
    prenom: authState.prenom,
    role: authState.role,
  } : null;

  const {
    messages, conversations, loading, sendMessage, loadConversation,
    deleteMessage, updateMessage, setCurrentParkingId, resetActivePartner,
    pusherStatus,
  } = useChat(initialParkingId);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [parkingName, setParkingName] = useState<string>('');
  const [parkingLogo, setParkingLogo] = useState<string | null>(null);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(false);

  useEffect(() => {
    if (initialParkingId) setCurrentParkingId(initialParkingId);
  }, [initialParkingId, setCurrentParkingId]);

  const handleSelectConversation = (userId: number, name: string, logo?: string | null, parkingId?: number) => {
    setSelectedUserId(userId);
    setParkingName(name);
    setParkingLogo(logo || null);
    if (parkingId) {
      setCurrentParkingId(parkingId);
    }
    loadConversation(userId);
  };

  // Charger la liste des parkings pour l'affichage initial
  useEffect(() => {
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

  if (authLoading) {
    return (
      <View style={styles.center}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="chatbubbles" size={48} color="#fff" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <LinearGradient
          colors={['#f093fb', '#f5576c']}
          style={styles.authGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="lock-closed" size={48} color="#fff" />
          <Text style={styles.authText}>Connectez-vous pour accéder au chat</Text>
        </LinearGradient>
      </View>
    );
  }

  // 🟩 Layout Mobile
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
          onBack={() => {
            setSelectedUserId(null);
            resetActivePartner();
          }}
          parkingLogo={parkingLogo}
          pusherStatus={pusherStatus}
        />
      );
    }

    // 🟦 Liste des parkings avec header
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#f8f9ff', '#ffffff']}
          style={{ flex: 1 }}
        >
          {/* HEADER FIXE */}
          <LinearGradient
            colors={['#ff7d00', '#ff7d00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.headerTitle}>Contactez un parkings</Text>
            </View>
          </LinearGradient>

          {/* CONTENU SCROLLABLE */}
          {loadingParkings ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="refresh-circle" size={40} color="#ff7d00" />
              <Text style={styles.loadingParkingsText}>Chargement des parkings...</Text>
            </View>
          ) : parkings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Aucun parking disponible</Text>
              <Text style={styles.emptySubtext}>Revenez plus tard</Text>
            </View>
          ) : (
            <ScrollView 
              contentContainerStyle={styles.parkingListContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.parkingsGrid}>
                {parkings.map((p) => (
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
                    <LinearGradient
                      colors={['#f8f9ff', '#ffffff']}
                      style={styles.cardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.logoContainer}>
                          <Image
                            source={{
                              uri: p.logo || 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                            }}
                            style={styles.parkingLogo}
                          />
                        </View>
                        <View style={styles.parkingInfo}>
                          <Text style={styles.parkingName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <View style={styles.parkingMeta}>
                            <Ionicons name="location-outline" size={12} color="#666" />
                            <Text style={styles.parkingCity} numberOfLines={1}>
                              {p.city}
                            </Text>
                          </View>
                          {/* <View style={styles.capacityBadge}>
                            <Ionicons name="car-sport-outline" size={12} color="#667eea" />
                            <Text style={styles.capacityText}>{p.capacity} places</Text>
                          </View> */}
                        </View>
                        <Ionicons 
                          name="chatbubble-ellipses" 
                          size={20} 
                          color="#ff7d00" 
                          style={styles.chatIcon}
                        />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // 🟨 Layout Tablette / Desktop
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#f8f9ff', '#ffffff']}
        style={{ flex: 1, flexDirection: 'row' }}
      >
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sidebarHeader}
          >
            <View style={styles.headerContent}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.headerTitle}>Messages</Text>
            </View>
          </LinearGradient>
          <View style={styles.sidebarContent}>
            <Text style={styles.sidebarTitle}>Conversations</Text>
            <ChatList
              conversations={conversations}
              onSelectConversation={(userId, name, logo, parkingId) =>
                handleSelectConversation(userId, name, logo, parkingId)
              }
              currentUserId={user.id}
            />
          </View>
        </View>

        {/* MAIN CONTENT */}
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
              onBack={() => {
                setSelectedUserId(null);
                resetActivePartner();
              }}
              parkingLogo={parkingLogo}
              pusherStatus={pusherStatus}
            />
          ) : (
            <View style={styles.emptyStateDesktop}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.emptyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="chatbubbles-outline" size={72} color="#fff" />
              </LinearGradient>
              <Text style={styles.emptyStateTitle}>Bienvenue dans le chat</Text>
              <Text style={styles.emptyStateSubtitle}>
                Sélectionnez une conversation ou commencez un nouveau chat avec un parking
              </Text>
              <View style={styles.emptyStateTips}>
                <Text style={styles.tipsTitle}>💡 Conseils :</Text>
                <Text style={styles.tipText}>• Soyez poli et clair dans vos messages</Text>
                <Text style={styles.tipText}>• Les parkings répondent généralement sous 24h</Text>
                <Text style={styles.tipText}>• Vous pouvez envoyer des photos si besoin</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Messages;

// === STYLES MODERNES & ÉLÉGANTS ===
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1, 
    flexDirection: 'row',
    backgroundColor: '#f8f9ff',
  },
  sidebar: { 
    width: 320, 
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  main: { 
    flex: 1, 
    backgroundColor: '#f8f9ff',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },

  // Gradients et backgrounds
  loadingGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  authGradient: {
    width: 300,
    height: 300,
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f5576c',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 1,
  },
  emptyGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Headers
  header: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileHeader: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  sidebarHeader: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerIcon: { 
    padding: 4,
  },

  // Content areas
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  parkingListContainer: {
    padding: 20,
    paddingTop: 0,
  },

  // Welcome section
  welcomeSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2A44',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: 0.3,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  // Parking cards (mobile)
  parkingsGrid: {
    gap: 16,
    top: 10
  },
  parkingCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  logoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  parkingLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
  },
  parkingInfo: {
    flex: 1,
  },
  parkingName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1F2A44',
    marginBottom: 6,
  },
  parkingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  parkingCity: { 
    color: '#666', 
    fontSize: 13,
    fontWeight: '500',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  capacityText: { 
    fontSize: 12, 
    color: '#667eea',
    fontWeight: '600',
  },
  chatIcon: {
    marginLeft: 8,
  },

  // Sidebar items (tablet)
  sidebarItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sidebarItemActive: {
    backgroundColor: '#f0f4ff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sidebarItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sidebarLogoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  sidebarLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sidebarItemInfo: {
    flex: 1,
  },
  sidebarItemText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1F2A44',
    marginBottom: 2,
  },
  sidebarMeta: { 
    fontSize: 13, 
    color: '#666',
    fontWeight: '500',
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateDesktop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptySidebar: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2A44',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2A44',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 400,
    lineHeight: 24,
  },
  emptySidebarText: { 
    textAlign: 'center', 
    color: '#999', 
    marginTop: 12,
    fontSize: 14,
  },

  // Loading states
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  authText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingParkingsText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },

  // Tips section
  emptyStateTips: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A44',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});