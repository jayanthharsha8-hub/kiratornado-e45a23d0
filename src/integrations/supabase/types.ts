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
      bans: {
        Row: {
          banned_by: string
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      category_card_images: {
        Row: {
          card_image_url: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at: string
          event_label: string | null
          id: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          card_image_url?: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          event_label?: string | null
          id?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          card_image_url?: string | null
          category?: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          event_label?: string | null
          id?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          id: string
          is_bot: boolean
          player_level: number
          player_name: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_bot?: boolean
          player_level?: number
          player_name: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_bot?: boolean
          player_level?: number
          player_name?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      home_banners: {
        Row: {
          active: boolean
          button_link: string | null
          button_text: string | null
          created_at: string
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_offers: {
        Row: {
          active: boolean
          badge_label: string | null
          created_at: string
          id: string
          image_url: string | null
          link: string | null
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_label?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_label?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_popups: {
        Row: {
          active: boolean
          button_text: string | null
          created_at: string
          id: string
          image_url: string | null
          link: string | null
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          button_text?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          created_at: string
          id: string
          kills: number
          player_name: string
          rank_label: string
          rank_position: number
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          kills?: number
          player_name: string
          rank_label?: string
          rank_position?: number
          updated_at?: string
          week_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          kills?: number
          player_name?: string
          rank_label?: string
          rank_position?: number
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      leaderboard_rewards: {
        Row: {
          coins: number
          created_at: string
          id: string
          rank_position: number
          updated_at: string
        }
        Insert: {
          coins?: number
          created_at?: string
          id?: string
          rank_position: number
          updated_at?: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          rank_position?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      profile_avatars: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          label: string | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          label?: string | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          label?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bonus_coins: number
          coins: number
          created_at: string
          ff_uid: string
          id: string
          is_banned: boolean
          matches_played: number
          player_level: number
          player_name: string
          profile_completed: boolean
          referral_code: string | null
          total_kills: number
          updated_at: string
          username: string
          wins: number
        }
        Insert: {
          avatar_url?: string | null
          bonus_coins?: number
          coins?: number
          created_at?: string
          ff_uid: string
          id: string
          is_banned?: boolean
          matches_played?: number
          player_level?: number
          player_name: string
          profile_completed?: boolean
          referral_code?: string | null
          total_kills?: number
          updated_at?: string
          username: string
          wins?: number
        }
        Update: {
          avatar_url?: string | null
          bonus_coins?: number
          coins?: number
          created_at?: string
          ff_uid?: string
          id?: string
          is_banned?: boolean
          matches_played?: number
          player_level?: number
          player_name?: string
          profile_completed?: boolean
          referral_code?: string | null
          total_kills?: number
          updated_at?: string
          username?: string
          wins?: number
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          id: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
      }
      tournament_banners: {
        Row: {
          banner_image_url: string | null
          created_at: string
          id: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          id?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          id?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_page_banners: {
        Row: {
          banner_image_url: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          category?: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_rooms: {
        Row: {
          room_id: string | null
          room_password: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          room_id?: string | null
          room_password?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          room_id?: string | null
          room_password?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rooms_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at: string
          entry_fee: number
          id: string
          joined_players_count: number
          level_requirement: number
          notes: string | null
          prize_pool: number
          published: boolean
          scheduled_at: string
          status: Database["public"]["Enums"]["tournament_status"]
          subtitle: string | null
          title: string
          total_slots: number
        }
        Insert: {
          banner_url?: string | null
          category: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          entry_fee?: number
          id?: string
          joined_players_count?: number
          level_requirement?: number
          notes?: string | null
          prize_pool?: number
          published?: boolean
          scheduled_at: string
          status?: Database["public"]["Enums"]["tournament_status"]
          subtitle?: string | null
          title: string
          total_slots: number
        }
        Update: {
          banner_url?: string | null
          category?: Database["public"]["Enums"]["tournament_category"]
          created_at?: string
          entry_fee?: number
          id?: string
          joined_players_count?: number
          level_requirement?: number
          notes?: string | null
          prize_pool?: number
          published?: boolean
          scheduled_at?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          subtitle?: string | null
          title?: string
          total_slots?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string
          reference_id: string | null
          reference_type: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["wallet_request_status"]
          type: Database["public"]["Enums"]["wallet_request_type"]
          upi_id: string | null
          upi_ref: string | null
          user_id: string
          withdraw_type: Database["public"]["Enums"]["withdraw_type"] | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["wallet_request_status"]
          type: Database["public"]["Enums"]["wallet_request_type"]
          upi_id?: string | null
          upi_ref?: string | null
          user_id: string
          withdraw_type?: Database["public"]["Enums"]["withdraw_type"] | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["wallet_request_status"]
          type?: Database["public"]["Enums"]["wallet_request_type"]
          upi_id?: string | null
          upi_ref?: string | null
          user_id?: string
          withdraw_type?: Database["public"]["Enums"]["withdraw_type"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_coins: {
        Args: { _amount: number; _direction: number; _user_id: string }
        Returns: Json
      }
      admin_handle_wallet_request: {
        Args: {
          _request_id: string
          _status: Database["public"]["Enums"]["wallet_request_status"]
        }
        Returns: Json
      }
      ensure_player_account: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_tournament: { Args: { _tournament_id: string }; Returns: Json }
      request_withdrawal: {
        Args: {
          _amount: number
          _upi_id?: string
          _upi_ref?: string
          _withdraw_type: Database["public"]["Enums"]["withdraw_type"]
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      report_reason: "hacker" | "fake" | "wrong_uid" | "misconduct"
      report_status: "pending" | "reviewed" | "actioned" | "ignored"
      tournament_category:
        | "free_match"
        | "battle_royale"
        | "classic_squad"
        | "lone_wolf"
        | "custom_rooms"
        | "weekly_rankings"
      tournament_status: "upcoming" | "live" | "completed" | "cancelled"
      wallet_request_status: "pending" | "approved" | "rejected"
      wallet_request_type: "add" | "withdraw"
      withdraw_type: "redeem" | "upi"
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
    Enums: {
      app_role: ["admin", "user"],
      report_reason: ["hacker", "fake", "wrong_uid", "misconduct"],
      report_status: ["pending", "reviewed", "actioned", "ignored"],
      tournament_category: [
        "free_match",
        "battle_royale",
        "classic_squad",
        "lone_wolf",
        "custom_rooms",
        "weekly_rankings",
      ],
      tournament_status: ["upcoming", "live", "completed", "cancelled"],
      wallet_request_status: ["pending", "approved", "rejected"],
      wallet_request_type: ["add", "withdraw"],
      withdraw_type: ["redeem", "upi"],
    },
  },
} as const
