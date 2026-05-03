export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      brand_kits: {
        Row: {
          created_at: string;
          font_family: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          primary_color: string | null;
          secondary_color: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          font_family?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          secondary_color?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          font_family?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          secondary_color?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_kits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      copy_cache: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          language: string;
          tone: string;
          use_count: number;
          variants: Json;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          language: string;
          tone: string;
          use_count?: number;
          variants: Json;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          language?: string;
          tone?: string;
          use_count?: number;
          variants?: Json;
        };
        Relationships: [];
      };
      generations: {
        Row: {
          bg_removed_url: string | null;
          copy_variants: Json | null;
          created_at: string;
          error_message: string | null;
          format: string;
          id: string;
          input_type: string;
          input_url: string | null;
          language: string;
          meta: Json;
          product_desc: string | null;
          product_image_url: string | null;
          product_name: string | null;
          selected_variant: number | null;
          status: string;
          template_id: string | null;
          user_id: string;
        };
        Insert: {
          bg_removed_url?: string | null;
          copy_variants?: Json | null;
          created_at?: string;
          error_message?: string | null;
          format: string;
          id?: string;
          input_type: string;
          input_url?: string | null;
          language: string;
          meta?: Json;
          product_desc?: string | null;
          product_image_url?: string | null;
          product_name?: string | null;
          selected_variant?: number | null;
          status?: string;
          template_id?: string | null;
          user_id: string;
        };
        Update: {
          bg_removed_url?: string | null;
          copy_variants?: Json | null;
          created_at?: string;
          error_message?: string | null;
          format?: string;
          id?: string;
          input_type?: string;
          input_url?: string | null;
          language?: string;
          meta?: Json;
          product_desc?: string | null;
          product_image_url?: string | null;
          product_name?: string | null;
          selected_variant?: number | null;
          status?: string;
          template_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generations_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      image_cache: {
        Row: {
          bg_removed_url: string;
          created_at: string;
          hit_count: number;
          original_size_bytes: number | null;
          phash: string;
        };
        Insert: {
          bg_removed_url: string;
          created_at?: string;
          hit_count?: number;
          original_size_bytes?: number | null;
          phash: string;
        };
        Update: {
          bg_removed_url?: string;
          created_at?: string;
          hit_count?: number;
          original_size_bytes?: number | null;
          phash?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          generation_count: number;
          id: string;
          monthly_reset_at: string;
          plan: string;
          razorpay_customer_id: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          generation_count?: number;
          id: string;
          monthly_reset_at?: string;
          plan?: string;
          razorpay_customer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          generation_count?: number;
          id?: string;
          monthly_reset_at?: string;
          plan?: string;
          razorpay_customer_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan: string;
          razorpay_plan_id: string | null;
          razorpay_subscription_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan: string;
          razorpay_plan_id?: string | null;
          razorpay_subscription_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan?: string;
          razorpay_plan_id?: string | null;
          razorpay_subscription_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          category: string;
          config: Json;
          created_at: string;
          creatomate_template_id: string | null;
          formats: string[];
          id: string;
          is_active: boolean;
          is_video: boolean;
          name: string;
          preview_url: string | null;
        };
        Insert: {
          category: string;
          config: Json;
          created_at?: string;
          creatomate_template_id?: string | null;
          formats: string[];
          id: string;
          is_active?: boolean;
          is_video?: boolean;
          name: string;
          preview_url?: string | null;
        };
        Update: {
          category?: string;
          config?: Json;
          created_at?: string;
          creatomate_template_id?: string | null;
          formats?: string[];
          id?: string;
          is_active?: boolean;
          is_video?: boolean;
          name?: string;
          preview_url?: string | null;
        };
        Relationships: [];
      };
      whatsapp_sessions: {
        Row: {
          format: string | null;
          input_image_url: string | null;
          language: string | null;
          last_activity: string;
          phone_number: string;
          step: string;
          user_id: string | null;
        };
        Insert: {
          format?: string | null;
          input_image_url?: string | null;
          language?: string | null;
          last_activity?: string;
          phone_number: string;
          step?: string;
          user_id?: string | null;
        };
        Update: {
          format?: string | null;
          input_image_url?: string | null;
          language?: string | null;
          last_activity?: string;
          phone_number?: string;
          step?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      evict_stale_image_cache: { Args: { days_old?: number }; Returns: number };
      increment_copy_cache_use: {
        Args: { cache_id: string };
        Returns: undefined;
      };
      increment_image_cache_hit: {
        Args: { p_phash: string };
        Returns: undefined;
      };
      reset_monthly_quotas: { Args: never; Returns: number };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
