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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      backtests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          max_drawdown: number | null
          name: string
          results: Json | null
          sharpe_ratio: number | null
          start_date: string
          strategy_config: Json
          symbol: string
          total_return: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          max_drawdown?: number | null
          name: string
          results?: Json | null
          sharpe_ratio?: number | null
          start_date: string
          strategy_config: Json
          symbol: string
          total_return?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          max_drawdown?: number | null
          name?: string
          results?: Json | null
          sharpe_ratio?: number | null
          start_date?: string
          strategy_config?: Json
          symbol?: string
          total_return?: number | null
          user_id?: string
        }
        Relationships: []
      }
      market_data_configs: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      metatrader_accounts: {
        Row: {
          account_name: string
          account_number: string
          created_at: string | null
          id: string
          is_active: boolean | null
          platform_type: string
          server: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_type: string
          server: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_type?: string
          server?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      paper_trading_accounts: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          name: string
          starting_balance: number
          total_pnl: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id?: string
          name: string
          starting_balance?: number
          total_pnl?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          name?: string
          starting_balance?: number
          total_pnl?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_trading_positions: {
        Row: {
          account_id: string
          closed_at: string | null
          created_at: string
          current_price: number | null
          entry_price: number
          id: string
          pnl: number | null
          quantity: number
          status: string
          symbol: string
        }
        Insert: {
          account_id: string
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          entry_price: number
          id?: string
          pnl?: number | null
          quantity: number
          status?: string
          symbol: string
        }
        Update: {
          account_id?: string
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          entry_price?: number
          id?: string
          pnl?: number | null
          quantity?: number
          status?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trading_positions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "paper_trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_users: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_positions: {
        Row: {
          asset_type: string
          avg_entry_price: number
          created_at: string
          current_price: number | null
          id: string
          quantity: number
          symbol: string
          unrealized_pnl: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          avg_entry_price: number
          created_at?: string
          current_price?: number | null
          id?: string
          quantity: number
          symbol: string
          unrealized_pnl?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          avg_entry_price?: number
          created_at?: string
          current_price?: number | null
          id?: string
          quantity?: number
          symbol?: string
          unrealized_pnl?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          condition: string
          created_at: string
          id: string
          is_active: boolean
          symbol: string
          target_price: number | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          condition: string
          created_at?: string
          id?: string
          is_active?: boolean
          symbol: string
          target_price?: number | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          condition?: string
          created_at?: string
          id?: string
          is_active?: boolean
          symbol?: string
          target_price?: number | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          autotrade_enabled: boolean
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean
          updated_at: string | null
        }
        Insert: {
          autotrade_enabled?: boolean
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string | null
        }
        Update: {
          autotrade_enabled?: boolean
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      strategies: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          action: string
          created_at: string
          entry_date: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          id: string
          notes: string | null
          pnl: number | null
          pnl_percentage: number | null
          quantity: number
          screenshot_url: string | null
          status: string
          strategy: string | null
          symbol: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entry_date?: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          pnl?: number | null
          pnl_percentage?: number | null
          quantity: number
          screenshot_url?: string | null
          status?: string
          strategy?: string | null
          symbol: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entry_date?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          pnl?: number | null
          pnl_percentage?: number | null
          quantity?: number
          screenshot_url?: string | null
          status?: string
          strategy?: string | null
          symbol?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          action: string
          closed_at: string | null
          created_at: string
          entry_price: number
          exit_price: number | null
          id: string
          pnl: number | null
          quantity: number
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          action: string
          closed_at?: string | null
          created_at?: string
          entry_price: number
          exit_price?: number | null
          id?: string
          pnl?: number | null
          quantity: number
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          action?: string
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          pnl?: number | null
          quantity?: number
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          symbol?: string
          user_id?: string
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
