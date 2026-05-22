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
          checkin_completed: boolean | null
          confidence_level: number | null
          created_at: string
          date: string | null
          energy_level: number | null
          id: string
          mood: string | null
          move_completed: boolean | null
          social_energy: number | null
          user_id: string
          what_happened: string | null
        }
        Insert: {
          ai_reflection?: string | null
          checkin_completed?: boolean | null
          confidence_level?: number | null
          created_at?: string
          date?: string | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          move_completed?: boolean | null
          social_energy?: number | null
          user_id: string
          what_happened?: string | null
        }
        Update: {
          ai_reflection?: string | null
          checkin_completed?: boolean | null
          confidence_level?: number | null
          created_at?: string
          date?: string | null
          energy_level?: number | null
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
      dossier: {
        Row: {
          archetype_description: string | null
          classification_level: string | null
          core_signal: string | null
          dominant_pattern: string | null
          full_assessment: string | null
          generated_at: string
          id: string
          perception_trajectory: string | null
          recurring_blind_spot: string | null
          relationship_pattern: string | null
          risk_profile: string | null
          social_archetype: string | null
          strength_profile: string | null
          user_id: string
        }
        Insert: {
          archetype_description?: string | null
          classification_level?: string | null
          core_signal?: string | null
          dominant_pattern?: string | null
          full_assessment?: string | null
          generated_at?: string
          id?: string
          perception_trajectory?: string | null
          recurring_blind_spot?: string | null
          relationship_pattern?: string | null
          risk_profile?: string | null
          social_archetype?: string | null
          strength_profile?: string | null
          user_id: string
        }
        Update: {
          archetype_description?: string | null
          classification_level?: string | null
          core_signal?: string | null
          dominant_pattern?: string | null
          full_assessment?: string | null
          generated_at?: string
          id?: string
          perception_trajectory?: string | null
          recurring_blind_spot?: string | null
          relationship_pattern?: string | null
          risk_profile?: string | null
          social_archetype?: string | null
          strength_profile?: string | null
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
      platform_benchmarks: {
        Row: {
          avg_value: number
          id: string
          metric: string
          p25_value: number
          p50_value: number
          p75_value: number
          p90_value: number
          sample_count: number
          updated_at: string
        }
        Insert: {
          avg_value: number
          id?: string
          metric: string
          p25_value: number
          p50_value: number
          p75_value: number
          p90_value: number
          sample_count: number
          updated_at?: string
        }
        Update: {
          avg_value?: number
          id?: string
          metric?: string
          p25_value?: number
          p50_value?: number
          p75_value?: number
          p90_value?: number
          sample_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          category: string
          created_at: string
          id: string
          outcome: string | null
          outcome_note: string | null
          prediction: string
          reasoning: string | null
          timeframe: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          outcome?: string | null
          outcome_note?: string | null
          prediction: string
          reasoning?: string | null
          timeframe: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          outcome?: string | null
          outcome_note?: string | null
          prediction?: string
          reasoning?: string | null
          timeframe?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          baseline_read: string | null
          biggest_insecurity: string | null
          bonus_scans: number | null
          comfort_level: string | null
          created_at: string
          current_streak: number | null
          dating_challenge: string | null
          gender: string | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          main_goal: string | null
          name: string | null
          onboarding_complete: boolean | null
          referral_code: string | null
          referred_by: string | null
          social_challenge: string | null
          tone_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          baseline_read?: string | null
          biggest_insecurity?: string | null
          bonus_scans?: number | null
          comfort_level?: string | null
          created_at?: string
          current_streak?: number | null
          dating_challenge?: string | null
          gender?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          main_goal?: string | null
          name?: string | null
          onboarding_complete?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          social_challenge?: string | null
          tone_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          baseline_read?: string | null
          biggest_insecurity?: string | null
          bonus_scans?: number | null
          comfort_level?: string | null
          created_at?: string
          current_streak?: number | null
          dating_challenge?: string | null
          gender?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          main_goal?: string | null
          name?: string | null
          onboarding_complete?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          social_challenge?: string | null
          tone_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_granted: boolean | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          bonus_granted?: boolean | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          bonus_granted?: boolean | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
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
      apply_referral: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: boolean
      }
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
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      refresh_platform_benchmarks: { Args: never; Returns: undefined }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
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
