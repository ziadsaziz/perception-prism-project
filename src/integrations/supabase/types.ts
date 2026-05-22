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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advisor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          ai_reflection: string | null
          confidence_level: number | null
          created_at: string
          date: string | null
          id: string
          mood: string | null
          move_completed: boolean | null
          social_energy: number | null
          user_id: string
          what_happened: string | null
        }
        Insert: {
          ai_reflection?: string | null
          confidence_level?: number | null
          created_at?: string
          date?: string | null
          id?: string
          mood?: string | null
          move_completed?: boolean | null
          social_energy?: number | null
          user_id: string
          what_happened?: string | null
        }
        Update: {
          ai_reflection?: string | null
          confidence_level?: number | null
          created_at?: string
          date?: string | null
          id?: string
          mood?: string | null
          move_completed?: boolean | null
          social_energy?: number | null
          user_id?: string
          what_happened?: string | null
        }
        Relationships: []
      }
      daily_reads: {
        Row: {
          created_at: string
          date: string
          id: string
          mission: string
          read: string
          seen: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mission: string
          read: string
          seen?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mission?: string
          read?: string
          seen?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      mirror_feed: {
        Row: {
          body: string | null
          created_at: string
          headline: string
          id: string
          read: boolean | null
          scan_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          headline: string
          id?: string
          read?: boolean | null
          scan_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          headline?: string
          id?: string
          read?: boolean | null
          scan_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mirror_feed_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      mirror_memory: {
        Row: {
          created_at: string
          id: string
          memory_text: string
          memory_type: string | null
          strength: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_text: string
          memory_type?: string | null
          strength?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_text?: string
          memory_type?: string | null
          strength?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patterns: {
        Row: {
          created_at: string
          evidence: string | null
          fix: string | null
          frequency: number | null
          id: string
          impact: string | null
          last_seen: string | null
          pattern_description: string | null
          pattern_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence?: string | null
          fix?: string | null
          frequency?: number | null
          id?: string
          impact?: string | null
          last_seen?: string | null
          pattern_description?: string | null
          pattern_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence?: string | null
          fix?: string | null
          frequency?: number | null
          id?: string
          impact?: string | null
          last_seen?: string | null
          pattern_description?: string | null
          pattern_name?: string
          user_id?: string
        }
        Relationships: []
      }
      perception_scores: {
        Row: {
          approachability_score: number | null
          attraction_score: number | null
          authenticity_score: number | null
          authority_score: number | null
          confidence_score: number | null
          created_at: string
          emotional_control_score: number | null
          id: string
          mirror_score: number | null
          mystery_score: number | null
          perception_score: number | null
          user_id: string
        }
        Insert: {
          approachability_score?: number | null
          attraction_score?: number | null
          authenticity_score?: number | null
          authority_score?: number | null
          confidence_score?: number | null
          created_at?: string
          emotional_control_score?: number | null
          id?: string
          mirror_score?: number | null
          mystery_score?: number | null
          perception_score?: number | null
          user_id: string
        }
        Update: {
          approachability_score?: number | null
          attraction_score?: number | null
          authenticity_score?: number | null
          authority_score?: number | null
          confidence_score?: number | null
          created_at?: string
          emotional_control_score?: number | null
          id?: string
          mirror_score?: number | null
          mystery_score?: number | null
          perception_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          baseline_read: string | null
          biggest_insecurity: string | null
          comfort_level: string | null
          created_at: string
          dating_challenge: string | null
          gender: string | null
          id: string
          main_goal: string | null
          name: string | null
          onboarding_complete: boolean | null
          social_challenge: string | null
          tone_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          baseline_read?: string | null
          biggest_insecurity?: string | null
          comfort_level?: string | null
          created_at?: string
          dating_challenge?: string | null
          gender?: string | null
          id?: string
          main_goal?: string | null
          name?: string | null
          onboarding_complete?: boolean | null
          social_challenge?: string | null
          tone_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          baseline_read?: string | null
          biggest_insecurity?: string | null
          comfort_level?: string | null
          created_at?: string
          dating_challenge?: string | null
          gender?: string | null
          id?: string
          main_goal?: string | null
          name?: string | null
          onboarding_complete?: boolean | null
          social_challenge?: string | null
          tone_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          ai_summary: string | null
          created_at: string
          file_url: string | null
          id: string
          input_text: string | null
          result_json: Json | null
          scan_type: string
          score_json: Json | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          input_text?: string | null
          result_json?: Json | null
          scan_type: string
          score_json?: Json | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          input_text?: string | null
          result_json?: Json | null
          scan_type?: string
          score_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          blind_spot: string | null
          created_at: string
          dominant_pattern: string | null
          full_report: string
          id: string
          perception_shift: string | null
          score_delta: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          blind_spot?: string | null
          created_at?: string
          dominant_pattern?: string | null
          full_report: string
          id?: string
          perception_shift?: string | null
          score_delta?: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          blind_spot?: string | null
          created_at?: string
          dominant_pattern?: string | null
          full_report?: string
          id?: string
          perception_shift?: string | null
          score_delta?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_mirror_score: {
        Args: {
          approachability: number
          attraction: number
          authenticity: number
          authority: number
          confidence: number
          emotional_control: number
          mystery: number
          perception: number
        }
        Returns: number
      }
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
