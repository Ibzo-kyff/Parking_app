import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Conversation, Message } from '../../app/type/chat';

interface Props {
  // conversations can be either the Conversation map ({ [id]: Message[] })
  // or an array of sender/summary objects (used by parking side)
  conversations: Conversation | any[] | Record<string, any>;
  onSelectConversation: (userId: number, parkingName: string, parkingId?: number) => void;
  currentUserId: number;
}

export const ChatList: React.FC<Props> = ({ conversations, onSelectConversation, currentUserId }) => {
  // Normalize data: if we receive an array, assume it's already a list of senders/summaries.
  const dataArray: any[] = React.useMemo(() => {
    if (!conversations) return [];
    if (Array.isArray(conversations)) return conversations;

    // If it's an object map: { otherUserId: Message[] }
    try {
      return Object.entries(conversations).map(([otherUserId, msgs]) => {
        const messages: Message[] = Array.isArray(msgs) ? msgs : (msgs && msgs.messages) || [];
        const lastMsg: Message | undefined = messages && messages.length > 0 ? messages[0] : undefined;

        // attempt to derive the other user from last message
        let otherUser: any = null;
        if (lastMsg) {
          otherUser = (lastMsg.senderId === currentUserId) ? lastMsg.receiver : lastMsg.sender;
        }

        return {
          id: Number(otherUserId),
          user: otherUser,
          lastMessage: lastMsg,
        };
      });
    } catch (e) {
      return [];
    }
  }, [conversations, currentUserId]);

  const renderItem = ({ item }: { item: any }) => {
    // `item` may be either a sender/summary object or an object we created above
    const user = item.user || item;
    const lastMsg = item.lastMessage || item.lastMessage || (item.last && item.lastMessage) || item.lastMessage;
    const parkingId = item.parkingId
      ?? item.parking?.id
      ?? lastMsg?.parkingId
      ?? lastMsg?.parking?.id
      ?? undefined;

    const prenom = user?.prenom || user?.nom || '';
    const nom = user?.nom || '';

    const initials = `${(prenom || '').charAt(0) || ''}${(nom || '').charAt(0) || ''}`.toUpperCase();
    const displayName = `${prenom} ${nom}`.trim() || 'Utilisateur';
    const preview = lastMsg?.content || user?.lastMessage || '';
    const time = lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString() : '';

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onSelectConversation(Number(item.id || user?.id), displayName, parkingId)}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
          </View>
        </View>
        <Text style={styles.time}>{time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes conversations</Text>
      <FlatList
        data={dataArray}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id || item.user?.id || Math.random())}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  title: { padding: 16, fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  userInfo: { flexDirection: 'row', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: 'white', fontWeight: 'bold' },
  textInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  preview: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  time: { fontSize: 12, color: '#8E8E93' },
});