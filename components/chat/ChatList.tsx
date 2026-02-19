import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ConversationList, Message } from '../../app/type/chat';

interface Props {
  conversations: ConversationList;
  onSelectConversation: (userId: number, displayName: string, logo?: string | null, parkingId?: number) => void;
  currentUserId: number;
  currentUserRole?: string;
  userPresence?: (userId: number) => { isOnline: boolean; lastSeen: string | null };
}

export const ChatList: React.FC<Props> = ({ conversations, onSelectConversation, currentUserId, currentUserRole, userPresence }) => {
  const dataArray = React.useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];

    return conversations.map((item) => {
      const user = item.user;
      const lastMsg = item.lastMessage;
      // On cherche le parkingId dans le message ou l'item
      const parkingId = (item as any).parkingId ?? lastMsg?.parkingId ?? lastMsg?.parking?.id;

      return {
        id: user?.id,
        user,
        lastMessage: lastMsg,
        parkingId,
        unreadCount: item.unreadCount, // Ajout de la prop unreadCount
      };
    });
  }, [conversations]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const user = item.user || item;
    const lastMsg = item.lastMessage || item.last?.lastMessage;
    const parkingId = item.parkingId ?? lastMsg?.parkingId ?? lastMsg?.parking?.id;

    // Nom complet
    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    const displayName = `${prenom} ${nom}`.trim() || 'Utilisateur';

    // Initiales
    const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || 'U';

    // Aperçu & heure
    const preview = lastMsg?.content || 'Aucun message';
    const time = formatTime(lastMsg?.createdAt);

    // Statut de lecture
    const count = item.unreadCount !== undefined
      ? item.unreadCount
      : (lastMsg && !lastMsg.read && lastMsg.senderId !== currentUserId ? 1 : 0);

    // Fallback pour compatibilité avec le code existant qui utilise ces variables
    const isUnread = count > 0;
    const messageCount = count;

    const logo = user?.avatar || lastMsg?.parking?.logo;

    // Présence (optionnelle)
    const presenceData = user?.id && userPresence ? userPresence(Number(user.id)) : { isOnline: false, lastSeen: null };

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onSelectConversation(Number(item.id || user?.id), displayName, logo, parkingId)}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {presenceData?.isOnline && <View style={styles.onlineDotSmall} />}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {time && (
              <Text style={styles.time}>
                {time}
              </Text>
            )}
          </View>

          <View style={styles.previewRow}>
            <Text
              style={[
                styles.preview,
                isUnread && styles.previewUnread
              ]}
              numberOfLines={1}
            >
              {preview}
            </Text>

            {messageCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{messageCount > 99 ? '99+' : messageCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={dataArray}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.id || item.user?.id || Math.random())}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

// === STYLES WHATSAPP-LIKE ===
const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#FFFFFF',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff7d00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'System',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    marginRight: 8,
    fontFamily: 'System',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: 15,
    color: '#667781', // Gris WhatsApp
    flex: 1,
    marginRight: 8,
    fontFamily: 'System',
  },
  previewUnread: {
    color: '#000000',
    fontWeight: '500',
  },
  time: {
    fontSize: 13,
    color: '#667781',
    fontFamily: 'System',
  },
  unreadBadge: {
    backgroundColor: '#ff7d00', // ORANGE PARKING APP
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  onlineDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    position: 'absolute',
    right: 6,
    bottom: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});