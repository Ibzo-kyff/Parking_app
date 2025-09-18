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
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(3);
  const scrollViewRef = useRef();
  const navigation = useNavigation();

  // Données simulées pour la démonstration
  const demoMessages = [
    {
      id: 1,
      text: "Salut ! Comment ça va ?",
      sender: "other",
      time: "10:30",
      read: true,
      user: {
        name: "Amara KONATE",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg"
      }
    },
    {
      id: 2,
      text: "Ça va bien merci ! Et toi ?",
      sender: "me",
      time: "10:31",
      read: true
    },
    {
      id: 3,
      text: "Très bien, merci. Tu as fini le projet sur lequel tu travaillais ?",
      sender: "other",
      time: "10:32",
      read: true,
      user: {
        name: "Amara KONATE",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg"
      }
    },
    {
      id: 4,
      text: "Oui, je viens juste de terminer. C'était assez challenging mais j'ai réussi !",
      sender: "me",
      time: "10:33",
      read: true
    },
    {
      id: 5,
      text: "Félicitations ! 🎉 Tu veux qu'on aille prendre un café pour célébrer ça ?",
      sender: "other",
      time: "10:35",
      read: false,
      user: {
        name: "Amara KONATE",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg"
      }
    }
  ];

  const demoContacts = [
    {
      id: 1,
      name: "Amara KONATE",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      status: "En ligne",
      lastMessage: "Félicitations ! 🎉 Tu veux qu'on aille prendre un café pour célébrer ça ?",
      time: "10:35",
      unread: 1
    },
    {
      id: 2,
      name: "Marie TRAORE",
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
      status: "En ligne",
      lastMessage: "À demain pour la réunion !",
      time: "09:15",
      unread: 0
    },
    {
      id: 3,
      name: "Paul DUPONT",
      avatar: "https://randomuser.me/api/portraits/men/3.jpg",
      status: "Dernière connexion il y a 2h",
      lastMessage: "J'ai envoyé le document",
      time: "Hier",
      unread: 3
    },
    {
      id: 4,
      name: "Sophie MARTIN",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
      status: "Dernière connexion à 08:30",
      lastMessage: "Merci pour ton aide !",
      time: "Lundi",
      unread: 0
    }
  ];

  useEffect(() => {
    // Simuler le chargement des messages
    setTimeout(() => {
      setMessages(demoMessages);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Faire défiler vers le bas quand de nouveaux messages arrivent
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simuler une réponse après un délai
    setTimeout(() => {
      const responseMessage = {
        id: messages.length + 2,
        text: "Super ! Je passe te prendre à 17h 😊",
        sender: "other",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        user: {
          name: "Amara KONATE",
          avatar: "https://randomuser.me/api/portraits/men/1.jpg"
        }
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 1500);
  };

  const formatTime = (time) => {
    return time;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#075E54', '#128C7E']}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="#075E54" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Chargement des messages...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#075E54', '#128C7E']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#075E54" />
      <SafeAreaView style={styles.safeArea}>
        {/* En-tête de la conversation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.userInfo}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>Amara KONATE</Text>
              <Text style={styles.userStatus}>En ligne</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="video" size={20} color="white" />
            </TouchableOpacity>
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
          keyboardVerticalOffset={90}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.messagesList}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.sender === 'me' ? styles.myMessage : styles.otherMessage
                  ]}
                >
                  {message.sender === 'other' && (
                    <Image
                      source={{ uri: message.user.avatar }}
                      style={styles.messageAvatar}
                    />
                  )}
                  
                  <View style={[
                    styles.messageContent,
                    message.sender === 'me' ? styles.myMessageContent : styles.otherMessageContent
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.sender === 'me' ? styles.myMessageText : styles.otherMessageText
                    ]}>
                      {message.text}
                    </Text>
                    <View style={styles.messageMeta}>
                      <Text style={styles.messageTime}>{formatTime(message.time)}</Text>
                      {message.sender === 'me' && (
                        <Ionicons
                          name={message.read ? "checkmark-done" : "checkmark"}
                          size={16}
                          color={message.read ? "#53bdeb" : "rgba(255,255,255,0.6)"}
                          style={styles.readIcon}
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Zone de saisie de message */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="happy" size={24} color="#128C7E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputIcon}>
              <Ionicons name="attach" size={24} color="#128C7E" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Tapez un message"
              placeholderTextColor="#888"
              multiline
            />
            
            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={inputMessage.trim() === ''}
            >
              {inputMessage.trim() === '' ? (
                <Ionicons name="mic" size={24} color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
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
    paddingVertical: 10,
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
    marginRight: 10,
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
    marginLeft: 5,
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
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ece5dd',
    paddingHorizontal: 16,
  },
  messagesList: {
    paddingVertical: 20,
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
    maxWidth: '70%',
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
    fontSize: 12,
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
    paddingVertical: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    maxHeight: 100,
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
});

export default ChatApp;