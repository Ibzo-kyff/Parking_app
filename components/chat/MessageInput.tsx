import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  userOnlineStatus?: boolean;
}

export const MessageInput: React.FC<Props> = ({
  onSend,
  disabled,
  autoFocus = false,
  userOnlineStatus = false,
}) => {
  const [content, setContent] = useState('');
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
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
      <View style={styles.inputWrapper}>
        {userOnlineStatus && <View style={styles.inputStatusDot} />}
        <TextInput
          ref={inputRef}
          style={[styles.input, userOnlineStatus ? { paddingLeft: 8 } : undefined]}
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
        />
      </View>

      <TouchableOpacity
        onPress={handleSend}
        style={styles.sendBtn}
        disabled={!content.trim() || disabled}
      >
        <Feather name="send" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CD964',
    marginRight: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    padding: 12,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#ff7d00',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
