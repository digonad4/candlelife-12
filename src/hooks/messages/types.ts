
import { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  deleted_by_recipient: boolean;
  sender_username?: string;
  sender_avatar_url?: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

export interface ChatUser {
  id: string;
  username: string;
  avatar_url: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_online?: boolean;
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

export interface MessagesContextValue {
  user: User | null;
}

export const MessagesContext = createContext<MessagesContextValue>({ user: null });

export const useMessagesContext = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessagesContext must be used within a MessagesProvider");
  }
  return context;
};
