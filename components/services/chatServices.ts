// Fichier: chatService (complet, avec modifications)
import api from './api'; // Votre instance axios
import { Message, Conversation } from '../../app/type/chat';

export const chatService = {
  // Envoyer un message (optionally include clientTempId for optimistic matching)
  sendMessage: async (
    receiverId: number,
    content: string,
    parkingId?: number,
    clientTempId?: string
  ) => {
    const payload: any = { receiverId, content, parkingId };
    if (clientTempId) payload.clientTempId = clientTempId;
    return api.post<Message>('/messages', payload);
  },

  // Récupérer une conversation
  getConversation: async (userId: number, parkingId?: number, page: number = 1, pageSize: number = 20) => {
    let url = `/messages/conversation/${userId}?page=${page}&pageSize=${pageSize}`;
    if (parkingId !== undefined) {
      url += `&parkingId=${parkingId}`;
    }
    return api.get(url);
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