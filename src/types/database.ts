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
          display_name: string | null
          zip_code: string | null
          hardiness_zone: string | null
          last_frost_date: string | null
          first_frost_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          zip_code?: string | null
          hardiness_zone?: string | null
          last_frost_date?: string | null
          first_frost_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          zip_code?: string | null
          hardiness_zone?: string | null
          last_frost_date?: string | null
          first_frost_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      seeds: {
        Row: {
          id: string
          user_id: string
          variety_name: string
          common_name: string | null
          seed_company: string | null
          product_url: string | null
          image_url: string | null
          purchase_year: number | null
          quantity_packets: number
          notes: string | null
          days_to_maturity_min: number | null
          days_to_maturity_max: number | null
          planting_depth_inches: number | null
          spacing_inches: number | null
          row_spacing_inches: number | null
          sun_requirement: string | null
          water_requirement: string | null
          planting_method: string | null
          weeks_before_last_frost: number | null
          weeks_after_last_frost: number | null
          cold_hardy: boolean
          weeks_before_last_frost_outdoor: number | null
          succession_planting: boolean
          succession_interval_days: number | null
          fall_planting: boolean
          cold_stratification_required: boolean
          cold_stratification_weeks: number | null
          ai_extracted: boolean
          ai_extraction_date: string | null
          raw_ai_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          variety_name: string
          common_name?: string | null
          seed_company?: string | null
          product_url?: string | null
          image_url?: string | null
          purchase_year?: number | null
          quantity_packets?: number
          notes?: string | null
          days_to_maturity_min?: number | null
          days_to_maturity_max?: number | null
          planting_depth_inches?: number | null
          spacing_inches?: number | null
          row_spacing_inches?: number | null
          sun_requirement?: string | null
          water_requirement?: string | null
          planting_method?: string | null
          weeks_before_last_frost?: number | null
          weeks_after_last_frost?: number | null
          cold_hardy?: boolean
          weeks_before_last_frost_outdoor?: number | null
          succession_planting?: boolean
          succession_interval_days?: number | null
          fall_planting?: boolean
          cold_stratification_required?: boolean
          cold_stratification_weeks?: number | null
          ai_extracted?: boolean
          ai_extraction_date?: string | null
          raw_ai_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          variety_name?: string
          common_name?: string | null
          seed_company?: string | null
          product_url?: string | null
          image_url?: string | null
          purchase_year?: number | null
          quantity_packets?: number
          notes?: string | null
          days_to_maturity_min?: number | null
          days_to_maturity_max?: number | null
          planting_depth_inches?: number | null
          spacing_inches?: number | null
          row_spacing_inches?: number | null
          sun_requirement?: string | null
          water_requirement?: string | null
          planting_method?: string | null
          weeks_before_last_frost?: number | null
          weeks_after_last_frost?: number | null
          cold_hardy?: boolean
          weeks_before_last_frost_outdoor?: number | null
          succession_planting?: boolean
          succession_interval_days?: number | null
          fall_planting?: boolean
          cold_stratification_required?: boolean
          cold_stratification_weeks?: number | null
          ai_extracted?: boolean
          ai_extraction_date?: string | null
          raw_ai_response?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      zip_frost_data: {
        Row: {
          zip_code: string
          hardiness_zone: string | null
          last_frost_date_avg: string | null
          first_frost_date_avg: string | null
          latitude: number | null
          longitude: number | null
          station_name: string | null
        }
        Insert: {
          zip_code: string
          hardiness_zone?: string | null
          last_frost_date_avg?: string | null
          first_frost_date_avg?: string | null
          latitude?: number | null
          longitude?: number | null
          station_name?: string | null
        }
        Update: {
          zip_code?: string
          hardiness_zone?: string | null
          last_frost_date_avg?: string | null
          first_frost_date_avg?: string | null
          latitude?: number | null
          longitude?: number | null
          station_name?: string | null
        }
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
  }
}

// Convenience types for common use cases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Seed = Database['public']['Tables']['seeds']['Row']
export type SeedInsert = Database['public']['Tables']['seeds']['Insert']
export type SeedUpdate = Database['public']['Tables']['seeds']['Update']

export type ZipFrostData = Database['public']['Tables']['zip_frost_data']['Row']
