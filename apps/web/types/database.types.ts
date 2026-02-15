export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'moderator' | 'admin';
          status: 'pending' | 'active' | 'suspended' | 'deleted';
          email_verified_at: string | null;
          last_login: string | null;
          last_active: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'moderator' | 'admin';
          status?: 'pending' | 'active' | 'suspended' | 'deleted';
          email_verified_at?: string | null;
          last_login?: string | null;
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'moderator' | 'admin';
          status?: 'pending' | 'active' | 'suspended' | 'deleted';
          email_verified_at?: string | null;
          last_login?: string | null;
          last_active?: string | null;
          updated_at?: string;
        };
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
          breed: string | null;
          bio: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          birth_date: string | null;
          city: string | null;
          country: string | null;
          is_active: boolean;
          is_verified: boolean;
          followers_count: number;
          following_count: number;
          posts_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
          breed?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          birth_date?: string | null;
          city?: string | null;
          country?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          name?: string;
          species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
          breed?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          birth_date?: string | null;
          city?: string | null;
          country?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          pet_id: string;
          caption: string | null;
          visibility: 'public' | 'followers' | 'private';
          likes_count: number;
          comments_count: number;
          shares_count: number;
          engagement_score: number;
          is_hidden: boolean;
          hidden_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pet_id: string;
          caption?: string | null;
          visibility?: 'public' | 'followers' | 'private';
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          engagement_score?: number;
          is_hidden?: boolean;
          hidden_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pet_id?: string;
          caption?: string | null;
          visibility?: 'public' | 'followers' | 'private';
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          engagement_score?: number;
          is_hidden?: boolean;
          hidden_reason?: string | null;
          updated_at?: string;
        };
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          type: 'image' | 'video';
          url: string;
          thumbnail_url: string | null;
          width: number | null;
          height: number | null;
          duration: number | null;
          file_size: number | null;
          mime_type: string | null;
          position: number;
          is_processed: boolean;
          processing_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          type: 'image' | 'video';
          url: string;
          thumbnail_url?: string | null;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          file_size?: number | null;
          mime_type?: string | null;
          position?: number;
          is_processed?: boolean;
          processing_error?: string | null;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          type?: 'image' | 'video';
          url?: string;
          thumbnail_url?: string | null;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          file_size?: number | null;
          mime_type?: string | null;
          position?: number;
          is_processed?: boolean;
          processing_error?: string | null;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
        };
      };
      likes: {
        Row: {
          pet_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          pet_id?: string;
          post_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          pet_id: string;
          parent_id: string | null;
          content: string;
          likes_count: number;
          replies_count: number;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          pet_id: string;
          parent_id?: string | null;
          content: string;
          likes_count?: number;
          replies_count?: number;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          post_id?: string;
          pet_id?: string;
          parent_id?: string | null;
          content?: string;
          likes_count?: number;
          replies_count?: number;
          is_hidden?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      bookmarks: {
        Row: {
          pet_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          pet_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          pet_id?: string;
          post_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_pet_owner: {
        Args: { pet_id: string };
        Returns: boolean;
      };
      is_following: {
        Args: { follower: string; target: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'user' | 'moderator' | 'admin';
      user_status: 'pending' | 'active' | 'suspended' | 'deleted';
      pet_species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other';
      post_visibility: 'public' | 'followers' | 'private';
      media_type: 'image' | 'video';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
