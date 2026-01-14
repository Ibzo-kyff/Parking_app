import api from './api'; // Votre instance axios
import { Message, Conversation, ConversationList } from '../../app/type/chat';
export const chatService = {
  // Envoyer un message
  sendMessage: async (receiverId: number, content: string, parkingId?: number, clientTempId?: string) => {
    return api.post<Message>('/messages', { receiverId, content, parkingId, clientTempId });
  },

  // Récupérer une conversation
  getConversation: async (userId: number, parkingId?: number, page: number = 1, pageSize: number = 20) => {
    let url = `/messages/conversation/${userId}?page=${page}&pageSize=${pageSize}`;
    if (parkingId) url += `&parkingId=${parkingId}`;
    return api.get(url);
  },

  // Récupérer toutes les conversations
  getConversations: async () => {
    return api.get<ConversationList>('/messages/conversations');
  },

  // Mettre à jour un message
  updateMessage: async (messageId: number, content: string) => {
    return api.put(`/messages/${messageId}`, { content });
  },

  // Supprimer un message
  deleteMessage: async (messageId: number) => {
    return api.delete(`/messages/${messageId}`);
  },

  // Marquer comme lu
  markAsRead: async (messageId: number) => {
    return api.patch(`/messages/${messageId}/read`);
  },
};

export { Message };