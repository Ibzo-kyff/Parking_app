import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator
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

  // Normaliser le rôle pour TypeScript
  const currentUserRole: 'CLIENT' | 'PARKING' | 'USER' | undefined = (authState?.role as any) || undefined;

  const {
    messages,
    conversations,
    loading,
    sendMessage,
    loadConversation,
    deleteMessage,
    updateMessage,
    setCurrentParkingId,
    resetActivePartner,
    retryMessage,
    pusherStatus,
    userPresence
  } = useChat(initialParkingId);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
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

    // Trouver la conversation pour récupérer plus d'informations
    const conversation = conversations.find(conv => conv.user.id === userId);
    setSelectedConversation(conversation || null);

    // Charger la conversation avec l'utilisateur sélectionné
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

  // Fonction pour gérer le retry des messages
  const handleRetryMessage = (message: Message) => {
    if (retryMessage && selectedUserId) {
      retryMessage(message);
    }
  };

  // Trier les parkings par date du dernier message (du plus récent au plus ancien)
  const sortedParkings = useMemo(() => {
    // Créer un Map pour un accès rapide à la conversation de chaque parking
    const conversationMap = new Map(
      conversations.map(conv => [conv.user.id, conv])
    );

    // Trier les parkings
    return [...parkings].sort((a, b) => {
      const convA = a.user?.id ? conversationMap.get(a.user.id) : null;
      const convB = b.user?.id ? conversationMap.get(b.user.id) : null;

      // Priorité 1 : Messages non lus
      const unreadA = convA?.unreadCount || 0;
      const unreadB = convB?.unreadCount || 0;
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;

      // Priorité 2 : Date du dernier message
      const dateA = convA?.lastMessage?.createdAt
        ? new Date(convA.lastMessage.createdAt).getTime()
        : 0;
      const dateB = convB?.lastMessage?.createdAt
        ? new Date(convB.lastMessage.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [parkings, conversations]);

  // Trier les conversations pour la sidebar tablette
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      // Priorité 1 : Messages non lus
      const unreadA = a.unreadCount || 0;
      const unreadB = b.unreadCount || 0;
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadB > 0 && unreadA === 0) return 1;

      // Priorité 2 : Date du dernier message
      const dateA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const dateB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });
  }, [conversations]);

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

  // Layout Mobile
  if (!isTablet) {
    if (selectedUserId) {
      // Récupérer les données de présence de l'utilisateur sélectionné
      const presenceData = userPresence(selectedUserId);

      return (
        <ChatWindow
          messages={messages}
          onSendMessage={sendMessage}
          onDeleteMessage={deleteMessage}
          onUpdateMessage={updateMessage}
          onRetryMessage={handleRetryMessage}
          receiverId={selectedUserId}
          parkingName={parkingName}
          loading={loading}
          onBack={() => {
            setSelectedUserId(null);
            setSelectedConversation(null);
            resetActivePartner();
          }}
          parkingLogo={parkingLogo}
          currentUserRole={currentUserRole}
          userPresence={presenceData}
        />
      );
    }

    // Liste des parkings avec header (triée)
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
              <Text style={styles.headerTitle}>Contactez un parking</Text>
            </View>
          </LinearGradient>

          {/* CONTENU SCROLLABLE AVEC PARKINGS TRIÉS */}
          {loadingParkings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff7d00" />
              <Text style={styles.loadingParkingsText}>Chargement des parkings...</Text>
            </View>
          ) : sortedParkings.length === 0 ? (
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
                {sortedParkings.map((p) => {
                  // Trouver la conversation avec ce parking
                  const conversation = conversations.find(
                    (conv) => conv.user?.id === p.user?.id
                  );

                  // Récupérer les données de présence pour ce parking
                  const parkingUserId = p.user?.id;
                  const presenceData = parkingUserId ? userPresence(parkingUserId) : { isOnline: false, lastSeen: null };

                  // Calculer le nombre de messages non lus
                  let unreadCount = 0;
                  if (conversation?.unreadCount !== undefined) {
                    unreadCount = conversation.unreadCount;
                  } else if (conversation?.lastMessage) {
                    // Vérifier si le dernier message n'est pas lu et est reçu par l'utilisateur courant
                    if (!conversation.lastMessage.read &&
                      conversation.lastMessage.receiverId === user.id) {
                      unreadCount = 1;
                    }
                  }

                  return (
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
                      activeOpacity={0.7}
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
                              defaultSource={require('../../assets/images/favicon.png')}
                            />
                            {presenceData.isOnline && (
                              <View style={styles.onlineIndicator} />
                            )}
                            {unreadCount > 0 && <View style={styles.unreadDotMini} />}
                          </View>

                          <View style={styles.parkingInfo}>
                            <View style={styles.mainInfoRow}>
                              <Text style={styles.parkingName} numberOfLines={1}>
                                {p.name}
                              </Text>
                              {conversation?.lastMessage && (
                                <Text style={styles.timeText}>
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </Text>
                              )}
                            </View>

                            <View style={styles.metaRow}>
                              <View style={styles.cityInfo}>
                                <Ionicons name="location-sharp" size={12} color="#ff7d00" />
                                <Text style={styles.parkingCity} numberOfLines={1}>
                                  {p.city}
                                </Text>
                              </View>
                              {!presenceData.isOnline && presenceData.lastSeen && (
                                <Text style={styles.lastSeenTextMini}>
                                  Vu {formatMessageTime(presenceData.lastSeen)}
                                </Text>
                              )}
                            </View>

                            <View style={styles.bottomRow}>
                              {conversation?.lastMessage ? (
                                <Text style={styles.lastMessageText} numberOfLines={1}>
                                  {conversation.lastMessage.content}
                                </Text>
                              ) : (
                                <Text style={styles.noMessageText}>Aucun message</Text>
                              )}

                              {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Layout Tablette / Desktop
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#f8f9ff', '#ffffff']}
        style={{ flex: 1, flexDirection: 'row' }}
      >
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <LinearGradient
            colors={['#ff7d00', '#ff7d00']}
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
              conversations={sortedConversations}
              onSelectConversation={(userId, name, logo, parkingId) =>
                handleSelectConversation(userId, name, logo, parkingId)
              }
              currentUserId={user.id}
              userPresence={userPresence}
            />
          </View>
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.main}>
          {selectedUserId ? (
            <>
              {(() => {
                const presenceData = userPresence(selectedUserId);
                return (
                  <ChatWindow
                    messages={messages}
                    onSendMessage={sendMessage}
                    onDeleteMessage={deleteMessage}
                    onUpdateMessage={updateMessage}
                    onRetryMessage={handleRetryMessage}
                    receiverId={selectedUserId}
                    parkingName={parkingName}
                    loading={loading}
                    onBack={() => {
                      setSelectedUserId(null);
                      setSelectedConversation(null);
                      resetActivePartner();
                    }}
                    parkingLogo={parkingLogo}
                    currentUserRole={currentUserRole}
                    userPresence={presenceData}
                  />
                );
              })()}
            </>
          ) : (
            <View style={styles.emptyStateDesktop}>
              <LinearGradient
                colors={['#ff7d00', '#ff7d00']}
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
                <Text style={styles.tipText}>• Les indicateurs verts montrent qui est en ligne</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Fonction utilitaire pour formater l'heure des messages
const formatMessageTime = (dateString: string | null) => {
  if (!dateString) return 'Jamais en ligne';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays === 1) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
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
    shadowColor: '#ff7d00',
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
    paddingTop: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  logoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  parkingLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  parkingInfo: {
    flex: 1,
  },
  parkingName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  parkingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  parkingCity: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964',
  },
  onlineText: {
    fontSize: 11,
    color: '#4CD964',
    fontWeight: '600',
  },
  lastSeenText: {
    fontSize: 11,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  lastMessageContainer: {
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  lastMessageTime: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
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
  messageCountBadge: {
    backgroundColor: '#ff7d00',
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#ff7d00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  mainInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  lastMessageText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    marginRight: 10,
  },
  noMessageText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#ff7d00',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadDotMini: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff7d00',
    borderWidth: 2,
    borderColor: '#fff',
  },
  lastSeenTextMini: {
    fontSize: 10,
    color: '#9CA3AF',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingParkingsText: {
    color: '#ff7d00',
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