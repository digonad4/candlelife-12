
import { useAuth } from "@/context/AuthContext";

export type Message = {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  deleted_by_recipient: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
  recipient_profile?: {
    username: string;
    avatar_url: string | null;
  };
};

export type ChatUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  unread_count: number;
  last_message?: string;
  last_message_time?: string;
  is_typing?: boolean;
};

export type PaginatedMessages = {
  messages: Message[];
  totalCount: number;
  hasMore: boolean;
};

export const useMessagesContext = () => {
  const { user } = useAuth();
  return { user };
};

// Add new typing status context
export type UserTypingStatus = {
  userId: string;
  recipientId: string; 
  isTyping: boolean;
  lastTyped: Date;
};
