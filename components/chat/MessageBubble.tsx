import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

interface Props {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<Props> = ({ message, isOwn }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation d'apparition
  const scaleAnim = useRef(new Animated.Value(0.95)).current; // Animation de scale

  // Lancer l'animation à l'apparition
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (message.deletedAt) {
    return (
      <Animated.View
        style={[
          styles.message,
          isOwn ? styles.own : styles.other,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
        accessibilityLabel="Message supprimé"
      >
        <View style={[styles.contentContainer, styles.deletedContainer]}>
          <Text style={styles.deletedText}>Message supprimé</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.message,
        isOwn ? styles.own : styles.other,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
      accessibilityLabel={`Message de ${isOwn ? 'vous' : 'l\'interlocuteur'}: ${message.content}`}
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.content, isOwn ? styles.ownContent : styles.otherContent]}>
          {message.content}
          {!isOwn && !message.read && (
            <Text style={styles.unread} accessibilityLabel="Non lu"> •</Text>
          )}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.time}>
            {formatRelativeTime(new Date(message.createdAt))}
          </Text>
          {isOwn && (
            <Text style={styles.readStatus} accessibilityLabel={message.read ? 'Lu' : 'Envoyé'}>
              {message.read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  message: {
    marginVertical: 8,
    paddingHorizontal: 10,
  },

  own: {
    alignSelf: 'flex-end',
  },

  other: {
    alignSelf: 'flex-start',
  },

  contentContainer: {
    maxWidth: '78%',
    borderRadius: 22,
    overflow: 'hidden', // Pour garder la forme arrondie
    backgroundColor: 'transparent',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },

  content: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
  },

  ownContent: {
    backgroundColor: '#0065FF',
    color: '#FFFFFF',
  },

  otherContent: {
    backgroundColor: '#FFFFFF',
    color: '#1B1B1E',
    borderWidth: 1,
    borderColor: '#E2E2E7',
  },

  deletedContainer: {
    alignSelf: 'center',
    marginTop: 6,
    backgroundColor: '#EFEFEF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#D3D3D8',
  },

  deletedText: {
    fontSize: 13,
    color: '#7A7A7F',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  meta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
    marginRight: 4,
  },

  time: {
    fontSize: 11,
    color: '#A1A1AB',
  },

  readStatus: {
    fontSize: 12,
    marginLeft: 6,
    color: '#0065FF',
    fontWeight: '500',
  },

  unread: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
    color: '#0065FF',
  },
});