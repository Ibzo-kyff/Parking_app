import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Conversation, Message } from '../../app/type/chat';

interface Props {
  conversations: Conversation | any[] | Record<string, Message[]>;
  onSelectConversation: (userId: number, displayName: string, logo?: string | null, parkingId?: number) => void;
  currentUserId: number;
  currentUserRole?: string;
}

export const ChatList: React.FC<Props> = ({ conversations, onSelectConversation, currentUserId, currentUserRole }) => {
  const dataArray: any[] = React.useMemo(() => {
    if (!conversations) return [];

    if (Array.isArray(conversations)) {
      return conversations.map((item) => {
        const user = item.user || item;
        const lastMsg = item.lastMessage || item.last?.lastMessage;
        const parkingId = item.parkingId ?? lastMsg?.parking?.id ?? lastMsg?.parkingId;
        return {
          id: user?.id || item.id,
          user,
          lastMessage: lastMsg,
          parkingId,
        };
      });
    }

    return Object.entries(conversations as Record<string, any>).map(([otherUserId, msgs]: [string, any]) => {
      const messages: Message[] = Array.isArray(msgs) ? msgs : (msgs?.messages ?? []);
      const lastMsg: Message | undefined = messages.length > 0 ? messages[0] : undefined;
      const otherUser = lastMsg
        ? lastMsg.senderId === currentUserId
          ? lastMsg.receiver
          : lastMsg.sender
        : null;

      return {
        id: Number(otherUserId),
        user: otherUser,
        lastMessage: lastMsg,
        parkingId: lastMsg?.parkingId ?? lastMsg?.parking?.id,
      };
    });
  }, [conversations, currentUserId]);

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
    const isUnread = lastMsg && !lastMsg.read && lastMsg.senderId !== currentUserId;
    const messageCount = isUnread ? 1 : 0; // Vous pouvez adapter cette logique selon vos besoins

    const logo = user?.avatar || lastMsg?.parking?.logo;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onSelectConversation(Number(item.id || user?.id), displayName, logo, parkingId)}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
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
                <Text style={styles.unreadBadgeText}>{messageCount}</Text>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d3a425ff', // Vert WhatsApp
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
    backgroundColor: '#25D366',
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
});