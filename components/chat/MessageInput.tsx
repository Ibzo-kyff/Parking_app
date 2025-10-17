import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const MessageInput: React.FC<Props> = ({ onSend, disabled, autoFocus = false }) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      try { inputRef.current.focus(); } catch (e) { /* ignore */ }
    }
  }, [autoFocus]);

  const handleSend = () => {
    if (content.trim()) {
      onSend(content);
      setContent('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={content}
        onChangeText={setContent}
        placeholder="Tapez votre message..."
        multiline
        blurOnSubmit={false}
        onSubmitEditing={handleSend}
        returnKeyType="send"
        keyboardAppearance="default"
        textAlignVertical="top"
        editable={!disabled}
        keyboardShouldPersistTaps="handled"
      />
      <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={!content.trim() || disabled}>
        <Feather name="send" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', padding: 12, backgroundColor: 'white', alignItems: 'flex-end' 
  },
  input: { 
    flex: 1, borderWidth: 1, borderColor: '#E5E5EA', 
    borderRadius: 20, padding: 12, maxHeight: 100 
  },
  sendBtn: { 
    backgroundColor: '#007AFF', borderRadius: 20, 
    width: 40, height: 40, justifyContent: 'center', 
    alignItems: 'center', marginLeft: 8 
  },
});