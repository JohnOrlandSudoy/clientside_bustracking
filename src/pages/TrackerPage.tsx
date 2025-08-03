import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useBusTracking } from '../contexts/BusTrackingContext';
import { cachedApiCall } from '../services/apiCacheService';
import { authAPI } from '../lib/api';
import { Bus } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';
import { debounce } from '../utils/debounce';

// Define default center for map
const defaultCenter = {
  lat: 14.5995,
  lng: 120.9842,
};

// Lazy load components
const BusSelector = lazy(() => import('../components/tracker/BusSelector'));
const BusMap = lazy(() => import('../components/tracker/BusMap'));
const BusDetails = lazy(() => import('../components/tracker/BusDetails'));
const RouteDetails = lazy(() => import('../components/tracker/RouteDetails'));

// Loading component for Suspense fallback
const LoadingComponent = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

export default function TrackerPage() {
  const { busId } = useParams<{ busId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, refreshETAs, selectBus } = useBusTracking();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Refs to track if component is mounted
  const isMounted = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load buses with caching
  useEffect(() => {
    const loadBuses = async () => {
      if (!isMounted.current) return;
      
      try {
        // Use cached API call with 5 minute expiry
        const buses = await cachedApiCall(
          'buses',
          async () => {
            // Use the authAPI.getBuses() method instead of direct fetch
            return await authAPI.getBuses();
          },
          5 * 60 * 1000 // 5 minutes cache
        );
        
        if (!isMounted.current) return;
        dispatch({ type: 'SET_BUSES', payload: buses });
        
        // Select bus from URL parameter or first bus
        if (busId) {
          const bus = buses.find((b: Bus) => b.id === busId);
          if (bus) selectBus(bus.id);
        } else if (buses.length > 0 && !state.selectedBusId) {
          selectBus(buses[0].id);
        }
      } catch (error) {
        if (!isMounted.current) return;
        console.error('Failed to load buses:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load bus data. Using fallback data.' });
      }
    };

    // Debounce the loadBuses function to prevent excessive API calls
    const debouncedLoadBuses = debounce(loadBuses, 300);
    debouncedLoadBuses();
    
    return () => {
      // Cleanup
    };
  }, [busId, dispatch, selectBus, state.selectedBusId]);

  // Center map on selected bus's location
  useEffect(() => {
    if (!state.selectedBusId || !map || !isMounted.current) return;
    
    const selectedBusETA = state.busETAs.find(eta => eta.busId === state.selectedBusId);
    if (selectedBusETA?.currentLocation) {
      const newCenter = {
        lat: selectedBusETA.currentLocation.lat,
        lng: selectedBusETA.currentLocation.lng
      };
      
      setMapCenter(newCenter);
      
      // Debounce the map pan operation to prevent excessive rendering
      const debouncedPan = debounce(() => {
        if (map && isMounted.current) {
          map.panTo(newCenter);
        }
      }, 300);
      
      debouncedPan();
    } else {
      setMapCenter(defaultCenter);
    }
  }, [state.selectedBusId, state.busETAs, map]);

  // Handle ETA click to center map
  const handleETAClick = useCallback((bus: Bus) => {
    selectBus(bus.id);
    const busETA = state.busETAs.find(eta => eta.busId === bus.id);
    if (busETA?.currentLocation && map) {
      const newCenter = {
        lat: busETA.currentLocation.lat,
        lng: busETA.currentLocation.lng
      };
      
      setMapCenter(newCenter);
      
      // Debounce the map pan operation
      const debouncedPan = debounce(() => {
        if (map && isMounted.current) {
          map.panTo(newCenter);
        }
      }, 300);
      
      debouncedPan();
    }
  }, [state.busETAs, map, selectBus]);

  // Handle booking
  const handleBookNow = (busId: string) => {
    navigate(`/booking?busId=${busId}`);
  };

  // Get selected bus, ETA and terminals
  const selectedBus = state.buses.find(bus => bus.id === state.selectedBusId) || null;
  const selectedBusETA = selectedBus ? state.busETAs.find(eta => eta.busId === selectedBus.id) : null;
  const startTerminal = selectedBusETA
    ? state.terminals.find(t => t.id === selectedBusETA.route.start_terminal_id)
    : null;
  const endTerminal = selectedBusETA
    ? state.terminals.find(t => t.id === selectedBusETA.route.end_terminal_id)
    : null;

  if (state.isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading buses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bus Tracker</h1>
          <p className="text-gray-600">Real-time location updates</p>
        </div>
        <button
          onClick={refreshETAs}
          disabled={state.isRefreshing || !selectedBus}
          className="bg-pink-500 text-white p-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw size={20} className={state.isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
          <AlertCircle className="text-red-500 mr-3" size={20} />
          <p className="text-red-600 text-sm">{state.error}</p>
        </div>
      )}

      {/* Lazy loaded components with error boundaries */}
      <Suspense fallback={<LoadingComponent />}>
        {/* Bus Selector */}
        <ErrorBoundary>
          <BusSelector
            buses={state.buses}
            busETAs={state.busETAs}
            selectedBusId={state.selectedBusId}
            loadingETA={state.isRefreshing}
            onSelectBus={(bus) => selectBus(bus.id)}
            onETAClick={handleETAClick}
            onBookNow={handleBookNow}
          />
        </ErrorBoundary>

        {/* Interactive Map */}
        {selectedBusETA && (
          <ErrorBoundary
            fallback={
              <div className="mb-6 p-4 bg-gray-100 rounded-xl text-center">
                <p className="text-gray-600 mb-2">Map could not be loaded</p>
                <p className="text-sm text-gray-500">Please try refreshing the page</p>
              </div>
            }
          >
            <BusMap
              selectedBusETA={selectedBusETA}
              startTerminal={startTerminal || null}
              endTerminal={endTerminal || null}
              onMapLoad={setMap}
              center={mapCenter}
            />
          </ErrorBoundary>
        )}

        {/* Current Bus Info */}
        {selectedBus && (
          <ErrorBoundary>
            <BusDetails
              selectedBus={selectedBus}
              selectedBusETA={selectedBusETA || null}
              loadingETA={state.isRefreshing}
              onBookNow={handleBookNow}
            />
          </ErrorBoundary>
        )}

        {/* Route Information */}
        {selectedBus && selectedBusETA && (
          <ErrorBoundary>
            <RouteDetails
              selectedBusETA={selectedBusETA}
              startTerminal={startTerminal || null}
              endTerminal={endTerminal || null}
            />
          </ErrorBoundary>
        )}
      </Suspense>
    </div>
  );
}