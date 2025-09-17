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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      billboards: {
        Row: {
          contratacion: Json
          created_at: string
          digital: Json | null
          direccion: string
          fotos: string[] | null
          id: string
          lat: number
          lng: number
          medidas: Json
          nombre: string
          owner_id: string
          precio: Json
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          contratacion?: Json
          created_at?: string
          digital?: Json | null
          direccion: string
          fotos?: string[] | null
          id?: string
          lat: number
          lng: number
          medidas?: Json
          nombre: string
          owner_id: string
          precio?: Json
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          contratacion?: Json
          created_at?: string
          digital?: Json | null
          direccion?: string
          fotos?: string[] | null
          id?: string
          lat?: number
          lng?: number
          medidas?: Json
          nombre?: string
          owner_id?: string
          precio?: Json
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      campañas: {
        Row: {
          advertiser_id: string
          created_at: string
          dias_totales: number
          dias_transcurridos: number | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          nombre: string
          presupuesto_total: number
          presupuesto_usado: number | null
          reserva_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          dias_totales: number
          dias_transcurridos?: number | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          nombre: string
          presupuesto_total: number
          presupuesto_usado?: number | null
          reserva_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          dias_totales?: number
          dias_transcurridos?: number | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          nombre?: string
          presupuesto_total?: number
          presupuesto_usado?: number | null
          reserva_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campañas_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "campañas_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          campaña_id: string | null
          created_at: string
          id: string
          leida: boolean | null
          mensaje: string
          reserva_id: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          campaña_id?: string | null
          created_at?: string
          id?: string
          leida?: boolean | null
          mensaje: string
          reserva_id?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          campaña_id?: string | null
          created_at?: string
          id?: string
          leida?: boolean | null
          mensaje?: string
          reserva_id?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_campaña_id_fkey"
            columns: ["campaña_id"]
            isOneToOne: false
            referencedRelation: "campañas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          requested_by: string | null
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          requested_by?: string | null
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          requested_by?: string | null
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_login_at: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"] | null
          suspended_reason: string | null
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"] | null
          suspended_reason?: string | null
          suspended_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"] | null
          suspended_reason?: string | null
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservas: {
        Row: {
          advertiser_id: string
          asset_name: string
          asset_type: string
          config: Json
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          modalidad: string
          owner_id: string
          precio_total: number
          status: string | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          asset_name: string
          asset_type: string
          config?: Json
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          modalidad: string
          owner_id: string
          precio_total: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          asset_name?: string
          asset_type?: string
          config?: Json
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          modalidad?: string
          owner_id?: string
          precio_total?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["permission"]
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      superadmin_password_resets: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          requested_by: string | null
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          requested_by?: string | null
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          requested_by?: string | null
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      superadmin_permissions: {
        Row: {
          id: string
          permission: string
          role: string
        }
        Insert: {
          id?: string
          permission: string
          role: string
        }
        Update: {
          id?: string
          permission?: string
          role?: string
        }
        Relationships: []
      }
      superadmin_user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      superadmins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_activity: string | null
          last_login_at: string | null
          name: string | null
          permissions: Json | null
          status: string | null
          two_factor_enabled: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_activity?: string | null
          last_login_at?: string | null
          name?: string | null
          permissions?: Json | null
          status?: string | null
          two_factor_enabled?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_activity?: string | null
          last_login_at?: string | null
          name?: string | null
          permissions?: Json | null
          status?: string | null
          two_factor_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["permission"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_campaign_from_reserva: {
        Args: { reserva_id: string }
        Returns: string
      }
      get_all_users: {
        Args: {
          limit_count?: number
          offset_count?: number
          role_filter?: Database["public"]["Enums"]["user_role"]
          search_term?: string
          status_filter?: Database["public"]["Enums"]["user_status"]
        }
        Returns: {
          avatar_url: string
          created_at: string
          email: string
          id: string
          last_login_at: string
          name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
        }[]
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      has_superadmin_permission: {
        Args: { perm: string; user_uuid: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      log_user_action: {
        Args: {
          action_type: string
          details?: Json
          resource_id?: string
          resource_type?: string
        }
        Returns: undefined
      }
      setup_superadmin: {
        Args: { admin_email: string; admin_password?: string }
        Returns: string
      }
      update_last_login: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          perm: Database["public"]["Enums"]["permission"]
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      permission:
        | "manage_users"
        | "manage_roles"
        | "manage_billboards"
        | "manage_campaigns"
        | "view_analytics"
        | "manage_system"
        | "export_data"
        | "manage_finances"
      user_role: "superadmin" | "admin" | "owner" | "advertiser"
      user_status: "active" | "suspended" | "inactive"
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
      permission: [
        "manage_users",
        "manage_roles",
        "manage_billboards",
        "manage_campaigns",
        "view_analytics",
        "manage_system",
        "export_data",
        "manage_finances",
      ],
      user_role: ["superadmin", "admin", "owner", "advertiser"],
      user_status: ["active", "suspended", "inactive"],
    },
  },
} as const
