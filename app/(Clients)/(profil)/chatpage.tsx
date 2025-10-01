import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import ChatComponent from '../../../components/ChatComponen';

const ChatPage = () => {
  const { userId, userName, userAvatar } = useLocalSearchParams<{
    userId: string;
    userName: string;
    userAvatar: string;
  }>();

  // Conversion de userId en number pour correspondre au backend
  const contact = {
    id: userId ? parseInt(userId) : 1,
    name: userName || 'Gestionnaire Parking',
    avatar: userAvatar || 'https://randomuser.me/api/portraits/men/1.jpg',
    status: 'En ligne'
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ChatComponent
      contact={contact}
      onBack={handleBack}
    />
  );
};

export default ChatPage;