export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          variant_id: string | null
          status: string | null
          started_at: string | null
          current_period_end: string | null
        }
        Insert: {
          id: string
          user_id?: string | null
          variant_id?: string | null
          status?: string | null
          started_at?: string | null
          current_period_end?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          variant_id?: string | null
          status?: string | null
          started_at?: string | null
          current_period_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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

