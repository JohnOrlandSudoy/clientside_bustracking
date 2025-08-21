import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, MapPin, Navigation, Wifi, WifiOff, Shield, Settings } from 'lucide-react';
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
  // ...existing code...
  // Overlay state for location prompt
  const [locationPrompted, setLocationPrompted] = useState(false);
  // ...existing hooks...

  // (move this useEffect below all hooks and functions, after permissionStatus and getUserLocation are defined)
  const { busId } = useParams<{ busId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, refreshETAs, selectBus } = useBusTracking();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  // Refs to track if component is mounted and watch ID
  const isMounted = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Stop location watching
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Check location permission status
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionStatus('not-supported');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state);
      
      permission.onchange = () => {
        setPermissionStatus(permission.state);
      };
    } catch (error) {
      console.warn('Permission API not supported:', error);
      setPermissionStatus('unknown');
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  // Listen for location requests from BusMap component
  useEffect(() => {
    const handleLocationRequested = (event: CustomEvent) => {
      console.log('🎯 TrackerPage: locationRequested event received:', event.detail);
      
      if (event.detail && event.detail.lat && event.detail.lng) {
        const newLocation = {
          lat: event.detail.lat,
          lng: event.detail.lng
        };
        
        console.log('🎯 TrackerPage: Updating userLocation to:', newLocation);
        
        if (isMounted.current) {
          setUserLocation(newLocation);
          setLocationAccuracy(null); // Will be updated when we get actual accuracy
          setLastUpdate(new Date());
          setLocationError(null);
          
          // Center map on new location
          if (map) {
            console.log('🎯 TrackerPage: Centering map on:', newLocation);
            setMapCenter(newLocation);
            map.panTo(newLocation);
          } else {
            console.log('⚠️ TrackerPage: No map instance available for centering');
          }
        } else {
          console.log('⚠️ TrackerPage: Component not mounted, ignoring location update');
        }
      } else {
        console.log('⚠️ TrackerPage: Invalid location data in event:', event.detail);
      }
    };

    console.log('🎯 TrackerPage: Setting up locationRequested event listener');
    
    // Add event listener
    window.addEventListener('locationRequested', handleLocationRequested as EventListener);
    
    // Cleanup
    return () => {
      console.log('🎯 TrackerPage: Cleaning up locationRequested event listener');
      window.removeEventListener('locationRequested', handleLocationRequested as EventListener);
    };
  }, [map]);

  // Get user's current location (one-time)
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please use a modern browser.');
      return null;
    }

    // Check if running on HTTPS (required for geolocation)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLocationError('Location access requires HTTPS. Please use a secure connection.');
      return null;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // Start with low accuracy for better success rate
          timeout: 15000, // Increased timeout
          maximumAge: 300000 // 5 minutes
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (isMounted.current) {
        setUserLocation(location);
        setLocationAccuracy(position.coords.accuracy);
        setLastUpdate(new Date());
        setLocationLoading(false);
        // Center map on user location if no bus is selected
        if (!state.selectedBusId && map) {
          setMapCenter(location);
          map.panTo(location);
        }
      }

      return location;
    } catch (error) {
      if (isMounted.current) {
        setLocationLoading(false);
        if (error instanceof GeolocationPositionError) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Location access denied. Please enable location services in your browser settings.');
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('Location information unavailable. Please check your GPS/network connection and try again.');
              break;
            case error.TIMEOUT:
              setLocationError('Location request timed out. Please try again or check your internet connection.');
              break;
            default:
              setLocationError('Unable to get your location. Please try again.');
          }
        } else {
          setLocationError('Failed to get location. Please try again.');
        }
      }
      return null;
    }
  }, [state.selectedBusId, map]);

  // Start real-time location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    // Check if running on HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLocationError('Real-time tracking requires HTTPS. Please use a secure connection.');
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setLocationError(null);
    setIsTracking(true);

    const options: PositionOptions = {
      enableHighAccuracy: false, // Start with low accuracy
      timeout: 15000, // Increased timeout
      maximumAge: 30000 // 30 seconds
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMounted.current) return;

        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setUserLocation(location);
        setLocationAccuracy(position.coords.accuracy);
        setLastUpdate(new Date());

        // Center map on user location if no bus is selected
        if (!state.selectedBusId && map) {
          const debouncedPan = debounce(() => {
            if (map && isMounted.current) {
              map.panTo(location);
            }
          }, 1000); // Debounce to prevent excessive map updates
          debouncedPan();
        }
      },
      (error) => {
        if (!isMounted.current) return;

        setIsTracking(false);
        if (error instanceof GeolocationPositionError) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Location access denied. Please enable location services in your browser settings.');
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('Location information unavailable. Please check your GPS/network connection.');
              break;
            case error.TIMEOUT:
              setLocationError('Location request timed out. Please try again.');
              break;
            default:
              setLocationError('Unable to track your location. Please try again.');
          }
        } else {
          setLocationError('Failed to track location. Please try again.');
        }
      },
      options
    );
  }, [state.selectedBusId, map]);

  // Stop real-time location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Toggle location tracking
  const toggleLocationTracking = useCallback(() => {
    if (isTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  }, [isTracking, startLocationTracking, stopLocationTracking]);

  // Start real-time user location tracking automatically on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      setLocationError(null);
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          if (isMounted.current) {
            setUserLocation(location);
            setLocationAccuracy(position.coords.accuracy);
            setLastUpdate(new Date());
            setLocationLoading(false);
            // Center map on user location if no bus is selected
            if (!state.selectedBusId && map) {
              setMapCenter(location);
              map.panTo(location);
            }
          }
        },
        (error) => {
          if (isMounted.current) {
            setLocationLoading(false);
            setLocationError('Unable to get your location. Please check your browser settings.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
      watchIdRef.current = watchId;
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Center map on selected bus's location or user location
  useEffect(() => {
    if (!map || !isMounted.current) return;
    
    if (state.selectedBusId) {
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
      }
    } else if (userLocation) {
      // Center on user location if no bus is selected
      setMapCenter(userLocation);
      const debouncedPan = debounce(() => {
        if (map && isMounted.current) {
          map.panTo(userLocation);
        }
      }, 300);
      debouncedPan();
    } else {
      setMapCenter(defaultCenter);
    }
  }, [state.selectedBusId, state.busETAs, map, userLocation]);

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

  // Format last update time
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Always prompt for location on mount if userLocation is null
  useEffect(() => {
    if (!userLocation) {
      getUserLocation();
    }
  }, []);

  // Add error logging for geolocation failures
  useEffect(() => {
    if (locationError) {
      console.error('Geolocation error:', locationError);
    }
  }, [locationError]);

  // Prompt for location on mount (after all hooks and functions are defined)
  useEffect(() => {
    if (!locationPrompted && permissionStatus === 'unknown') {
      getUserLocation();
      setLocationPrompted(true);
    }
  }, [locationPrompted, permissionStatus, getUserLocation]);

  // Log user location to the console whenever it updates
  useEffect(() => {
    if (userLocation) {
      console.log('User location updated:', userLocation);
    }
  }, [userLocation]);

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


  // Show blocking overlay if location is denied or not granted
  const showBlockingOverlay = permissionStatus === 'denied' || permissionStatus === 'prompt' || permissionStatus === 'unknown';

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto" style={{ position: 'relative' }}>
      {showBlockingOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.98)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <MapPin size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">📍 Location Access Required</h2>
          <p className="text-gray-600 mb-6 text-center max-w-sm">
            This app needs your location to show your position on the map and provide accurate bus tracking information.
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Shows your current location on the map
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Calculates distance to buses
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Provides real-time tracking
            </div>
          </div>
          <button
            onClick={getUserLocation}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-3"
          >
            📍 Allow Location Access
          </button>
          {permissionStatus === 'denied' && (
            <div className="text-center">
              <p className="text-red-600 text-sm mb-2">⚠️ Location access is blocked</p>
              <p className="text-gray-500 text-xs">Please enable it in your browser settings and refresh the page</p>
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Bus Tracker</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">Real-time location updates</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {/* Location Tracking Button */}
          <button
            onClick={toggleLocationTracking}
            disabled={locationLoading || permissionStatus === 'denied'}
            className={`p-2.5 sm:p-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 touch-target ${
              isTracking 
                ? 'bg-green-500 text-white ring-2 ring-green-300' 
                : 'bg-red-500 text-white ring-2 ring-red-300'
            }`}
            title={isTracking ? 'Stop real-time tracking' : 'Start real-time tracking'}
          >
            {isTracking ? <Wifi size={18} /> : <WifiOff size={18} />}
          </button>
          
          {/* Manual Location Button */}
          <button
            onClick={getUserLocation}
            disabled={locationLoading || permissionStatus === 'denied'}
            className="bg-red-500 text-white p-2.5 sm:p-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 ring-2 ring-red-300 touch-target"
            title="Get my current location"
          >
            <MapPin size={18} className={locationLoading ? 'animate-pulse' : ''} />
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={refreshETAs}
            disabled={state.isRefreshing || !selectedBus}
            className="bg-pink-500 text-white p-2.5 sm:p-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 touch-target"
          >
            <RefreshCw size={18} className={state.isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Location Status */}
      {userLocation && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full mr-2 sm:mr-3 animate-pulse flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-red-700 text-xs sm:text-sm font-medium">📍 Your Current Location</p>
                <p className="text-red-600 text-xs font-mono break-all">
                  {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </p>
                {locationAccuracy && (
                  <p className="text-xs text-red-500 mt-1">
                    📏 Accuracy: ±{Math.round(locationAccuracy)} meters
                  </p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-0">
                {isTracking && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    <span className="text-green-600 text-xs font-medium">LIVE</span>
                  </div>
                )}
                <div className="text-xs text-red-500 font-medium">
                  {formatLastUpdate(lastUpdate)}
                </div>
              </div>
              <button
                onClick={getUserLocation}
                className="w-full sm:w-auto px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors touch-target"
                title="Refresh location"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Error with Troubleshooting */}
      {locationError && (
        <div className="mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" size={16} />
            <div className="flex-1 min-w-0">
              <p className="text-yellow-700 text-xs sm:text-sm font-medium mb-2">{locationError}</p>
              
              {/* Troubleshooting Steps */}
              <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-yellow-100">
                <p className="text-yellow-800 text-xs font-medium mb-2">Troubleshooting:</p>
                <ul className="text-yellow-700 text-xs space-y-1">
                  <li className="flex items-start">
                    <Shield size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Make sure location services are enabled in your browser</span>
                  </li>
                  <li className="flex items-start">
                    <Settings size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Check if GPS is enabled on your device</span>
                  </li>
                  <li className="flex items-start">
                    <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Try refreshing the page and allowing location access</span>
                  </li>
                  <li className="flex items-start">
                    <Navigation size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Ensure you're using HTTPS or localhost</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <Shield className="text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-red-700 text-xs sm:text-sm font-medium">Location Access Blocked</p>
            <p className="text-red-600 text-xs">Please enable location access in your browser settings</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertCircle className="text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-red-600 text-xs sm:text-sm">{state.error}</p>
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
        <ErrorBoundary
          fallback={
            <div className="mb-6 p-4 bg-gray-100 rounded-xl text-center">
              <p className="text-gray-600 mb-2">Map could not be loaded</p>
              <p className="text-sm text-gray-500">Please try refreshing the page</p>
            </div>
          }
        >
          <BusMap
            selectedBusETA={selectedBusETA || null}
            startTerminal={startTerminal || null}
            endTerminal={endTerminal || null}
            terminals={state.terminals}
            routeTerminals={(() => {
              // Only use start and end terminal for the polyline
              const arr = [];
              if (startTerminal) arr.push(startTerminal);
              if (endTerminal) arr.push(endTerminal);
              return arr;
            })()}
            onMapLoad={setMap}
            center={mapCenter}
            userLocation={userLocation}
            onLocationUpdate={(location) => {
              console.log('📍 BusMap onLocationUpdate called:', location);
              setUserLocation(location);
              setLocationAccuracy(null);
              setLastUpdate(new Date());
              setLocationError(null);
              
              // Center map on new location
              setMapCenter(location);
              if (map) {
                map.panTo(location);
              }
            }}
          />
        </ErrorBoundary>

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