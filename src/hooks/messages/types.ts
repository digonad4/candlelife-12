
import { useAuth } from "@/context/AuthContext";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  deleted_by_recipient?: boolean;
  attachment_url?: string;
  // Campos adicionais para exibição
  sender_username?: string;
  sender_avatar_url?: string;
}

export interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

export interface PaginatedMessages {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
}

export interface UserTypingStatus {
  userId: string;
  recipientId: string;
  isTyping: boolean;
  lastTyped: Date;
}

export const useMessagesContext = () => {
  const { user } = useAuth();
  return { user };
};
