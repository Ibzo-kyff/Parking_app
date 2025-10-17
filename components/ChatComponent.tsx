import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Message } from './services/chatServices';

interface ChatComponentProps {
  contact: {
    id: number;           // correspond à l'ID du parking
    name: string;         // nom du parking
    avatar?: string;      // logo ou image du parking
    status?: string;      // en ligne / disponible
    isParking?: boolean;  // toujours true ici
  };
  onBack?: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ contact, onBack }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { authState } = useAuth();

  const {
    currentConversation,
    loading,
    error,
    sendMessage,
    loadConversation,
    updateMessage,
    deleteMessage,
    addMessageToConversation,
  } = useChat();

  // 🔹 Charger la conversation utilisateur ↔ parking
  useEffect(() => {
    if (!authState.accessToken) return;

    loadConversation(contact.id, true); // ✅ toujours `true` ici, car on parle à un parking
  }, [contact.id, authState.accessToken]);

  // 🔹 Auto-scroll quand nouveaux messages
  useEffect(() => {
    if (currentConversation.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [currentConversation]);

  // 🔹 Gestion "en train d'écrire"
  useEffect(() => {
    if (inputMessage.trim().length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [inputMessage]);

  // 🔹 Envoi du message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    if (!authState.accessToken) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    const messageContent = inputMessage.trim();

    try {
      setSending(true);
      setInputMessage('');
      const newMessage = await sendMessage(contact.id, messageContent, true); // ✅ isParking = true
      addMessageToConversation(newMessage);
    } catch (err: any) {
      setInputMessage(messageContent);
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer le message.');
    } finally {
      setSending(false);
    }
  };

  // 🔹 Édition d’un message
  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await updateMessage(editingMessage.id, editContent.trim());
      setEditModalVisible(false);
      setEditingMessage(null);
      setEditContent('');
      loadConversation(contact.id, true);
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le message');
    }
  };

  // 🔹 Suppression d’un message
  const handleDeleteMessage = async (messageId: number) => {
    Alert.alert('Supprimer le message', 'Voulez-vous vraiment supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMessage(messageId);
            loadConversation(contact.id, true);
          } catch {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const isMyMessage = (message: Message) => {
    const myId = authState.userId ? parseInt(authState.userId) : 0;
    return message.senderId === myId;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // 🔹 Affichage “chargement”
  if (loading && currentConversation.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>Chargement de la discussion...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      <SafeAreaView style={styles.safeArea}>

        {/* 🔹 Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri:
                  contact.avatar ||
                  'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              }}
              style={styles.avatar}
            />
            <View style={styles.userText}>
              <Text style={styles.userName}>{contact.name}</Text>
              <Text style={styles.userStatus}>{contact.status || 'Disponible'}</Text>
            </View>
          </View>
        </View>

        {/* 🔹 Zone des messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {currentConversation.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun message avec {contact.name}</Text>
                <Text style={styles.emptySubtext}>Démarrez la conversation !</Text>
              </View>
            ) : (
              currentConversation.map((msg) => {
                const mine = isMyMessage(msg);
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      mine ? styles.myMessage : styles.otherMessage,
                    ]}
                  >
                    {!mine && (
                      <Image
                        source={{
                          uri:
                            msg.parking?.logo ||
                            contact.avatar ||
                            'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        }}
                        style={styles.messageAvatar}
                      />
                    )}

                    <View style={styles.messageContentWrapper}>
                      <View
                        style={[
                          styles.messageContent,
                          mine
                            ? styles.myMessageContent
                            : styles.otherMessageContent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            mine
                              ? styles.myMessageText
                              : styles.otherMessageText,
                          ]}
                        >
                          {msg.content}
                        </Text>
                        <Text style={styles.messageTime}>
                          {formatTime(msg.createdAt)}
                        </Text>
                      </View>

                      {mine && (
                        <View style={styles.messageActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingMessage(msg);
                              setEditContent(msg.content);
                              setEditModalVisible(true);
                            }}
                            style={styles.actionButton}
                          >
                            <Ionicons
                              name="create-outline"
                              size={16}
                              color="#555"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteMessage(msg.id)}
                            style={styles.actionButton}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#555"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* 🔹 Input message */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Écrire un message..."
                placeholderTextColor="#999"
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputMessage.trim() || sending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputMessage.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// styles conservés
const styles = StyleSheet.create({
  ... // (identiques à ta version)
});

export default ChatComponent;
