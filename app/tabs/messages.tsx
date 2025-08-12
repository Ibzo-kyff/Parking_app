import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const contacts = [
  {
    id: '1',
    name: 'Moussa Keita',
    lastMessage: 'Salut, ça va ?',
    time: '10:30',
    unread: 2,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    online: true
  },
  {
    id: '2',
    name: 'Aminata Diallo',
    lastMessage: 'Je t\'envoie le document',
    time: '09:15',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    online: false
  },
  {
    id: '3',
    name: 'Support Client',
    lastMessage: 'Votre problème est résolu',
    time: 'Hier',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    online: true
  },
  {
    id: '4',
    name: 'Papa Sow',
    lastMessage: 'On se voit demain ?',
    time: 'Hier',
    unread: 3,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    online: false
  },
  {
    id: '5',
    name: 'Fatou Bâ',
    lastMessage: 'Merci pour ton aide !',
    time: 'Lundi',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
    online: true
  },
];

const ChatListScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => navigation.navigate('chatpage', { 
        contactName: item.name,
        contactAvatar: item.avatar,
        contactStatus: item.online ? 'En ligne' : 'Hors ligne'
      })}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.online && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.nameTimeContainer}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={[styles.timeText, item.unread > 0 && styles.unreadTime]}>{item.time}</Text>
        </View>
        <View style={styles.messageStatusContainer}>
          <Text 
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          ) : (
            <Ionicons name="checkmark-done" size={16} color="#888" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#FDB913', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FDB913" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.listContainer}>
          <FlatList
            data={contacts}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FDB913',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    marginHorizontal: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineBadge: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    right: 10,
  },
  contactInfo: {
    flex: 1,
  },
  nameTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  messageStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
    flex: 1,
    marginRight: 10,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  unreadTime: {
    color: '#FDB913',
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#FDB913',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatListScreen;