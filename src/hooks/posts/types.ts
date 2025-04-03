
import { User } from "@supabase/supabase-js";

export type ReactionType = 'like' | 'heart' | 'laugh' | 'wow' | 'sad';

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  comments_count: number;
  reactions: {
    like: number;
    heart: number;
    laugh: number;
    wow: number;
    sad: number;
  };
  my_reaction: ReactionType | null;
  reactions_count: number;
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

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  type: ReactionType;
  created_at: string;
};

export type ReactionResult = {
  postId: string;
  reactionType: ReactionType;
  action: 'added' | 'updated' | 'removed';
  previousType: ReactionType | null;
};

export type ReactionCount = {
  type: ReactionType;
  count: number;
};

export type UserReaction = {
  type: ReactionType | null;
};

export type QueryOptions = {
  retry: number;
  retryDelay: (attemptIndex: number) => number;
};

export const defaultQueryOptions: QueryOptions = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};
