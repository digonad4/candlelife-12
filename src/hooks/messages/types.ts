
import { useAuth } from "@/context/AuthContext";

export type Message = {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  deleted_by_recipient: boolean;
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
