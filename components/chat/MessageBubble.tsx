import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../app/type/chat';

// Helper pour formater la date
const formatRelativeTime = (date: Date) => {
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 10) return "à l'instant";
  if (diffSeconds < 60) return `il y a ${diffSeconds} s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR');
};

interface Props {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<Props> = ({ message, isOwn }) => {
  if (message.deletedAt) {
    return (
      <View style={[styles.message, isOwn ? styles.own : styles.other]}>
        <Text style={styles.deletedText}>Message supprimé</Text>
      </View>
    );
  }

  return (
    <View style={[styles.message, isOwn ? styles.own : styles.other]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.content, isOwn ? styles.ownContent : styles.otherContent]}>
          {message.content}
          {!isOwn && !message.read && <Text style={styles.unread}> •</Text>}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.time}>
            {formatRelativeTime(new Date(message.createdAt))}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  message: { marginVertical: 4, alignSelf: 'flex-start' },
  own: { alignSelf: 'flex-end' },
  other: { alignSelf: 'flex-start' },
  contentContainer: { maxWidth: '80%' },
  content: { padding: 12, borderRadius: 18 },
  ownContent: { backgroundColor: '#007AFF', color: 'white' },
  otherContent: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E5EA' },
  unread: { color: '#007AFF', fontWeight: 'bold' },
  meta: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  time: { fontSize: 12, color: '#8E8E93' },
  deletedText: { color: '#8E8E93', fontStyle: 'italic' },
});
