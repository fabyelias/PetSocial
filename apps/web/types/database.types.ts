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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: 'pets_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'posts_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'post_media_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_following_id_fkey';
            columns: ['following_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'likes_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          pet_a_id: string;
          pet_b_id: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pet_a_id: string;
          pet_b_id: string;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          pet_a_id?: string;
          pet_b_id?: string;
          last_message_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_pet_a_id_fkey';
            columns: ['pet_a_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_pet_b_id_fkey';
            columns: ['pet_b_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_pet_id: string;
          receiver_pet_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_pet_id: string;
          receiver_pet_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          conversation_id?: string;
          sender_pet_id?: string;
          receiver_pet_id?: string;
          content?: string;
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_pet_id_fkey';
            columns: ['sender_pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_receiver_pet_id_fkey';
            columns: ['receiver_pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'bookmarks_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookmarks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
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
