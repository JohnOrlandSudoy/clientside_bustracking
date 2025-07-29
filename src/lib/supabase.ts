import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ysxcngthzeajjrxwqgvq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

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