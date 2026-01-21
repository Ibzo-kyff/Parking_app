import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onRetry?: (message: Message) => void;
}

export const MessageBubble: React.FC<Props> = ({ message, isOwn, onRetry }) => {
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
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[styles.content, isOwn ? styles.ownContent : styles.otherContent]}>
          {message.content}
        </Text>

        <View style={styles.metaContainer}>
          <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isOwn && (
            <View style={styles.statusRow}>
              {message.status === 'failed' ? (
                <TouchableOpacity onPress={() => onRetry?.(message)}>
                  <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                </TouchableOpacity>
              ) : (
                <Ionicons
                  name={message.status === 'sending' ? "time-outline" : (message.read ? "checkmark-done" : "checkmark")}
                  size={14}
                  color={message.read ? "#4FC3F7" : "rgba(255,255,255,0.7)"}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  message: {
    marginVertical: 4,
    paddingHorizontal: 10,
    maxWidth: '85%',
  },
  own: {
    alignSelf: 'flex-end',
  },
  other: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  ownBubble: {
    backgroundColor: '#FF8A3D', // iOS Blue
    borderBottomRightRadius: 4, // Tail effect
  },
  otherBubble: {
    backgroundColor: '#F3F4F6', // Light Gray
    borderBottomLeftRadius: 4, // Tail effect
  },

  contentContainer: {
    // Legacy support kept safe or removed if unused. Refactored above to use 'bubble'.
  },
  deletedContainer: {
    alignSelf: 'center',
    marginTop: 6,
    backgroundColor: '#EFEFEF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  deletedText: {
    fontSize: 13,
    color: '#7A7A7F',
    fontStyle: 'italic',
  },

  content: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4, // Space for metadata
  },
  ownContent: {
    color: '#FFFFFF',
  },
  otherContent: {
    color: '#000000',
  },

  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTime: {
    color: 'rgba(0, 0, 0, 0.45)',
  },
  readStatus: {
    fontSize: 12,
    marginLeft: 4,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  retryText: {
    color: '#FF3B30',
    fontSize: 11,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  unread: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
    color: '#0065FF',
  },
});