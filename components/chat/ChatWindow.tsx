import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Message } from '../../app/type/chat';
import { useAuth } from '../../context/AuthContext';

interface Props {
  messages: Message[];
  onSendMessage: (content: string, receiverId: number) => void;
  receiverId: number;
  parkingName?: string;
  loading: boolean;
  onBack?: () => void;
  parkingLogo?: string | null;
  receiverName?: string; // Ajout pour le nom du client
  receiverAvatar?: string | null; // Ajout pour l'avatar du client
}

export const ChatWindow: React.FC<Props> = ({
  messages, onSendMessage, receiverId, parkingName, loading, onBack, parkingLogo, receiverName, receiverAvatar,
}) => {
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  // Trier les messages du plus ancien au plus récent
  const displayedMessages = React.useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // Déterminer le nom et l'avatar à afficher dans l'en-tête
  const displayName = user?.role === 'PARKING' ? receiverName || 'Client inconnu' : parkingName || 'Parking inconnu';
  const displayAvatar = user?.role === 'PARKING' ? receiverAvatar : parkingLogo;

  // Rendu d’un message individuel
  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwn={item.senderId === user?.id}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 24}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* En-tête */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.headerCenter}>
            <Image
              source={{ uri: displayAvatar || 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }}
              style={styles.headerLogo}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.headerStatus}>En ligne</Text>
            </View>
          </View>
        </View>

        {/* Liste des messages */}
        <View style={styles.messagesWrapper}>
          <FlatList
            ref={flatListRef}
            data={displayedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messages}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Loader */}
        {loading && <ActivityIndicator style={styles.loading} />}

        {/* Champ d’envoi */}
        <View style={styles.footer}>
          <MessageInput
            autoFocus
            onSend={(content) => onSendMessage(content, receiverId)}
            disabled={loading}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#007AFF',
    paddingTop: 50,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff' },
  headerTextContainer: { marginLeft: 12, flex: 1 },
  headerName: { color: 'white', fontSize: 16, fontWeight: '600' },
  headerStatus: { color: '#DDEEFF', fontSize: 12, marginTop: 2 },
  messagesWrapper: { flex: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: 8 },
  loading: { padding: 16 },
  footer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    height: 72,
    justifyContent: 'center',
  },
});