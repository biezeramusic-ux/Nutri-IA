/**
 * Tipos do esquema (espelham supabase/migrations/001_init.sql).
 * Podem ser regenerados com: npx supabase gen types typescript --project-id <id>
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          trial_started_at: string;
          plan: 'weekly' | 'monthly' | 'yearly' | null;
          plan_expires_at: string | null;
          created_at: string;
          goal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'eat_healthy' | 'track_calories' | null;
          sex: 'male' | 'female' | null;
          age: number | null;
          height_cm: number | null;
          weight_kg: number | null;
          target_weight_kg: number | null;
          activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | null;
          diet_preferences: string[];
          daily_calorie_goal: number | null;
          protein_goal_g: number | null;
          carbs_goal_g: number | null;
          fats_goal_g: number | null;
          water_goal_ml: number | null;
          water_reminders: boolean;
          wake_hour: number;
          sleep_hour: number;
          onboarding_completed_at: string | null;
        };
        Insert: never;
        Update: {
          full_name?: string;
          goal?: 'lose_weight' | 'maintain' | 'gain_muscle' | 'eat_healthy' | 'track_calories' | null;
          sex?: 'male' | 'female' | null;
          age?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          target_weight_kg?: number | null;
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'very_active' | null;
          diet_preferences?: string[];
          daily_calorie_goal?: number | null;
          protein_goal_g?: number | null;
          carbs_goal_g?: number | null;
          fats_goal_g?: number | null;
          water_goal_ml?: number | null;
          water_reminders?: boolean;
          wake_hour?: number;
          sleep_hour?: number;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          food_name: string;
          weight_g: number;
          calories: number;
          carbs_g: number;
          protein_g: number;
          fats_g: number;
          ingredients: Json;
          photo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          food_name: string;
          weight_g: number;
          calories: number;
          carbs_g: number;
          protein_g: number;
          fats_g: number;
          ingredients?: Json;
          photo_path?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      daily_scans: {
        Row: { user_id: string; day: string; count: number };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      water_logs: {
        Row: { user_id: string; day: string; glasses: number };
        Insert: { user_id?: string; day: string; glasses: number };
        Update: { glasses?: number };
        Relationships: [];
      };
      fasting_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          ended_at: string | null;
          goal_hours: number;
        };
        Insert: { id?: string; user_id?: string; started_at?: string; goal_hours?: number };
        Update: { ended_at?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_access_status: { Args: Record<PropertyKey, never>; Returns: Json };
      consume_scan: { Args: Record<PropertyKey, never>; Returns: Json };
      activate_plan: { Args: { p_plan: string }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
