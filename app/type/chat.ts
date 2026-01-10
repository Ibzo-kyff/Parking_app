export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  parkingId?: number;
  read: boolean;
  createdAt: string;
  deletedAt?: string;
  clientTempId?: string;
  status?: 'sending' | 'sent' | 'failed';
  sender?: {
    image: string | null | undefined;
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: 'CLIENT' | 'PARKING';
  };
  receiver?: {
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

export interface ConversationItem {
  user: {
    id: number;
    nom: string;
    prenom: string;
    image?: string | null;
    role: 'CLIENT' | 'PARKING';
  };
  lastMessage: Message;
}

export type ConversationList = ConversationItem[];

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