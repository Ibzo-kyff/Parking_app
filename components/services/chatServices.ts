import api from './api'; // Votre instance axios
import { Message, Conversation } from '../../app/type/chat';
export const chatService = {
  // Envoyer un message
  sendMessage: async (receiverId: number, content: string, parkingId?: number) => {
    return api.post<Message>('/messages', { receiverId, content, parkingId });
  },

  // Récupérer une conversation
  getConversation: async (userId: number, page: number = 1, pageSize: number = 20) => {
    return api.get(`/messages/conversation/${userId}?page=${page}&pageSize=${pageSize}`);
  },

  // Récupérer toutes les conversations
  getConversations: async () => {
    return api.get<Conversation>('/messages/conversations');
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
    return api.put(`/messages/${messageId}/read`);
  },
};

export { Message };
