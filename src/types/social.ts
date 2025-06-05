
<<<<<<< HEAD
=======
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  read_at?: string;
  attachment_url?: string;
  deleted_by_recipient?: boolean;
  message_status: 'sending' | 'sent' | 'delivered' | 'read';
  edited_at?: string;
  delivered_at?: string;
  edit_history?: EditHistory[];
  reply_to_id?: string;
  deleted_at?: string;
  is_soft_deleted?: boolean;
  sender_username?: string;
  sender_avatar_url?: string;
}

export interface EditHistory {
  content: string;
  edited_at: string;
}

>>>>>>> a54c83b6aeb620917159af6bd1e06b32ec0fcdef
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

<<<<<<< HEAD
// Re-export Message and related types from the messages module
export type { Message, EditHistory, ChatUser } from "@/hooks/messages/types";
=======
export interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  last_message?: Message;
  unread_count: number;
  presence?: UserPresence;
  is_typing?: boolean;
}
>>>>>>> a54c83b6aeb620917159af6bd1e06b32ec0fcdef
