import { createClient } from '@supabase/supabase-js'


// Read Supabase config from Vite environment variables when available.
// Falling back to the previous hard-coded values keeps existing behavior
// during a fast local change, but using env vars is recommended.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ysxcngthzeajjrxwqgvq.supabase.co'
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzeGNuZ3RoemVhampyeHdxZ3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNTAxMzgsImV4cCI6MjA2ODgyNjEzOH0.RGlONyfMfktwHtcIKExkbeAGQ50CHnO9ZSt-dzs5ov4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          user_id: string
          bus_id: string
          seat_number: number
          booking_date: string
          journey_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bus_id: string
          seat_number: number
          booking_date: string
          journey_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bus_id?: string
          seat_number?: number
          booking_date?: string
          journey_date?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          bus_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bus_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bus_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
    }
  }
}