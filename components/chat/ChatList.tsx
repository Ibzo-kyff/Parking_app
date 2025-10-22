// ChatList.tsx (version améliorée)
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

    return Object.entries(conversations).map(([otherUserId, msgs]) => {
      const messages: Message[] = Array.isArray(msgs) ? msgs : (msgs?.messages || []);
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
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const hasUnreadMessages = (lastMessage?: Message) => {
    if (!lastMessage) return false;
    return lastMessage.senderId !== currentUserId && !lastMessage.read;
  };

  const renderItem = ({ item }: { item: any }) => {
    const user = item.user || item;
    const lastMsg = item.lastMessage || item.last?.lastMessage;
    const parkingId = item.parkingId ?? lastMsg?.parkingId ?? lastMsg?.parking?.id;

    const prenom = user?.prenom || '';
    const nom = user?.nom || '';
    const displayName = currentUserRole === 'PARKING' 
      ? `${prenom} ${nom}`.trim() || 'Client inconnu'
      : lastMsg?.parking?.name || 'Parking inconnu';
    const initials = `${prenom.charAt(0) || ''}${nom.charAt(0) || ''}`.toUpperCase();
    const preview = lastMsg?.content || 'Aucun message';
    const time = formatTime(lastMsg?.createdAt);
    const logo = user?.avatar || lastMsg?.parking?.logo;
    const unread = hasUnreadMessages(lastMsg);

    return (
      <TouchableOpacity
        style={[styles.item, unread && styles.unreadItem]}
        onPress={() => onSelectConversation(Number(item.id || user?.id), displayName, logo, parkingId)}
      >
        <View style={styles.userInfo}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </View>
          )}
          <View style={styles.textInfo}>
            <View style={styles.nameContainer}>
              <Text style={[styles.name, unread && styles.unreadName]} numberOfLines={1}>
                {displayName}
              </Text>
              {time ? <Text style={styles.time}>{time}</Text> : null}
            </View>
            <View style={styles.previewContainer}>
              <Text 
                style={[styles.preview, unread && styles.unreadPreview]} 
                numberOfLines={2}
              >
                {preview}
              </Text>
              {unread && <View style={styles.unreadBadge} />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            {dataArray.length} conversation{dataArray.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      <FlatList
        data={dataArray}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id || item.user?.id || 'temp-' + Math.random())}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#F8F8F8',
    backgroundColor: '#FFFFFF',
  },
  unreadItem: {
    backgroundColor: '#F8FBFF',
  },
  userInfo: { 
    flexDirection: 'row', 
    flex: 1,
    alignItems: 'flex-start',
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#E8E8ED',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarFallback: {
    backgroundColor: '#007AFF',
  },
  avatarText: { 
    color: 'white', 
    fontWeight: '600',
    fontSize: 16,
  },
  textInfo: { 
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { 
    fontSize: 17, 
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: '700',
    color: '#000000',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  preview: { 
    fontSize: 15, 
    color: '#8E8E93', 
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  unreadPreview: {
    color: '#1C1C1E',
    fontWeight: '500',
  },
  time: { 
    fontSize: 13, 
    color: '#8E8E93',
    fontWeight: '500',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginTop: 6,
  },
});