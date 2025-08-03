import { supabase } from '../lib/supabase';
import { Bus, Terminal, Route, NotificationPayload, BusReassignment } from '../types';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred');
};

export const busAPI = {
  getBuses: async () => {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('bus_number');
    
    if (error) handleSupabaseError(error);
    return { data: data as Bus[] };
  },

  getBusLocations: async () => {
    const { data, error } = await supabase
      .from('buses')
      .select('id, bus_number, current_location, status')
      .not('current_location', 'is', null);
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  reassignBus: async (busId: string, data: BusReassignment) => {
    const { error } = await supabase
      .from('buses')
      .update({
        driver_id: data.driver_id,
        conductor_id: data.conductor_id,
        route_id: data.route_id,
      })
      .eq('id', busId);
    
    if (error) handleSupabaseError(error);
    return { data: null };
  },

  createBus: async (busData: Omit<Bus, 'id'>) => {
    const { data, error } = await supabase
      .from('buses')
      .insert([busData])
      .select()
      .single();
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  updateBusLocation: async (busId: string, location: { lat: number; lng: number }) => {
    const { error } = await supabase
      .from('buses')
      .update({ current_location: location })
      .eq('id', busId);
    
    if (error) handleSupabaseError(error);
    return { data: null };
  },
};

export const terminalAPI = {
  getTerminals: async () => {
    const { data, error } = await supabase
      .from('terminals')
      .select('*')
      .order('name');
    
    if (error) handleSupabaseError(error);
    return { data: data as Terminal[] };
  },

  createTerminal: async (terminalData: Omit<Terminal, 'id'>) => {
    const { data, error } = await supabase
      .from('terminals')
      .insert([terminalData])
      .select()
      .single();
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  updateTerminal: async (terminalId: string, terminalData: Partial<Terminal>) => {
    const { data, error } = await supabase
      .from('terminals')
      .update(terminalData)
      .eq('id', terminalId)
      .select()
      .single();
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  deleteTerminal: async (terminalId: string) => {
    const { error } = await supabase
      .from('terminals')
      .delete()
      .eq('id', terminalId);
    
    if (error) handleSupabaseError(error);
    return { data: null };
  },
};

export const routeAPI = {
  getRoutes: async () => {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        start_terminal:terminals!routes_start_terminal_id_fkey(id, name, address),
        end_terminal:terminals!routes_end_terminal_id_fkey(id, name, address)
      `)
      .order('name');
    
    if (error) handleSupabaseError(error);
    return { data: data as Route[] };
  },

  createRoute: async (routeData: { name: string; start_terminal_id: string; end_terminal_id: string }) => {
    const { data, error } = await supabase
      .from('routes')
      .insert([routeData])
      .select(`
        *,
        start_terminal:terminals!routes_start_terminal_id_fkey(id, name, address),
        end_terminal:terminals!routes_end_terminal_id_fkey(id, name, address)
      `)
      .single();
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  updateRoute: async (routeId: string, routeData: Partial<Route>) => {
    const { data, error } = await supabase
      .from('routes')
      .update(routeData)
      .eq('id', routeId)
      .select(`
        *,
        start_terminal:terminals!routes_start_terminal_id_fkey(id, name, address),
        end_terminal:terminals!routes_end_terminal_id_fkey(id, name, address)
      `)
      .single();
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  deleteRoute: async (routeId: string) => {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId);
    
    if (error) handleSupabaseError(error);
    return { data: null };
  },
};

export const notificationAPI = {
  sendNotification: async (notificationData: NotificationPayload) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  getNotifications: async (recipientId?: string) => {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (recipientId) {
      query = query.eq('recipient_id', recipientId);
    }
    
    const { data, error } = await query;
    
    if (error) handleSupabaseError(error);
    return { data };
  },
};

export const userAPI = {
  getUsers: async (role?: 'client' | 'admin' | 'employee') => {
    let query = supabase
      .from('users')
      .select('*')
      .order('username');
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query;
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  getDrivers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'employee')
      .order('username');
    
    if (error) handleSupabaseError(error);
    return { data };
  },

  getConductors: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'employee')
      .order('username');
    
    if (error) handleSupabaseError(error);
    return { data };
  },
};