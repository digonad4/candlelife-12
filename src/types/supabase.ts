
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          active_theme: string | null
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string
          view_mode: string | null
        }
        Insert: {
          active_theme?: string | null
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username: string
          view_mode?: string | null
        }
        Update: {
          active_theme?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
          view_mode?: string | null
        }
      }
      transactions: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          payment_method: string
          payment_status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          payment_method?: string
          payment_status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          payment_method?: string
          payment_status?: string
          type?: string
          user_id?: string
        }
      }
      user_themes: {
        Row: {
          background_color: string
          created_at: string
          id: string
          primary_color: string
          secondary_color: string
          text_color: string
          theme_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string
          created_at?: string
          id?: string
          primary_color?: string
          secondary_color?: string
          text_color?: string
          theme_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string
          created_at?: string
          id?: string
          primary_color?: string
          secondary_color?: string
          text_color?: string
          theme_name?: string
          updated_at?: string
          user_id?: string
        }
      }
      // Novas tabelas
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          device_info: string
          last_active: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_info: string
          last_active?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_info?: string
          last_active?: string
          created_at?: string
        }
      }
      two_factor_auth: {
        Row: {
          user_id: string
          enabled: boolean
          secret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          enabled?: boolean
          secret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          enabled?: boolean
          secret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
