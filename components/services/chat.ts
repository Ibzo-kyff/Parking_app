// services/chatService.ts
import { apiService } from './profileApi';

export interface MessagePayload {
  receiverId: number;
  content: string;
  parkingId?: number; // ID du parking pour les conversations de parking
}

export interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  parkingId?: number;
  read?: boolean;
  createdAt: string;
  updatedAt?: string;
  sender: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    image?: string;
  };
  receiver: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    image?: string;
  };
  parking?: {
    id: number;
    name: string;
    logo?: string;
    city?: string;
  };
}

export interface Conversation {
  [userId: number]: Message[];
}

export interface StructuredConversation {
  id: string;
  type: 'user' | 'parking';
  targetUser?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    image?: string;
    role: string;
  };
  parking?: {
    id: number;
    name: string;
    logo?: string;
    city: string;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

// Méthode pour tester la connectivité API
const testApiConnectivity = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('https://parkapp-pi.vercel.app/api/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('🔍 Test API Connectivity:', { status: response.status, ok: response.ok });
    return response.ok;
  } catch (error) {
    console.error('❌ Test API Connectivity failed:', error);
    return false;
  }
};

// Fonction de test spécifique pour les messages
export const testChatConnectivity = async (token: string): Promise<boolean> => {
  try {
    console.log('🔍 Test de connectivité chat...');
    const response = await apiService.authenticatedRequest<any[]>('/messages/conversations', token, {
      method: 'GET',
    });
    console.log('✅ Chat accessible:', response);
    return true;
  } catch (error) {
    console.error('❌ Chat non accessible:', error);
    return false;
  }
};

export const chatService = {
  // Récupérer une conversation (utilisateur ou parking)
  getConversation: async (token: string, otherUserId: number): Promise<Message[]> => {
    return apiService.authenticatedRequest<Message[]>(`/messages/conversation/${otherUserId}`, token, {
      method: 'GET',
    });
  },

  // Récupérer la conversation avec un parking spécifique
  getParkingConversation: async (token: string, parkingId: number): Promise<Message[]> => {
    return apiService.authenticatedRequest<Message[]>(`/messages/parking/${parkingId}`, token, {
      method: 'GET',
    });
  },

  // Récupérer la conversation avec un utilisateur spécifique
  getUserConversation: async (token: string, userId: number): Promise<Message[]> => {
    return apiService.authenticatedRequest<Message[]>(`/messages/user/${userId}`, token, {
      method: 'GET',
    });
  },

  // Envoyer un message
  sendMessage: async (token: string, payload: MessagePayload): Promise<Message> => {
    console.log('🔵 chatService.sendMessage appelé:', { 
      token: token ? 'présent' : 'manquant', 
      payload,
      endpoint: '/messages'
    });
    
    // Test de connectivité avant d'envoyer le message
    const isConnected = await testApiConnectivity(token);
    if (!isConnected) {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    
    try {
      const result = await apiService.authenticatedRequest<Message>('/messages', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('✅ chatService.sendMessage succès:', result);
      return result;
    } catch (error) {
      console.error('❌ chatService.sendMessage erreur:', error);
      throw error;
    }
  },

  // Récupérer toutes les conversations
  getConversations: async (token: string): Promise<StructuredConversation[]> => {
    return apiService.authenticatedRequest<StructuredConversation[]>('/messages/conversations', token, {
      method: 'GET',
    });
  },

  // Marquer les messages comme lus
  markMessagesAsRead: async (token: string, conversationId: string, type: 'user' | 'parking'): Promise<void> => {
    return apiService.authenticatedRequest<void>('/messages/mark-read', token, {
      method: 'POST',
      body: JSON.stringify({ conversationId, type }),
    });
  },

  // Mettre à jour un message
  updateMessage: async (token: string, messageId: number, content: string): Promise<Message> => {
    return apiService.authenticatedRequest<Message>(`/messages/${messageId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  // Supprimer un message
  deleteMessage: async (token: string, messageId: number): Promise<{ message: string }> => {
    return apiService.authenticatedRequest<{ message: string }>(`/messages/${messageId}`, token, {
      method: 'DELETE',
    });
  },
};

export default chatService;