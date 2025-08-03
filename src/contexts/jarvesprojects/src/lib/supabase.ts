import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on your schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: 'client' | 'admin' | 'employee';
          username: string;
          email: string;
          profile: any;
        };
        Insert: {
          id: string;
          role: 'client' | 'admin' | 'employee';
          username: string;
          email: string;
          profile?: any;
        };
        Update: {
          id?: string;
          role?: 'client' | 'admin' | 'employee';
          username?: string;
          email?: string;
          profile?: any;
        };
      };
      buses: {
        Row: {
          id: string;
          bus_number: string;
          current_location: { lat: number; lng: number } | null;
          status: 'active' | 'inactive' | 'maintenance';
          available_seats: number;
          total_seats: number;
          driver_id: string | null;
          conductor_id: string | null;
          terminal_id: string | null;
          route_id: string | null;
        };
        Insert: {
          id?: string;
          bus_number: string;
          current_location?: { lat: number; lng: number } | null;
          status?: 'active' | 'inactive' | 'maintenance';
          available_seats?: number;
          total_seats: number;
          driver_id?: string | null;
          conductor_id?: string | null;
          terminal_id?: string | null;
          route_id?: string | null;
        };
        Update: {
          id?: string;
          bus_number?: string;
          current_location?: { lat: number; lng: number } | null;
          status?: 'active' | 'inactive' | 'maintenance';
          available_seats?: number;
          total_seats?: number;
          driver_id?: string | null;
          conductor_id?: string | null;
          terminal_id?: string | null;
          route_id?: string | null;
        };
      };
      terminals: {
        Row: {
          id: string;
          name: string;
          address: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          name: string;
          start_terminal_id: string | null;
          end_terminal_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          start_terminal_id?: string | null;
          end_terminal_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          start_terminal_id?: string | null;
          end_terminal_id?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string | null;
          type: 'delay' | 'route_change' | 'traffic' | 'general';
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id?: string | null;
          type: 'delay' | 'route_change' | 'traffic' | 'general';
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string | null;
          type?: 'delay' | 'route_change' | 'traffic' | 'general';
          message?: string;
          created_at?: string;
        };
      };
    };
  };
}