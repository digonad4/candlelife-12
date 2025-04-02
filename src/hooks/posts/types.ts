
import { User } from "@supabase/supabase-js";

export type Post = {
  id: string;
  content: string;
  user_id: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  comments_count?: number;
};

export type Comment = {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

export type QueryOptions = {
  retry: number;
  retryDelay: (attemptIndex: number) => number;
};

export const defaultQueryOptions: QueryOptions = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};
