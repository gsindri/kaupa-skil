export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_elevations: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          meta_data: Json | null
          reason: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          meta_data?: Json | null
          reason?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          meta_data?: Json | null
          reason?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          capability: string
          constraints: Json | null
          created_at: string | null
          id: string
          membership_id: string
          scope: string
          scope_id: string | null
          tenant_id: string
        }
        Insert: {
          capability: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          membership_id: string
          scope?: string
          scope_id?: string | null
          tenant_id: string
        }
        Update: {
          capability?: string
          constraints?: Json | null
          created_at?: string | null
          id?: string
          membership_id?: string
          scope?: string
          scope_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          job_id: string
          level: string
          message: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id: string
          level: string
          message: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          job_id?: string
          level?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          max_retries: number | null
          requested_by: string | null
          result: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          requested_by?: string | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          requested_by?: string | null
          result?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          attrs: Json | null
          base_role: string
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attrs?: Json | null
          base_role: string
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attrs?: Json | null
          base_role?: string
          created_at?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_admin_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          reason: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requester_id: string
          target_entity_id: string | null
          target_entity_type: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requester_id: string
          target_entity_id?: string | null
          target_entity_type?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requester_id?: string
          target_entity_id?: string | null
          target_entity_type?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_sessions: {
        Row: {
          actor_id: string
          created_at: string | null
          ends_at: string
          id: string
          reason: string
          revoked_at: string | null
          revoked_by: string | null
          starts_at: string | null
          tenant_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          ends_at: string
          id?: string
          reason: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          ends_at?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          revoked_by?: string | null
          starts_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          kind: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          kind?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          kind?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_elevation: {
        Args: { reason_text: string; duration_minutes?: number }
        Returns: string
      }
      create_support_session: {
        Args: {
          target_tenant_id: string
          reason_text: string
          duration_minutes?: number
        }
        Returns: string
      }
      get_user_memberships: {
        Args: Record<PropertyKey, never>
        Returns: {
          membership_id: string
          tenant_id: string
          tenant_name: string
          base_role: string
          attrs: Json
        }[]
      }
      has_active_elevation: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_capability: {
        Args: {
          cap: string
          target_scope: string
          target_id?: string
          want?: Json
        }
        Returns: boolean
      }
      has_support_session: {
        Args: { target_tenant: string }
        Returns: boolean
      }
      is_owner: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          action_name: string
          entity_type_name?: string
          entity_id_val?: string
          reason_text?: string
          meta_data_val?: Json
          tenant_id_val?: string
        }
        Returns: string
      }
      revoke_elevation: {
        Args: { elevation_id: string }
        Returns: boolean
      }
      setup_owner_grants: {
        Args: { _membership_id: string }
        Returns: undefined
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
