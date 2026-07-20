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
      detection_versions: {
        Row: {
          changed_at: string
          changed_fields: string[]
          detection_id: string
          id: string
          next: Json
          previous: Json
          user_id: string
        }
        Insert: {
          changed_at?: string
          changed_fields?: string[]
          detection_id: string
          id?: string
          next?: Json
          previous?: Json
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_fields?: string[]
          detection_id?: string
          id?: string
          next?: Json
          previous?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detection_versions_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "detections"
            referencedColumns: ["id"]
          },
        ]
      }
      detections: {
        Row: {
          confidence: number
          created_at: string
          crop: string
          description: string | null
          disease: string
          farm_id: string | null
          gps: string | null
          id: string
          image_url: string | null
          input_mode: string | null
          lat: number | null
          lng: number | null
          model: string | null
          prevention: string | null
          rag_docs_used: number | null
          rank: number
          scan_id: string | null
          severity: string
          symptoms: string | null
          treatment: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          crop: string
          description?: string | null
          disease: string
          farm_id?: string | null
          gps?: string | null
          id?: string
          image_url?: string | null
          input_mode?: string | null
          lat?: number | null
          lng?: number | null
          model?: string | null
          prevention?: string | null
          rag_docs_used?: number | null
          rank?: number
          scan_id?: string | null
          severity: string
          symptoms?: string | null
          treatment?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          crop?: string
          description?: string | null
          disease?: string
          farm_id?: string | null
          gps?: string | null
          id?: string
          image_url?: string | null
          input_mode?: string | null
          lat?: number | null
          lng?: number | null
          model?: string | null
          prevention?: string | null
          rag_docs_used?: number | null
          rank?: number
          scan_id?: string | null
          severity?: string
          symptoms?: string | null
          treatment?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detections_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_docs: {
        Row: {
          content: string
          created_at: string
          crop: string | null
          id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          crop?: string | null
          id?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          crop?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      farms: {
        Row: {
          created_at: string
          crop_types: string[] | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          crop_types?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          crop_types?: string[] | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id: string
          name: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tts_audit_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          status_code: number
          text_length: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          status_code: number
          text_length?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          status_code?: number
          text_length?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "extension_officer" | "farmer"
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
      app_role: ["admin", "extension_officer", "farmer"],
    },
  },
} as const
