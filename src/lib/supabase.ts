import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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
