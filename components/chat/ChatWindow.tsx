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

const { height } = Dimensions.get('window');

interface Props {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onDeleteMessage: (id: number) => void;
  onUpdateMessage: (id: number, text: string) => void;
  receiverId: number;
  receiverName: string;
  receiverAvatar?: string | null;
  loading: boolean;
  onBack?: () => void;
  currentUserRole: 'CLIENT' | 'PARKING';
}

export const ChatWindow: React.FC<Props> = ({
  messages,
  onSendMessage,
  receiverId,
  parkingName,
  loading,
  onBack,
  parkingLogo,
  receiverName,
  receiverAvatar,
}) => {
  const { user } = useAuth();
  const flatListRef = useRef<FlatList<Message>>(null);
  const [showMenu, setShowMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current;

  const displayedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // 🔹 Détermination du nom à afficher selon le rôle
  const displayName = useMemo(() => {
    if (user?.role === 'PARKING') {
      return receiverName?.trim() || 'Client inconnu';
    }
    return parkingName?.trim() || 'Parking inconnu';
  }, [user?.role, receiverName, parkingName]);

  // 🔹 Fonction pour récupérer les initiales du nom et prénom
  const getInitials = useCallback((name: string) => {
    const cleaned = name.trim();
    if (!cleaned) return '?';
    const words = cleaned.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
  }, []);

  // 🔹 Même si un avatar ou logo existe, on privilégie les initiales
  const displayInitials = getInitials(displayName);

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

  const handleMenuAction = (action: string) => {
    closeMenu();
    console.log('Menu action:', action);
  };

  const scrollToEnd = useCallback(() => {
    if (displayedMessages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [displayedMessages.length]);

  useEffect(() => {
    scrollToEnd();
  }, [displayedMessages, scrollToEnd]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} isOwn={item.senderId === user?.id} />
    ),
    [user?.id]
  );

  const keyExtractor = useCallback((item: Message) => String(item.id), []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Retour">
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* 🔹 Remplacement du logo/avatar par les initiales */}
          <View style={styles.headerCenter}>
            <View style={[styles.headerLogo, styles.fallbackAvatar]}>
              <Text style={styles.fallbackAvatarText}>{displayInitials}</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.headerStatus}>En ligne</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={openMenu} style={styles.menuButton} accessibilityLabel="Options">
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MENU CONTEXTUEL */}
        <Modal visible={showMenu} transparent animationType="none" onRequestClose={closeMenu}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
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
                  onPress={() => handleMenuAction(item.action)}
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
            onContentSizeChange={scrollToEnd}
          />
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
            disabled={loading}
            autoFocus={false}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ce8754ff',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 3, justifyContent: 'center' },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  backButton: { padding: 8, borderRadius: 12, },
  menuButton: { padding: 8, borderRadius: 12, },

  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6E9EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackAvatar: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  fallbackAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
  },
  headerTextContainer: { marginLeft: 12, flex: 1 },
  headerName: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },
  headerStatus: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, marginTop: 4, fontWeight: '400' },

  messagesWrapper: { flex: 1, backgroundColor: '#F7F9FC' },
  messagesContent: { padding: 16, paddingBottom: 24 },
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
