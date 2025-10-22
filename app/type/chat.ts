export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  parkingId?: number;
  read: boolean;
  createdAt: string;
  deletedAt?: string;
  sender: {
    image: string | null | undefined;
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: 'CLIENT' | 'PARKING';
  };
  receiver: {
    image: string | null | undefined;
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: 'CLIENT' | 'PARKING';
  };
  parking?: {
    id: number;
    nom: string;
  };
}

export interface Conversation {
  [otherUserId: number]: Message[];
}

export interface ConversationSummary {
  id: number;
  nom: string;
  prenom: string;
  role: 'CLIENT' | 'PARKING';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  parkingId?: number;
}