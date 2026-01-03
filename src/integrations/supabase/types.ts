export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
        }
        Relationships: []
      }
      asset_types: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          completion_date: string
          habit_id: string
          id: string
        }
        Insert: {
          completed_at?: string
          completion_date?: string
          habit_id: string
          id?: string
        }
        Update: {
          completed_at?: string
          completion_date?: string
          habit_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string
          custom_days: number[] | null
          frequency_type: string
          goal: string | null
          icon: string | null
          id: string
          name: string
          target_count: number
          target_period: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          custom_days?: number[] | null
          frequency_type: string
          goal?: string | null
          icon?: string | null
          id?: string
          name: string
          target_count?: number
          target_period?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          custom_days?: number[] | null
          frequency_type?: string
          goal?: string | null
          icon?: string | null
          id?: string
          name?: string
          target_count?: number
          target_period?: string
          updated_at?: string
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          amount_invested: number
          created_at: string
          current_value: number
          id: string
          investment_id: string
          transaction_date: string
        }
        Insert: {
          amount_invested: number
          created_at?: string
          current_value: number
          id?: string
          investment_id: string
          transaction_date: string
        }
        Update: {
          amount_invested?: number
          created_at?: string
          current_value?: number
          id?: string
          investment_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          asset_type_id: string
          created_at: string
          id: string
          interest_rate: number | null
          maturity_date: string | null
          name: string
          notes: string | null
          tenure_months: number | null
          updated_at: string
        }
        Insert: {
          asset_type_id: string
          created_at?: string
          id?: string
          interest_rate?: number | null
          maturity_date?: string | null
          name: string
          notes?: string | null
          tenure_months?: number | null
          updated_at?: string
        }
        Update: {
          asset_type_id?: string
          created_at?: string
          id?: string
          interest_rate?: number | null
          maturity_date?: string | null
          name?: string
          notes?: string | null
          tenure_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_asset_type_id_fkey"
            columns: ["asset_type_id"]
            isOneToOne: false
            referencedRelation: "asset_types"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          attachments: string[] | null
          content: string | null
          created_at: string
          date: string
          id: string
          mood: string | null
          rich_content: Json | null
          tags: string[] | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string
          date: string
          id?: string
          mood?: string | null
          rich_content?: Json | null
          tags?: string[] | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string
          date?: string
          id?: string
          mood?: string | null
          rich_content?: Json | null
          tags?: string[] | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      lesson_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lesson_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      movies_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      movies_tv: {
        Row: {
          created_at: string
          custom_category: string | null
          genre: string | null
          id: string
          imdb_score: string | null
          plot: string | null
          poster_url: string | null
          rated: string | null
          release_year: string | null
          rotten_tomatoes_rating: string | null
          title: string
          updated_at: string
          watched: boolean
        }
        Insert: {
          created_at?: string
          custom_category?: string | null
          genre?: string | null
          id?: string
          imdb_score?: string | null
          plot?: string | null
          poster_url?: string | null
          rated?: string | null
          release_year?: string | null
          rotten_tomatoes_rating?: string | null
          title: string
          updated_at?: string
          watched?: boolean
        }
        Update: {
          created_at?: string
          custom_category?: string | null
          genre?: string | null
          id?: string
          imdb_score?: string | null
          plot?: string | null
          poster_url?: string | null
          rated?: string | null
          release_year?: string | null
          rotten_tomatoes_rating?: string | null
          title?: string
          updated_at?: string
          watched?: boolean
        }
        Relationships: []
      }
      note_images: {
        Row: {
          created_at: string
          id: string
          image_name: string | null
          image_size: number | null
          image_url: string
          note_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_name?: string | null
          image_size?: number | null
          image_url: string
          note_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_name?: string | null
          image_size?: number | null
          image_url?: string
          note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_images_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          note_id: string
          tag_id: string
        }
        Insert: {
          note_id: string
          tag_id: string
        }
        Update: {
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          folder: string | null
          id: string
          markdown_content: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          folder?: string | null
          id?: string
          markdown_content?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          folder?: string | null
          id?: string
          markdown_content?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
