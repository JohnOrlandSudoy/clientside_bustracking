export interface Bus {
  id: string;
  bus_number: string;
  route_id: string;
  current_location: {
    lat: number;
    lng: number;
  } | null;
  status: 'active' | 'inactive' | 'maintenance';
  available_seats: number;
  total_seats: number;
  driver_id: string | null;
  conductor_id: string | null;
  terminal_id: string | null;
}

export interface Terminal {
  id: string;
  name: string;
  address: string;
}

export interface Route {
  id: string;
  name: string;
  start_terminal_id: string | null;
  end_terminal_id: string | null;
  start_terminal: Terminal;
  end_terminal: Terminal;
}

export interface NotificationPayload {
  recipient_id: string | null;
  type: 'delay' | 'route_change' | 'traffic' | 'general';
  message: string;
}

export interface BusReassignment {
  driver_id: string | null;
  conductor_id: string | null;
  route_id: string | null;
}

export interface User {
  id: string;
  role: 'client' | 'admin' | 'employee';
  username: string;
  email: string;
  profile: any;
}