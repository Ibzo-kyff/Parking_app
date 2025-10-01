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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Interface correspondant à la structure du backend
interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    avatar: string;
  };
  receiver: {
    id: number;
    name: string;
    avatar: string;
  };
}

interface ChatComponentProps {
  contact: {
    id: number;
    name: string;
    avatar?: string;
    status?: string;
  };
  onBack?: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  contact,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Récupérer l'utilisateur connecté
  const fetchCurrentUser = async () => {
    try {
      console.log('🔍 Récupération de l\'utilisateur connecté...');
      
      // Ici, vous devriez récupérer le token depuis votre système d'authentification
      // Par exemple depuis AsyncStorage ou un contexte d'authentification
      const token = await getAuthToken(); // À implémenter selon votre système
      
      const response = await fetch('https://parkapp-pi.vercel.app/api/auth/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Réponse utilisateur:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('👤 Utilisateur connecté:', userData);
        setCurrentUserId(userData.id);
        return userData.id;
      } else {
        console.error('❌ Erreur réponse utilisateur:', response.status);
        throw new Error('Erreur d\'authentification');
      }
    } catch (error) {
      console.error('💥 Erreur fetchCurrentUser:', error);
      Alert.alert('Erreur', 'Impossible de récupérer vos informations');
      throw error;
    }
  };

  // Récupérer les messages depuis l'API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('📨 Récupération des messages pour le contact:', contact.id);
      
      const token = await getAuthToken();
      
      const response = await fetch(`https://parkapp-pi.vercel.app/api/message/conversation/${contact.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Réponse messages:', response.status);

      if (response.ok) {
        const conversationMessages = await response.json();
        console.log('💬 Messages reçus:', conversationMessages.length);
        setMessages(conversationMessages);
      } else if (response.status === 404) {
        console.log('💬 Aucun message trouvé, initialisation d\'une nouvelle conversation');
        setMessages([]);
      } else {
        console.error('❌ Erreur réponse messages:', response.status);
        throw new Error('Erreur lors de la récupération des messages');
      }
    } catch (error) {
      console.error('💥 Erreur fetchMessages:', error);
      Alert.alert('Erreur', 'Impossible de charger la conversation');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer le token d'authentification
  const getAuthToken = async (): Promise<string> => {
    try {
      // À adapter selon votre système d'authentification
      // Exemple avec AsyncStorage :
      // const token = await AsyncStorage.getItem('userToken');
      
      // Pour le moment, retournez un token valide ou utilisez une méthode de secours
      const token = 'your-valid-token-here'; // Remplacez par votre token
      
      if (!token) {
        throw new Error('Token non disponible');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
      throw new Error('Token d\'authentification manquant');
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('🚀 Initialisation du chat...');
        const userId = await fetchCurrentUser();
        await fetchMessages();
        console.log('✅ Chat initialisé avec succès');
      } catch (error) {
        console.error('💥 Erreur initialisation chat:', error);
        setLoading(false);
      }
    };

    initializeChat();
  }, [contact.id]);

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (inputMessage.trim() === '' || !currentUserId) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      return;
    }

    try {
      setSending(true);
      console.log('📤 Envoi du message...');
      
      const token = await getAuthToken();
      
      const response = await fetch('https://parkapp-pi.vercel.app/api/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: contact.id,
          content: inputMessage.trim(),
        }),
      });

      console.log('📡 Réponse envoi message:', response.status);

      if (response.ok) {
        const newMessage = await response.json();
        console.log('✅ Message envoyé avec succès');
        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
      } else {
        console.error('❌ Erreur envoi message:', response.status);
        Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      }
    } catch (error) {
      console.error('💥 Erreur sendMessage:', error);
      Alert.alert('Erreur', 'Problème de connexion');
    } finally {
      setSending(false);
    }
  };

  // Fonction pour formater la date
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  // Déterminer si le message est de l'utilisateur courant
  const isMyMessage = (message: Message) => {
    return message.senderId === currentUserId;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#075E54" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#075E54" />
            <Text style={styles.loadingText}>Chargement de la conversation...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      <SafeAreaView style={styles.safeArea}>
        {/* En-tête de la conversation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.userInfo}>
            <Image
              source={{ uri: contact.avatar || "https://randomuser.me/api/portraits/men/1.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{contact.name}</Text>
              <Text style={styles.userStatus}>
                {contact.status || "Gestionnaire de parking"}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Zone de messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>Aucun message</Text>
                <Text style={styles.emptySubText}>Envoyez le premier message pour commencer la conversation</Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {messages.map((message) => {
                  const myMessage = isMyMessage(message);
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        myMessage ? styles.myMessage : styles.otherMessage
                      ]}
                    >
                      {!myMessage && (
                        <Image
                          source={{ uri: message.sender.avatar || "https://randomuser.me/api/portraits/men/1.jpg" }}
                          style={styles.messageAvatar}
                        />
                      )}
                      
                      <View style={[
                        styles.messageContent,
                        myMessage ? styles.myMessageContent : styles.otherMessageContent
                      ]}>
                        <Text style={[
                          styles.messageText,
                          myMessage ? styles.myMessageText : styles.otherMessageText
                        ]}>
                          {message.content}
                        </Text>
                        <View style={styles.messageMeta}>
                          <Text style={styles.messageTime}>
                            {formatTime(message.createdAt)}
                          </Text>
                          {myMessage && (
                            <Ionicons
                              name={"checkmark-done"}
                              size={16}
                              color="#53bdeb"
                              style={styles.readIcon}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Zone de saisie de message */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="happy" size={24} color="#128C7E" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Tapez votre message..."
              placeholderTextColor="#888"
              multiline
              maxLength={500}
              editable={!sending}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (inputMessage.trim() === '' || sending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={inputMessage.trim() === '' || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color="white" 
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ece5dd',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#075E54',
    borderBottomWidth: 1,
    borderBottomColor: '#128C7E',
  },
  backButton: {
    padding: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#075E54',
    marginTop: 10,
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ece5dd',
  },
  messagesContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  myMessageContent: {
    backgroundColor: '#dcf8c6',
    borderTopRightRadius: 4,
  },
  otherMessageContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'black',
  },
  otherMessageText: {
    color: 'black',
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.45)',
    marginRight: 4,
  },
  readIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    minHeight: 60,
  },
  inputIcon: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 16,
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#075E54',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
});

export default ChatComponent;