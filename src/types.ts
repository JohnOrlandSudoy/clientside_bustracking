// Common types used across the application

export interface Bus {
  id: string;
  bus_number: string;
  route_id: string;
  available_seats: number;
  total_seats: number;
  status: string;
}

export interface BusETA {
  busId: string;
  busNumber: string;
  eta: string;
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
  route: {
    name: string;
    start_terminal_id: string;
    end_terminal_id: string;
  };
}

export interface Terminal {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: 'announcement' | 'route_change' | 'delay' | 'cancellation' | 'reminder' | 'general';
  message: string;
  created_at: string;
  title: string | null;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read_at: string | null;
}