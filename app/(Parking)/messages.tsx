import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image } from 'react-native';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { Message } from '../../app/type/chat';

interface ConversationEntry {
  userId: number;
  name: string;
  avatar?: string | null;
  lastMessage?: Message;
}

export default function ParkingMessages() {
  const { user, isLoading, authState } = useAuth();
  const {
    messages,
    conversations,
    loading,
    sendMessage,
    loadConversation,
    setCurrentParkingId,
    currentParkingId,
  } = useChat();

  const [selectedConversation, setSelectedConversation] = useState<ConversationEntry | null>(null);

  useEffect(() => {
    const pid = authState?.parkingId ? Number(authState.parkingId) : undefined;
    if (pid) {
      setCurrentParkingId(pid);
    }
  }, [authState?.parkingId, setCurrentParkingId]);

  useEffect(() => {
    if (selectedConversation) {
      void loadConversation(selectedConversation.userId);
    }
  }, [selectedConversation, loadConversation]);

  const entries = useMemo<ConversationEntry[]>(() => {
    if (!conversations) return [];

    const unique = new Map<number, ConversationEntry>();

    Object.values(conversations).forEach((conv: any) => {
      if (conv?.type === 'user' && conv?.targetUser?.id) {
        const id = Number(conv.targetUser.id);
        if (!unique.has(id)) {
          unique.set(id, {
            userId: id,
            name: `${conv.targetUser.prenom || ''} ${conv.targetUser.nom || ''}`.trim() || 'Utilisateur',
            avatar: conv.targetUser.image,
            lastMessage: conv.lastMessage,
          });
        }
      }

      if (Array.isArray(conv?.messages)) {
        conv.messages.forEach((msg: Message) => {
          const other = msg.sender?.role === 'CLIENT' ? msg.sender : msg.receiver;
          if (other?.id && other.role === 'CLIENT') {
            const id = Number(other.id);
            if (!unique.has(id) || new Date(msg.createdAt) > new Date(unique.get(id)?.lastMessage?.createdAt || 0)) {
              unique.set(id, {
                userId: id,
                name: `${other.prenom || ''} ${other.nom || ''}`.trim() || 'Utilisateur',
                avatar: other.image,
                lastMessage: msg,
              });
            }
          }
        });
      }
    });

    return Array.from(unique.values()).sort((a, b) => {
      const aDate = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bDate = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [conversations]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Connectez-vous pour voir les messages</Text>
      </View>
    );
  }

  const handleSelectConversation = (entry: ConversationEntry) => {
    setSelectedConversation(entry);
    if (currentParkingId) {
      setCurrentParkingId(currentParkingId);
    }
  };

  if (selectedConversation) {
    const safeMessages = Array.isArray(messages) ? messages : [];
    return (
      <ChatWindow
        messages={safeMessages}
        onSendMessage={sendMessage}
        onDeleteMessage={() => {}}
        onUpdateMessage={() => {}}
        receiverId={selectedConversation.userId}
        parkingName={selectedConversation.name}
        loading={loading}
        onBack={() => setSelectedConversation(null)}
        parkingLogo={selectedConversation.avatar || null}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages reçus</Text>
      {entries.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text>Aucun message reçu pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.userId)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handleSelectConversation(item)}>
              <Image
                source={{ uri: item.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.last} numberOfLines={1}>
                  {item.lastMessage?.content || 'Nouveau message'}
                </Text>
              </View>
              <Text style={styles.time}>
                {item.lastMessage ? new Date(item.lastMessage.createdAt).toLocaleTimeString() : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#f0f0f0' },
  name: { fontSize: 16, fontWeight: '600' },
  last: { color: '#666', marginTop: 4 },
  time: { color: '#999', fontSize: 12, marginLeft: 8 },
});