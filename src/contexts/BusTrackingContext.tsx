import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI, BusETA } from '../lib/api';

// Define types
export interface Terminal {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}
interface Bus {
  id: string;
  bus_number: string;
  route_id: string;
  available_seats: number;
  total_seats: number;
  status: string;
}

interface BusTrackingState {
  buses: Bus[];
  busETAs: BusETA[];
  terminals: Terminal[];
  selectedBusId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

type BusTrackingAction =
  | { type: 'SET_BUSES'; payload: Bus[] }
  | { type: 'SET_ETAS'; payload: BusETA[] }
  | { type: 'SET_TERMINALS'; payload: Terminal[] }
  | { type: 'SELECT_BUS'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Create context
const BusTrackingContext = createContext<{
  state: BusTrackingState;
  dispatch: React.Dispatch<BusTrackingAction>;
  refreshETAs: () => Promise<void>;
  selectBus: (busId: string) => void;
} | undefined>(undefined);

// Initial state
const initialState: BusTrackingState = {
  buses: [],
  busETAs: [],
  terminals: [],
  selectedBusId: null,
  isLoading: true,
  isRefreshing: false,
  error: null,
};

// Reducer function
function busTrackingReducer(state: BusTrackingState, action: BusTrackingAction): BusTrackingState {
  switch (action.type) {
    case 'SET_BUSES':
      return { ...state, buses: action.payload };
    case 'SET_ETAS':
      return { ...state, busETAs: action.payload };
    case 'SET_TERMINALS':
      return { ...state, terminals: action.payload };
    case 'SELECT_BUS':
      return { ...state, selectedBusId: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Provider component
export function BusTrackingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(busTrackingReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadBuses();
    loadETAsAndTerminals();
  }, []);

  // Load buses
  const loadBuses = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await authAPI.getBuses();
      
      if (response && Array.isArray(response)) {
        dispatch({ type: 'SET_BUSES', payload: response });
        
        // Select first bus if none is selected
        if (!state.selectedBusId && response.length > 0) {
          dispatch({ type: 'SELECT_BUS', payload: response[0].id });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to load buses:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load bus data. Using fallback data.' });
      
      // Fallback data
      const fallbackBuses: Bus[] = [
        {
          id: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
          bus_number: 'BUS001',
          route_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          available_seats: 50,
          total_seats: 50,
          status: 'active'
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          bus_number: 'BUS002',
          route_id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
          available_seats: 40,
          total_seats: 40,
          status: 'active'
        }
      ];
      
      dispatch({ type: 'SET_BUSES', payload: fallbackBuses });
      
      if (!state.selectedBusId) {
        dispatch({ type: 'SELECT_BUS', payload: fallbackBuses[0].id });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load ETAs and terminals
  const loadETAsAndTerminals = async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Fetch ETAs
      const etaResponse = await authAPI.getBusETA();
      if (etaResponse && Array.isArray(etaResponse)) {
        dispatch({ type: 'SET_ETAS', payload: etaResponse });
      } else {
        throw new Error('Invalid ETA response format');
      }
      
      // Set default terminals since there's no API endpoint for terminals
      // In a real application, this would come from an API
      dispatch({ type: 'SET_TERMINALS', payload: [
        {
          id: '11111111-2222-3333-4444-555555555555',
          name: 'Downtown Terminal',
          location: { lat: 14.5980, lng: 120.9830 }
        },
        {
          id: '66666666-7777-8888-9999-000000000000',
          name: 'Suburb Terminal',
          location: { lat: 14.6010, lng: 120.9860 }
        }
      ]});
    } catch (error) {
      console.error('Failed to load ETAs or terminals:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load bus ETAs or terminal data. Please try again.' });
      
      // Set fallback data for terminals
      dispatch({ type: 'SET_TERMINALS', payload: [
        {
          id: '11111111-2222-3333-4444-555555555555',
          name: 'Downtown Terminal',
          location: { lat: 14.5980, lng: 120.9830 }
        },
        {
          id: '66666666-7777-8888-9999-000000000000',
          name: 'Suburb Terminal',
          location: { lat: 14.6010, lng: 120.9860 }
        }
      ]});
    }
  };

  // Refresh ETAs
  const refreshETAs = async () => {
    try {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await authAPI.getBusETA();
      if (response && Array.isArray(response)) {
        dispatch({ type: 'SET_ETAS', payload: response });
      } else {
        throw new Error('Invalid ETA response format');
      }
    } catch (error) {
      console.error('Failed to refresh ETAs:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh bus ETAs. Please try again.' });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  };

  // Select a bus
  const selectBus = (busId: string) => {
    dispatch({ type: 'SELECT_BUS', payload: busId });
  };

  return (
    <BusTrackingContext.Provider value={{ state, dispatch, refreshETAs, selectBus }}>
      {children}
    </BusTrackingContext.Provider>
  );
}

// Custom hook to use the context
export function useBusTracking() {
  const context = useContext(BusTrackingContext);
  if (context === undefined) {
    throw new Error('useBusTracking must be used within a BusTrackingProvider');
  }
  return context;
}