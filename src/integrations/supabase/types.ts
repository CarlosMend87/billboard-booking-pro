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
      agentes_venta: {
        Row: {
          activo: boolean | null
          codigo_agente: string
          comision_monto_fijo: number | null
          comision_porcentaje: number | null
          created_at: string | null
          email: string
          id: string
          nombre_completo: string
          owner_id: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo_agente: string
          comision_monto_fijo?: number | null
          comision_porcentaje?: number | null
          created_at?: string | null
          email: string
          id?: string
          nombre_completo: string
          owner_id: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo_agente?: string
          comision_monto_fijo?: number | null
          comision_porcentaje?: number | null
          created_at?: string | null
          email?: string
          id?: string
          nombre_completo?: string
          owner_id?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      billboard_locks: {
        Row: {
          billboard_id: string
          created_at: string | null
          expires_at: string
          id: string
          locked_at: string
          status: string
          user_id: string
        }
        Insert: {
          billboard_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          locked_at?: string
          status?: string
          user_id: string
        }
        Update: {
          billboard_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          locked_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billboard_locks_billboard_id_fkey"
            columns: ["billboard_id"]
            isOneToOne: false
            referencedRelation: "billboards"
            referencedColumns: ["id"]
          },
        ]
      }
      billboards: {
        Row: {
          admobilize_config: Json | null
          contratacion: Json
          created_at: string
          digital: Json | null
          direccion: string
          fotos: string[] | null
          has_computer_vision: boolean | null
          id: string
          last_detection_count: number | null
          last_detection_date: string | null
          lat: number
          lng: number
          medidas: Json
          metadata: Json | null
          nombre: string
          owner_id: string
          precio: Json
          precio_impresion_m2: number | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          admobilize_config?: Json | null
          contratacion?: Json
          created_at?: string
          digital?: Json | null
          direccion: string
          fotos?: string[] | null
          has_computer_vision?: boolean | null
          id?: string
          last_detection_count?: number | null
          last_detection_date?: string | null
          lat: number
          lng: number
          medidas?: Json
          metadata?: Json | null
          nombre: string
          owner_id: string
          precio?: Json
          precio_impresion_m2?: number | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          admobilize_config?: Json | null
          contratacion?: Json
          created_at?: string
          digital?: Json | null
          direccion?: string
          fotos?: string[] | null
          has_computer_vision?: boolean | null
          id?: string
          last_detection_count?: number | null
          last_detection_date?: string | null
          lat?: number
          lng?: number
          medidas?: Json
          metadata?: Json | null
          nombre?: string
          owner_id?: string
          precio?: Json
          precio_impresion_m2?: number | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      bonificaciones: {
        Row: {
          campana_id: string
          codigo_bonificacion: string
          created_at: string | null
          dias_bonificados: number
          fecha_fin_bonificacion: string
          fecha_inicio_bonificacion: string
          id: string
          motivo: string | null
          owner_id: string
          valor_dias_bonificados: number
        }
        Insert: {
          campana_id: string
          codigo_bonificacion: string
          created_at?: string | null
          dias_bonificados: number
          fecha_fin_bonificacion: string
          fecha_inicio_bonificacion: string
          id?: string
          motivo?: string | null
          owner_id: string
          valor_dias_bonificados: number
        }
        Update: {
          campana_id?: string
          codigo_bonificacion?: string
          created_at?: string | null
          dias_bonificados?: number
          fecha_fin_bonificacion?: string
          fecha_inicio_bonificacion?: string
          id?: string
          motivo?: string | null
          owner_id?: string
          valor_dias_bonificados?: number
        }
        Relationships: [
          {
            foreignKeyName: "bonificaciones_campana_id_fkey"
            columns: ["campana_id"]
            isOneToOne: false
            referencedRelation: "campañas"
            referencedColumns: ["id"]
          },
        ]
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
      codigos_descuento: {
        Row: {
          activo: boolean
          clientes_permitidos: string[] | null
          codigo: string
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          notas: string | null
          owner_id: string
          tipo_descuento: string
          updated_at: string | null
          uso_actual: number | null
          uso_maximo: number | null
          valor_descuento: number
        }
        Insert: {
          activo?: boolean
          clientes_permitidos?: string[] | null
          codigo: string
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          notas?: string | null
          owner_id: string
          tipo_descuento: string
          updated_at?: string | null
          uso_actual?: number | null
          uso_maximo?: number | null
          valor_descuento: number
        }
        Update: {
          activo?: boolean
          clientes_permitidos?: string[] | null
          codigo?: string
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          notas?: string | null
          owner_id?: string
          tipo_descuento?: string
          updated_at?: string | null
          uso_actual?: number | null
          uso_maximo?: number | null
          valor_descuento?: number
        }
        Relationships: []
      }
      materiales_campana: {
        Row: {
          archivo_material: string | null
          campana_id: string | null
          created_at: string | null
          dias_retraso: number | null
          fecha_limite_entrega: string | null
          fecha_recepcion: string | null
          foto_confirmacion: string | null
          id: string
          material_recibido: boolean | null
          notas: string | null
          quien_imprime: string | null
          reserva_id: string
          updated_at: string | null
        }
        Insert: {
          archivo_material?: string | null
          campana_id?: string | null
          created_at?: string | null
          dias_retraso?: number | null
          fecha_limite_entrega?: string | null
          fecha_recepcion?: string | null
          foto_confirmacion?: string | null
          id?: string
          material_recibido?: boolean | null
          notas?: string | null
          quien_imprime?: string | null
          reserva_id: string
          updated_at?: string | null
        }
        Update: {
          archivo_material?: string | null
          campana_id?: string | null
          created_at?: string | null
          dias_retraso?: number | null
          fecha_limite_entrega?: string | null
          fecha_recepcion?: string | null
          foto_confirmacion?: string | null
          id?: string
          material_recibido?: boolean | null
          notas?: string | null
          quien_imprime?: string | null
          reserva_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiales_campana_campana_id_fkey"
            columns: ["campana_id"]
            isOneToOne: false
            referencedRelation: "campañas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiales_campana_reserva_id_fkey"
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
          empresa: string | null
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
          empresa?: string | null
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
          empresa?: string | null
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
      renovaciones_campana: {
        Row: {
          campana_id: string
          created_at: string | null
          fecha_recordatorio: string
          id: string
          notas: string | null
          nueva_campana_id: string | null
          recordatorio_enviado: boolean | null
          respuesta_owner: string | null
          updated_at: string | null
        }
        Insert: {
          campana_id: string
          created_at?: string | null
          fecha_recordatorio: string
          id?: string
          notas?: string | null
          nueva_campana_id?: string | null
          recordatorio_enviado?: boolean | null
          respuesta_owner?: string | null
          updated_at?: string | null
        }
        Update: {
          campana_id?: string
          created_at?: string | null
          fecha_recordatorio?: string
          id?: string
          notas?: string | null
          nueva_campana_id?: string | null
          recordatorio_enviado?: boolean | null
          respuesta_owner?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renovaciones_campana_campana_id_fkey"
            columns: ["campana_id"]
            isOneToOne: false
            referencedRelation: "campañas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renovaciones_campana_nueva_campana_id_fkey"
            columns: ["nueva_campana_id"]
            isOneToOne: false
            referencedRelation: "campañas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          advertiser_id: string
          agente_id: string | null
          asset_name: string
          asset_type: string
          cliente_email: string | null
          cliente_nombre: string | null
          cliente_razon_social: string | null
          codigo_descuento_id: string | null
          config: Json
          created_at: string
          descuento_aplicado: number | null
          es_agencia: boolean | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          modalidad: string
          owner_id: string
          precio_total: number
          status: string | null
          tarifa_final: number | null
          tarifa_publicada: number | null
          tipo_contrato: string | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          agente_id?: string | null
          asset_name: string
          asset_type: string
          cliente_email?: string | null
          cliente_nombre?: string | null
          cliente_razon_social?: string | null
          codigo_descuento_id?: string | null
          config?: Json
          created_at?: string
          descuento_aplicado?: number | null
          es_agencia?: boolean | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          modalidad: string
          owner_id: string
          precio_total: number
          status?: string | null
          tarifa_final?: number | null
          tarifa_publicada?: number | null
          tipo_contrato?: string | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          agente_id?: string | null
          asset_name?: string
          asset_type?: string
          cliente_email?: string | null
          cliente_nombre?: string | null
          cliente_razon_social?: string | null
          codigo_descuento_id?: string | null
          config?: Json
          created_at?: string
          descuento_aplicado?: number | null
          es_agencia?: boolean | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          modalidad?: string
          owner_id?: string
          precio_total?: number
          status?: string | null
          tarifa_final?: number | null
          tarifa_publicada?: number | null
          tipo_contrato?: string | null
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
            foreignKeyName: "reservas_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes_venta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_codigo_descuento_id_fkey"
            columns: ["codigo_descuento_id"]
            isOneToOne: false
            referencedRelation: "codigos_descuento"
            referencedColumns: ["id"]
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
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
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
      cleanup_expired_locks: { Args: never; Returns: undefined }
      create_billboard_lock: {
        Args: { billboard_uuid: string; user_uuid: string }
        Returns: string
      }
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
        Args: never
        Returns: {
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_superadmin_permission: {
        Args: { perm: string; user_uuid: string }
        Returns: boolean
      }
      incrementar_uso_codigo_descuento: {
        Args: { codigo_id: string }
        Returns: undefined
      }
      is_active_superadmin: { Args: { _user: string }; Returns: boolean }
      is_billboard_locked: {
        Args: { billboard_uuid: string }
        Returns: boolean
      }
      is_superadmin: { Args: { user_uuid: string }; Returns: boolean }
      log_user_action: {
        Args: {
          action_type: string
          details?: Json
          resource_id?: string
          resource_type?: string
        }
        Returns: undefined
      }
      setup_superadmin: { Args: { admin_email: string }; Returns: string }
      update_last_login: { Args: { user_uuid: string }; Returns: undefined }
      user_has_permission: {
        Args: {
          perm: Database["public"]["Enums"]["permission"]
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "owner" | "advertiser" | "agente"
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
      app_role: ["superadmin", "admin", "owner", "advertiser", "agente"],
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
