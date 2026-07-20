import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Map as LeafletMap } from 'leaflet';
import { RefreshCw, AlertCircle, MapPin, Navigation, Wifi, WifiOff, Shield, Settings } from 'lucide-react';
import { useBusTracking } from '../contexts/BusTrackingContext';
import { useAuthAPI } from '../hooks/useAuthAPI';
import { cachedApiCall } from '../services/apiCacheService';
import { authAPI } from '../lib/api';
import { Bus } from '../types';
import ErrorBoundary from '../components/ErrorBoundary';
import BusMap from '../components/tracker/BusMap';
import PickupLocationSearch from '../components/tracker/PickupLocationSearch';
import { debounce } from '../utils/debounce';
import { GeocodeSuggestion, reverseGeocode } from '../utils/osmGeocoding';
import {
  APPROXIMATE_DEFAULT_LOCATION,
  formatAccuracyMeters,
  geolocationErrorMessage,
  isGeolocationSupported,
  isSecureForGeolocation,
  queryGeolocationPermission,
  requestUserLocation,
  UserLocationSource,
  watchUserLocation,
} from '../utils/geolocation';

// Define default center for map
const defaultCenter = {
  lat: 14.5995,
  lng: 120.9842,
};

/** Bus positions merged on the API (includes tracking server when configured). */
const BUS_LIVE_REFRESH_MS = 10_000;

// Lazy load non-map components (Leaflet must not lazy-load — causes init crash)
const BusSelector = lazy(() => import('../components/tracker/BusSelector'));
const BusDetails = lazy(() => import('../components/tracker/BusDetails'));
const RouteDetails = lazy(() => import('../components/tracker/RouteDetails'));
const PickupTrackingBanner = lazy(() => import('../components/tracker/PickupTrackingBanner'));

// Loading component for Suspense fallback
const LoadingComponent = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

export default function TrackerPage() {
  const { busId } = useParams<{ busId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthAPI();
  const pickupMode =
    searchParams.get('pickup') === '1' || searchParams.get('mode') === 'pickup';
  const fromBooking = searchParams.get('fromBooking') === '1';
  const { state, dispatch, refreshETAs, selectBus } = useBusTracking();
  const [map, setMap] = useState<LeafletMap | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const handleMapLoad = useCallback((m: LeafletMap) => {
    mapRef.current = m;
    setMap(m);
  }, []);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationSource, setUserLocationSource] = useState<UserLocationSource | null>(null);
  const [userPickupAddress, setUserPickupAddress] = useState<string | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  // Refs to track if component is mounted and watch ID
  const isMounted = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  const locationRequestRef = useRef<Promise<{ lat: number; lng: number } | null> | null>(null);
  const loadingSafetyTimerRef = useRef<number | null>(null);

  const clearLoadingSafetyTimer = useCallback(() => {
    if (loadingSafetyTimerRef.current != null) {
      window.clearTimeout(loadingSafetyTimerRef.current);
      loadingSafetyTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      clearLoadingSafetyTimer();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [clearLoadingSafetyTimer]);

  // Check location permission status
  const checkLocationPermission = useCallback(async () => {
    const state = await queryGeolocationPermission();
    if (state === 'unsupported') {
      setPermissionStatus('not-supported');
      return;
    }
    setPermissionStatus(state);
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        permission.onchange = () => {
          setPermissionStatus(permission.state);
        };
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  const applyUserLocation = useCallback(
    (
      location: { lat: number; lng: number },
      accuracy: number | null,
      startWatch: boolean,
      source: UserLocationSource,
      address?: string | null
    ) => {
      setUserLocation({ lat: location.lat, lng: location.lng });
      setUserLocationSource(source);
      setLocationAccuracy(accuracy);
      setLastUpdate(new Date());
      if (source !== 'approximate') {
        setPermissionStatus('granted');
      }
      setLocationError(null);
      if (address !== undefined) {
        setUserPickupAddress(address);
      }

      const activeMap = mapRef.current;
      if (activeMap) {
        setMapCenter({ lat: location.lat, lng: location.lng });
        activeMap.setView([location.lat, location.lng], pickupMode ? 16 : activeMap.getZoom());
      }

      if (startWatch && pickupMode && source === 'gps' && watchIdRef.current == null) {
        watchIdRef.current = watchUserLocation(
          (loc) => {
            setUserLocation({ lat: loc.lat, lng: loc.lng });
            setUserLocationSource('gps');
            setLocationAccuracy(loc.accuracy ?? null);
            setLastUpdate(new Date());
          },
          (err) => console.warn('Live location watch:', geolocationErrorMessage(err))
        );
        setIsTracking(true);
      }
    },
    [pickupMode]
  );

  const persistPickupLocation = useCallback(
    async (
      location: { lat: number; lng: number },
      address: string | null,
      source: UserLocationSource
    ) => {
      if (!activeBookingId) return;
      try {
        await authAPI.updateBookingPickup(activeBookingId, {
          userId: user?.id,
          pickup_address: address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
          pickup_lat: location.lat,
          pickup_lng: location.lng,
          pickup_location_source: source,
        });
      } catch (error) {
        console.warn('Could not save pickup location to booking:', error);
      }
    },
    [activeBookingId, user?.id]
  );

  const schedulePersistPickup = useRef(
    debounce(
      (
        location: { lat: number; lng: number },
        address: string | null,
        source: UserLocationSource
      ) => {
        void persistPickupLocation(location, address, source);
      },
      800
    )
  ).current;

  const setPickupFromSearch = useCallback(
    (suggestion: GeocodeSuggestion) => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
      }
      const location = { lat: suggestion.lat, lng: suggestion.lng };
      applyUserLocation(location, 20, false, 'search', suggestion.formattedAddress);
      schedulePersistPickup(location, suggestion.formattedAddress, 'search');
    },
    [applyUserLocation, schedulePersistPickup]
  );

  const setManualPickupLocation = useCallback(
    (location: { lat: number; lng: number }) => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
      }
      applyUserLocation(location, 10, false, 'manual');
      void reverseGeocode(location.lat, location.lng).then((address) => {
        setUserPickupAddress(address);
        schedulePersistPickup(location, address, 'manual');
      });
    },
    [applyUserLocation, schedulePersistPickup]
  );

  const useApproximateLocation = useCallback(() => {
    clearLoadingSafetyTimer();
    setLocationLoading(false);
    setLocationError(null);
    applyUserLocation(
      { lat: APPROXIMATE_DEFAULT_LOCATION.lat, lng: APPROXIMATE_DEFAULT_LOCATION.lng },
      APPROXIMATE_DEFAULT_LOCATION.accuracy ?? null,
      false,
      'approximate'
    );
    return APPROXIMATE_DEFAULT_LOCATION;
  }, [applyUserLocation, clearLoadingSafetyTimer]);

  const runLocationRequest = useCallback(
    async (fresh: boolean) => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
      }

      const location = await requestUserLocation({ fresh, highAccuracy: true });
      applyUserLocation(location, location.accuracy ?? null, true, 'gps');
      const address = await reverseGeocode(location.lat, location.lng);
      setUserPickupAddress(address);
      schedulePersistPickup({ lat: location.lat, lng: location.lng }, address, 'gps');
      return { lat: location.lat, lng: location.lng };
    },
    [applyUserLocation, schedulePersistPickup]
  );

  // Get user's current location — only on user click (never auto on mount)
  const getUserLocation = useCallback(async () => {
    if (locationRequestRef.current) {
      return locationRequestRef.current;
    }

    if (!isGeolocationSupported()) {
      setLocationError('Geolocation is not supported by your browser.');
      return null;
    }

    if (!isSecureForGeolocation()) {
      setLocationError('Location requires HTTPS or open the app at http://localhost:5175 (not LAN IP).');
      return null;
    }

    const permission = await queryGeolocationPermission();
    if (permission === 'denied') {
      setPermissionStatus('denied');
      setLocationError(
        'Location is blocked. Click the lock icon in the address bar → Site settings → Allow Location, then refresh.'
      );
      return null;
    }

    const run = (async () => {
      setLocationLoading(true);
      setLocationError(null);
      clearLoadingSafetyTimer();
      loadingSafetyTimerRef.current = window.setTimeout(() => {
        setLocationLoading(false);
        setLocationError(
          'Location is taking too long. Enable Windows Location Services, allow browser location, or tap "Use approximate location".'
        );
        loadingSafetyTimerRef.current = null;
      }, 20000);

      try {
        return await runLocationRequest(true);
      } catch (error) {
        const message = geolocationErrorMessage(error);
        setLocationError(message);
        if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        }
        return null;
      } finally {
        clearLoadingSafetyTimer();
        setLocationLoading(false);
      }
    })();

    locationRequestRef.current = run;
    try {
      return await run;
    } finally {
      locationRequestRef.current = null;
    }
  }, [runLocationRequest, clearLoadingSafetyTimer]);

  const refreshUserLocation = useCallback(async () => {
    if (locationRequestRef.current) {
      return locationRequestRef.current;
    }

    if (!isGeolocationSupported() || !isSecureForGeolocation()) {
      setLocationError('Enable location in browser settings, or drag the pink pin on the map.');
      return null;
    }

    const run = (async () => {
      setLocationLoading(true);
      setLocationError(null);
      clearLoadingSafetyTimer();
      loadingSafetyTimerRef.current = window.setTimeout(() => {
        setLocationLoading(false);
        setLocationError('GPS is slow. Drag the pink pin on the map to your exact pickup spot.');
        loadingSafetyTimerRef.current = null;
      }, 22000);

      try {
        return await runLocationRequest(true);
      } catch (error) {
        setLocationError(geolocationErrorMessage(error));
        return null;
      } finally {
        clearLoadingSafetyTimer();
        setLocationLoading(false);
      }
    })();

    locationRequestRef.current = run;
    try {
      return await run;
    } finally {
      locationRequestRef.current = null;
    }
  }, [runLocationRequest, clearLoadingSafetyTimer]);

  // Start real-time location tracking (after user already granted permission)
  const startLocationTracking = useCallback(async (seedLocation?: { lat: number; lng: number } | null) => {
    if (!isGeolocationSupported() || !isSecureForGeolocation()) {
      setLocationError('Location requires HTTPS or open the app at http://localhost:5175 (not LAN IP).');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocationError(null);

    let anchor = seedLocation || userLocation;

    if (!anchor) {
      setLocationLoading(true);
      try {
        const result = await runLocationRequest(true);
        if (!result) return;
        anchor = result;
      } catch (error) {
        if (isMounted.current) {
          setLocationError(geolocationErrorMessage(error));
          if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
            setPermissionStatus('denied');
          }
        }
        return;
      } finally {
        clearLoadingSafetyTimer();
        setLocationLoading(false);
      }
    }

    setIsTracking(true);

    watchIdRef.current = watchUserLocation(
      (location) => {
        if (!isMounted.current) return;
        setUserLocation({ lat: location.lat, lng: location.lng });
        setUserLocationSource('gps');
        setLocationAccuracy(location.accuracy ?? null);
        setLastUpdate(new Date());
        setPermissionStatus('granted');
      },
      (error) => {
        if (!isMounted.current) return;
        setLocationError(geolocationErrorMessage(error));
        setIsTracking(false);
      }
    );
  }, [userLocation, runLocationRequest, clearLoadingSafetyTimer]);

  // Stop real-time location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Toggle location tracking — request GPS first if we don't have it yet
  const toggleLocationTracking = useCallback(async () => {
    if (isTracking) {
      stopLocationTracking();
      return;
    }

    if (!userLocation) {
      const location = await getUserLocation();
      if (!location) return;
      if (pickupMode) return;
      await startLocationTracking({ lat: location.lat, lng: location.lng });
      return;
    }

    await startLocationTracking(userLocation);
  }, [isTracking, userLocation, getUserLocation, pickupMode, startLocationTracking, stopLocationTracking]);

  // Do NOT auto-request location on mount — browsers require a user click (Allow button)

  // Always honor bus id from URL
  useEffect(() => {
    if (!busId) return;
    selectBus(busId);
  }, [busId, selectBus]);

  // After booking: lock tracker to the booked bus in pickup mode
  useEffect(() => {
    if ((!pickupMode && !fromBooking) || !busId) return;
    selectBus(busId);
  }, [pickupMode, fromBooking, busId, selectBus]);

  // If user just booked but landed without pickup URL, redirect to pickup tracker
  useEffect(() => {
    if (!fromBooking || !busId) return;
    if (!pickupMode) {
      navigate(`/tracker/${busId}?pickup=1&fromBooking=1`, { replace: true });
    }
  }, [fromBooking, busId, pickupMode, navigate]);

  // Load buses with caching
  useEffect(() => {
    const loadBuses = async () => {
      if (!isMounted.current) return;
      
      try {
        const buses = await cachedApiCall(
          'buses',
          async () => {
            return await authAPI.getBuses();
          },
          5 * 60 * 1000
        );
        
        if (!isMounted.current) return;
        dispatch({ type: 'SET_BUSES', payload: buses });
        
        if (busId) {
          const bus = buses.find((b: Bus) => b.id === busId);
          if (bus) selectBus(bus.id);
        } else if (buses.length > 0 && !state.selectedBusId && !pickupMode) {
          selectBus(buses[0].id);
        }
      } catch (error) {
        if (!isMounted.current) return;
        console.error('Failed to load buses:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load bus data. Using fallback data.' });
      }
    };

    const debouncedLoadBuses = debounce(loadBuses, 300);
    debouncedLoadBuses();
    
    return () => {
      // Cleanup
    };
  }, [busId, dispatch, selectBus, state.selectedBusId, pickupMode]);

  // Refresh live ETAs/coordinates periodically while tracker is visible
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void refreshETAs();
      }
    };

    tick();
    const intervalId = window.setInterval(tick, BUS_LIVE_REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshETAs();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refreshETAs]);

  // Pickup mode: resolve active booking + load saved pickup from DB
  useEffect(() => {
    if (!pickupMode || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const bookings = await authAPI.getUserBookings(user.id);
        if (cancelled || !Array.isArray(bookings)) return;
        const sorted = [...bookings].sort(
          (a: { created_at?: string }, b: { created_at?: string }) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        const trackable = sorted.find((b: {
          bus_id?: string;
          status?: string;
          payment_status?: string;
          id?: string;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          pickup_address?: string | null;
          pickup_location_source?: UserLocationSource | null;
        }) => {
          const status = String(b.status || '').toLowerCase();
          const matchesBus = !busId || b.bus_id === busId;
          return (
            matchesBus &&
            Boolean(b.bus_id) &&
            (status === 'confirmed' || status === 'pending' || b.payment_status === 'paid')
          );
        });
        if (!trackable) return;

        if (trackable.id) setActiveBookingId(trackable.id);
        if (!busId && trackable.bus_id) {
          navigate(`/tracker/${trackable.bus_id}?pickup=1`, { replace: true });
        }

        const plat = trackable.pickup_lat != null ? Number(trackable.pickup_lat) : NaN;
        const plng = trackable.pickup_lng != null ? Number(trackable.pickup_lng) : NaN;
        if (Number.isFinite(plat) && Number.isFinite(plng) && !userLocation) {
          applyUserLocation(
            { lat: plat, lng: plng },
            null,
            false,
            (trackable.pickup_location_source as UserLocationSource) || 'search',
            trackable.pickup_address || null
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupMode, busId, user?.id, navigate, applyUserLocation, userLocation]);

  // Pickup view: fit map handled inside BusMap (avoid duplicate fitBounds crashes)
  useEffect(() => {
    if (!map || !isMounted.current || pickupMode) return;
    
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
            map.panTo([newCenter.lat, newCenter.lng]);
          }
        }, 300);
        
        debouncedPan();
      }
    } else if (userLocation) {
      // Center on user location if no bus is selected
      setMapCenter(userLocation);
      const debouncedPan = debounce(() => {
        if (map && isMounted.current) {
          map.panTo([userLocation.lat, userLocation.lng]);
        }
      }, 300);
      debouncedPan();
    } else {
      setMapCenter(defaultCenter);
    }
  }, [state.selectedBusId, state.busETAs, map, userLocation, pickupMode]);

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
          map.panTo([newCenter.lat, newCenter.lng]);
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

  // Show location prompt in pickup mode only until user allows GPS
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

  const showLocationBanner = pickupMode && !userLocation;

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto" style={{ position: 'relative' }}>
      {showLocationBanner && (
        <div className="mb-4 rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <MapPin size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-800">Find your pickup point</h2>
              <p className="mt-1 text-sm text-gray-600">
                Type your pickup address (e.g. Madjaas Payatas) or use GPS. Drag the pin on the map if needed.
              </p>
              <PickupLocationSearch
                className="mt-3"
                disabled={locationLoading}
                onSelect={setPickupFromSearch}
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => void getUserLocation()}
                  disabled={locationLoading}
                  className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
                >
                  {locationLoading ? 'Getting location…' : '📍 Enable my location'}
                </button>
                <button
                  type="button"
                  onClick={useApproximateLocation}
                  disabled={locationLoading}
                  className="rounded-xl border border-pink-300 bg-white px-4 py-3 text-sm font-semibold text-pink-700 shadow-sm hover:bg-pink-50 disabled:opacity-60"
                >
                  Use approximate location
                </button>
              </div>
              {locationError && (
                <p className="mt-2 text-sm text-red-600">{locationError}</p>
              )}
              {permissionStatus === 'denied' && (
                <p className="mt-2 text-xs text-gray-500">
                  Location is blocked. Use the lock icon in the address bar → Site settings → Allow Location, then refresh.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            {pickupMode ? 'Track your pickup' : 'Auro Ride'}
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            {pickupMode
              ? 'Watch your booked bus come to you on the map'
              : 'Bus position refreshes automatically every few seconds while this page is open'}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {/* Location Tracking Button */}
          <button
            onClick={() => void toggleLocationTracking()}
            disabled={locationLoading}
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
        {pickupMode && (
          <ErrorBoundary>
            <PickupTrackingBanner
              selectedBusETA={selectedBusETA || null}
              userLocation={userLocation}
              busNumber={selectedBusETA?.busNumber || selectedBus?.bus_number}
              routeName={selectedBusETA?.route?.name}
              isRefreshing={state.isRefreshing}
              onEnableLocation={getUserLocation}
              locationLoading={locationLoading}
              locationError={locationError}
            />
          </ErrorBoundary>
        )}

        {/* Bus Selector — hidden in pickup mode (booked bus only) */}
        {!pickupMode && (
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
        )}

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
              const arr = [];
              if (startTerminal) arr.push(startTerminal);
              if (endTerminal) arr.push(endTerminal);
              return arr;
            })()}
            onMapLoad={handleMapLoad}
            center={mapCenter}
            userLocation={userLocation}
            pickupMode={pickupMode}
            locationError={locationError}
            locationLoading={locationLoading}
            pickupAddress={userPickupAddress}
            onSearchPickup={setPickupFromSearch}
            onRequestLocation={getUserLocation}
            onRefreshLocation={refreshUserLocation}
            onUseApproximateLocation={useApproximateLocation}
            onUserLocationChange={setManualPickupLocation}
            userLocationSource={userLocationSource}
            locationAccuracy={locationAccuracy}
            onLocationUpdate={(location) => {
              setManualPickupLocation(location);
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
              pickupMode={pickupMode}
              userLocation={userLocation}
              userAddress={userPickupAddress}
              onEnableLocation={getUserLocation}
              onSearchPickup={setPickupFromSearch}
              onUseApproximateLocation={useApproximateLocation}
              locationLoading={locationLoading}
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