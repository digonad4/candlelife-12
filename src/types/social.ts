
export interface UserPresence {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_conversation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TypingStatus {
  id: string;
  user_id: string;
  conversation_with_user_id: string;
  is_typing: boolean;
  last_typed: string;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  read_receipts: boolean;
  show_online_status: boolean;
  do_not_disturb: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  device_info?: string;
  created_at: string;
  updated_at: string;
}

// Re-export Message and related types from the messages module
export type { Message, EditHistory, ChatUser } from "@/hooks/messages/types";
