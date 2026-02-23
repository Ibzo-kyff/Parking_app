import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Message } from '../../app/type/chat';
import { useAuth } from '../../context/AuthContext';
import api from '../services/api';
import {
  subscribeToOtherUserPresence,
  getPusherConnectionState,
  subscribeToPusherConnection,
} from '../../app/utils/pusher';
import Constants from 'expo-constants';

const { height } = Dimensions.get('window');

interface Props {
  messages: Message[];
  onSendMessage: (text: string, receiverId: number) => void;
  onDeleteMessage?: (id: number) => void;
  onUpdateMessage?: (id: number, text: string) => void;
  onRetryMessage?: (message: Message) => void;
  receiverId: number;
  receiverName?: string;
  receiverAvatar?: string | null;
  parkingName?: string;
  parkingLogo?: string | null;
  loading: boolean;
  onBack?: () => void;
  currentUserRole?: 'CLIENT' | 'PARKING' | 'USER';
  headerBackgroundColor?: string;
  headerTextColor?: string;
  userPresence?: { isOnline: boolean; lastSeen: string | null }; // Changé ici
}

export const ChatWindow: React.FC<Props> = ({
  messages,
  onSendMessage,
  onDeleteMessage,
  onUpdateMessage,
  onRetryMessage,
  receiverId,
  receiverName,
  receiverAvatar,
  parkingName,
  parkingLogo,
  loading,
  onBack,
  currentUserRole,
  headerBackgroundColor = '#ff7d00',
  headerTextColor = '#ffffff',
  userPresence: propUserPresence, // Renommé pour éviter la confusion
}) => {
  const { user, authState } = useAuth();
  const token = authState?.accessToken || null;
  const flatListRef = useRef<FlatList<Message>>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [userPresence, setUserPresence] = useState({
    isOnline: false,
    lastSeen: null as string | null,
  });
  const [pusherStatus, setPusherStatus] = useState(getPusherConnectionState());
  const slideAnim = useRef(new Animated.Value(100)).current;

  const displayedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // 🔹 Détermination du nom à afficher selon le rôle
  const displayName = useMemo(() => {
    if (currentUserRole === 'PARKING') {
      return receiverName?.trim() || 'Client inconnu';
    }
    return parkingName?.trim() || 'Parking inconnu';
  }, [currentUserRole, receiverName, parkingName]);

  // 🔹 Fonction pour formater la date de dernière connexion
  const formatLastSeen = useCallback((dateString: string | null) => {
    if (!dateString) return 'jamais en ligne';

    const lastSeenDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    if (diffDays === 1) return 'hier';
    if (diffDays < 7) return `il y a ${diffDays} jours`;

    return lastSeenDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }, []);

  // 🔹 Fonction pour récupérer les initiales
  const getInitials = useCallback((name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return '?';
    const words = cleaned.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
  }, []);

  const displayInitials = getInitials(displayName);

  // 🔹 Utiliser les props ou l'état local
  const presenceData = propUserPresence || userPresence;

  // 🔹 Statut de connexion dynamique
  const getConnectionStatus = useMemo(() => {
    // When Pusher is connecting show a specific label
    if (pusherStatus === 'connecting') {
      return { text: 'Connexion...', color: '#FF9500', isOnline: false };
    }

    // If Pusher is connected we can trust realtime presence
    if (pusherStatus === 'connected') {
      if (presenceData.isOnline) {
        return { text: 'En ligne', color: '#4CD964', isOnline: true };
      }
      return {
        text: presenceData.lastSeen ? `Vu ${formatLastSeen(presenceData.lastSeen)}` : 'Hors ligne',
        color: '#8E8E93',
        isOnline: false
      };
    }

    // If disconnected/failed: show lastSeen from API if available, otherwise offline
    return {
      text: presenceData.lastSeen ? `Vu ${formatLastSeen(presenceData.lastSeen)}` : 'Hors ligne',
      color: presenceData.lastSeen ? '#FF9500' : '#FF6B6B',
      isOnline: false
    };
  }, [pusherStatus, presenceData, formatLastSeen]);

  // 🔹 Récupérer le statut initial de l'utilisateur depuis l'API
  useEffect(() => {
    const fetchUserPresence = async () => {
      if (!receiverId) return;

      try {
        const response = await api.get(`/api/messages/users/${receiverId}/presence`);

        if (response.status === 200) {
          setUserPresence({
            isOnline: response.data.isOnline,
            lastSeen: response.data.lastSeen,
          });
        }
      } catch (error) {
        // Si l'API répond 404 cela signifie "absence de ressource" (pas de donnée de présence).
        // On ne considère pas cela comme une erreur fatale — on applique un fallback propre.
        const status = (error as any)?.response?.status;
        if (status === 404) {
          setUserPresence({ isOnline: false, lastSeen: null });
        } else {
          console.error('Erreur récupération présence:', error);
        }
      }
    };

    fetchUserPresence();
  }, [receiverId, token]);

  // 🔹 Écouter les changements de statut Pusher
  useEffect(() => {
    const unsubscribe = subscribeToPusherConnection((status) => {
      setPusherStatus(status);
    });

    return unsubscribe;
  }, []);

  // 🔹 Quand Pusher se reconnecte, rafraîchir l'état de présence via API
  useEffect(() => {
    const refreshPresence = async () => {
      if (!receiverId) return;
      try {
        const response = await api.get(`/api/messages/users/${receiverId}/presence`);
        if (response.status === 200) {
          setUserPresence({
            isOnline: response.data.isOnline,
            lastSeen: response.data.lastSeen,
          });
        }
      } catch (err) {
        // silent
      }
    };

    if (pusherStatus === 'connected') {
      refreshPresence();
    }
  }, [pusherStatus, receiverId]);

  // 🔹 Suivre la présence de l'autre utilisateur via Pusher
  useEffect(() => {
    if (!receiverId || !user?.id) return;

    let cleanupPresence: (() => void) | undefined;

    const setupPresenceTracking = async () => {
      try {
        cleanupPresence = await subscribeToOtherUserPresence(
          receiverId,
          (isOnline) => {
            setUserPresence(prev => ({
              ...prev,
              isOnline,
              lastSeen: isOnline ? null : new Date().toISOString()
            }));
          }
        );
      } catch (error) {
        console.error('Erreur abonnement présence:', error);
      }
    };

    setupPresenceTracking();

    return () => {
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, [receiverId, user?.id]);

  // Animation du menu contextuel
  const openMenu = () => {
    setShowMenu(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.spring(slideAnim, {
      toValue: 100,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => setShowMenu(false));
  };

  const scrollToEnd = useCallback((animated = true) => {
    if (displayedMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  }, [displayedMessages.length]);

  useEffect(() => {
    scrollToEnd(true);
  }, [displayedMessages, scrollToEnd]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        message={item}
        isOwn={Number(item.senderId) === Number(user?.id)}
        onRetry={onRetryMessage}
      />
    ),
    [user?.id, onRetryMessage]
  );

  const keyExtractor = useCallback(
    (item: Message) =>
      item.clientTempId
        ? `temp-${item.clientTempId}`
        : `msg-${item.id}`,
    []
  );

  const status = getConnectionStatus;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                accessibilityLabel="Retour"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color={headerTextColor} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerCenter}>
            <View style={[styles.headerLogo, styles.fallbackAvatar]}>
              <Text style={[styles.fallbackAvatarText, { color: headerTextColor }]}>
                {displayInitials}
              </Text>
              {(pusherStatus === 'connected' && presenceData.isOnline) && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerName, { color: headerTextColor }]} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: status.color }
                  ]}
                />
                <Text style={[styles.headerStatus, { color: status.color }]}>
                  {status.text}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={openMenu}
              style={styles.menuButton}
              accessibilityLabel="Options"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={headerTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* MENU CONTEXTUEL */}
        <Modal visible={showMenu} transparent animationType="none" onRequestClose={closeMenu}>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={closeMenu}
          >
            <Animated.View
              style={[
                styles.menuContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {[
                { icon: 'person-outline', label: 'Voir le profil', action: 'profile' },
                { icon: 'trash-outline', label: 'Effacer la conversation', action: 'clear' },
                { icon: 'ban-outline', label: 'Bloquer', action: 'block' },
                { icon: 'flag-outline', label: 'Signaler', action: 'report' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.action}
                  style={styles.menuItem}
                  onPress={() => console.log(item.action)}
                  accessibilityLabel={item.label}
                >
                  <Ionicons name={item.icon as any} size={18} color="#1F2A44" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* MESSAGES */}
        <View style={styles.messagesWrapper}>
          {displayedMessages.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message dans cette conversation</Text>
              <Text style={styles.emptySubText}>Envoyez le premier message !</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={displayedMessages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={21}
              removeClippedSubviews={true}
              onContentSizeChange={() => scrollToEnd(true)}
            />
          )}
        </View>

        {/* LOADER */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff7d00" />
          </View>
        )}

        {/* INPUT */}
        <View style={styles.footer}>
          <MessageInput
            onSend={(content) => onSendMessage(content, receiverId)}
            disabled={loading || pusherStatus !== 'connected'}
            autoFocus={false}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC'
  },
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start'
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
    justifyContent: 'center'
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end'
  },
  backButton: {
    padding: 8,
    borderRadius: 12
  },
  menuButton: {
    padding: 8,
    borderRadius: 12
  },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fallbackAvatar: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  fallbackAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1
  },
  headerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  messagesWrapper: {
    flex: 1,
    backgroundColor: '#F7F9FC'
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#8A8F9E',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#C7C7CC',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: height * 0.15,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1F2A44',
    marginLeft: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});