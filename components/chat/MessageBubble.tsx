import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

// Petit helper local pour formater les dates en relatif (français) sans dépendance externe
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
import { Message } from '../../app/type/chat';

interface Props {
  message: Message;
  isOwn: boolean;
  onDelete: (id: number) => void;
  onEdit: (id: number, content: string) => void;
}

export const MessageBubble: React.FC<Props> = ({ message, isOwn, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  if (message.deletedAt) {
    return (
      <View style={[styles.message, isOwn ? styles.own : styles.other]}>
        <Text style={styles.deletedText}>Message supprimé</Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <View style={[styles.message, styles.editing, isOwn ? styles.own : styles.other]}>
        <TextInput
          value={editContent}
          onChangeText={setEditContent}
          onSubmitEditing={() => { onEdit(message.id, editContent); setIsEditing(false); }}
          style={styles.editInput}
          multiline
          autoFocus
        />
        <View style={styles.editActions}>
          <TouchableOpacity onPress={() => { onEdit(message.id, editContent); setIsEditing(false); }}>
            <Text style={styles.actionText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Text style={styles.actionText}>✕</Text>
          </TouchableOpacity>
        </View>
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
          {isOwn && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionBtn}>
                <Text style={styles.actionText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(message.id)} style={styles.actionBtn}>
                <Text style={styles.actionText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
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
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  time: { fontSize: 12, color: '#8E8E93', marginRight: 8 },
  actions: { flexDirection: 'row' },
  actionBtn: { paddingHorizontal: 4 },
  actionText: { fontSize: 16 },
  editing: { alignSelf: 'center' },
  editInput: { 
    borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, 
    padding: 8, minHeight: 40, maxHeight: 100, width: 250 
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  deletedText: { color: '#8E8E93', fontStyle: 'italic' },
});