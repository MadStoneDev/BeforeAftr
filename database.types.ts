export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      magnepixit_items: {
        Row: {
          created_at: string
          dimension_type: string | null
          height: number | null
          id: number
          title: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          dimension_type?: string | null
          height?: number | null
          id?: number
          title?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          dimension_type?: string | null
          height?: number | null
          id?: number
          title?: string | null
          width?: number | null
        }
        Relationships: []
      }
      magnepixit_orders: {
        Row: {
          access_code: string | null
          access_history: Json | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          id: string
          order_date: string | null
          order_no: string | null
          purge_on: string | null
          status: string | null
          updated_on: string | null
        }
        Insert: {
          access_code?: string | null
          access_history?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          order_date?: string | null
          order_no?: string | null
          purge_on?: string | null
          status?: string | null
          updated_on?: string | null
        }
        Update: {
          access_code?: string | null
          access_history?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          order_date?: string | null
          order_no?: string | null
          purge_on?: string | null
          status?: string | null
          updated_on?: string | null
        }
        Relationships: []
      }
      magnepixit_photos: {
        Row: {
          created_at: string
          cropped_photo: string | null
          id: string
          order_id: string | null
          original_photo: string | null
        }
        Insert: {
          created_at?: string
          cropped_photo?: string | null
          id?: string
          order_id?: string | null
          original_photo?: string | null
        }
        Update: {
          created_at?: string
          cropped_photo?: string | null
          id?: string
          order_id?: string | null
          original_photo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "magnepixit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      magnepixit_products: {
        Row: {
          created_at: string
          created_timestamp: string | null
          id: number
          product_id: string | null
          title: string | null
          updated_on: string | null
        }
        Insert: {
          created_at?: string
          created_timestamp?: string | null
          id?: number
          product_id?: string | null
          title?: string | null
          updated_on?: string | null
        }
        Update: {
          created_at?: string
          created_timestamp?: string | null
          id?: number
          product_id?: string | null
          title?: string | null
          updated_on?: string | null
        }
        Relationships: []
      }
      magnepixit_profiles: {
        Row: {
          created_at: string
          encrypted_access_token: string | null
          encrypted_refresh_token: string | null
          id: string
          scope: string | null
          store_id: string | null
          token_expires_at: string | null
        }
        Insert: {
          created_at?: string
          encrypted_access_token?: string | null
          encrypted_refresh_token?: string | null
          id?: string
          scope?: string | null
          store_id?: string | null
          token_expires_at?: string | null
        }
        Update: {
          created_at?: string
          encrypted_access_token?: string | null
          encrypted_refresh_token?: string | null
          id?: string
          scope?: string | null
          store_id?: string | null
          token_expires_at?: string | null
        }
        Relationships: []
      }
      magnepixit_templates: {
        Row: {
          created_at: string
          id: number
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      magnepixit_templates_items: {
        Row: {
          created_at: string
          id: number
          item_id: number | null
          template_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          item_id?: number | null
          template_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          item_id?: number | null
          template_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "magnepixit_templates_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "magnepixit_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magnepixit_templates_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "magnepixit_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      magnepixit_templates_products: {
        Row: {
          created_at: string
          id: number
          product_id: number | null
          template_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          product_id?: number | null
          template_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          product_id?: number | null
          template_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "magnepixit_templates_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "magnepixit_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magnepixit_templates_products_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "magnepixit_templates"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
