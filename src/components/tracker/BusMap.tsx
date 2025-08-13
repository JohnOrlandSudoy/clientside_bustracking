import React, { useCallback, memo, useRef, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { BusETA, Terminal } from '../../types';

interface BusMapProps {
  selectedBusETA: BusETA | null;
  startTerminal: Terminal | null;
  endTerminal: Terminal | null;
  terminals: Terminal[]; // all terminals
  routeTerminals: Terminal[]; // ordered terminals for the selected route
  onMapLoad: (map: google.maps.Map) => void;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  centerLocationRef?: React.MutableRefObject<(() => void) | null>;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  userAddress?: string | null;
  isLoadingAddress?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
};

// Simple map fallback component
const SimpleMap = () => (
  <div className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center p-4">
        <p className="text-gray-600 mb-2">Map unavailable</p>
        <p className="text-sm text-gray-500">Using simplified view</p>
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-4 h-4 bg-pink-500 rounded-full animate-ping"></div>
    </div>
  </div>
);

const BusMapContent = ({
  selectedBusETA,
  startTerminal,
  endTerminal,
  terminals,
  routeTerminals,
  onMapLoad,
  center,
  userLocation,
  centerLocationRef,
  userAddress,
  isLoadingAddress
}: BusMapProps) => {
  // Use environment variable for Google Maps API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-script'
  });

  // Map instance ref
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // State for info windows and controls
  const [showControls, setShowControls] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{ lat: number; lng: number; timestamp: string }>>([]);

  // Memoize the map instance to prevent unnecessary re-renders
  const onLoadCallback = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    onMapLoad(map);
    
    // Set the center location function in the ref
    if (centerLocationRef) {
      centerLocationRef.current = () => {
        if (map && userLocation) {
          map.panTo(userLocation);
          map.setZoom(16);
          
          // Add a bounce animation effect
          const marker = new google.maps.Marker({
            position: userLocation,
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#EF4444",
              fillOpacity: 0.8,
              strokeColor: "#FFFFFF",
              strokeWeight: 3,
              scale: 20,
            },
            title: "Your location"
          });
          
          // Remove the temporary marker after animation
          setTimeout(() => {
            marker.setMap(null);
          }, 2000);
        }
      };
    }
    
    // Auto-center on user location if available
    if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(16); // Zoom in closer to user location
    }
  }, [onMapLoad, userLocation, centerLocationRef]);

  // Auto-center map when user location changes
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(16);
    }
  }, [userLocation]);

  // Update location history when user location changes
  useEffect(() => {
    if (userLocation) {
      setLocationHistory(prev => {
        const newHistory = [...prev, {
          lat: userLocation.lat,
          lng: userLocation.lng,
          timestamp: new Date().toISOString()
        }];
        
        // Keep only last 50 locations
        if (newHistory.length > 50) {
          return newHistory.slice(-50);
        }
        return newHistory;
      });
    }
  }, [userLocation]);

  // Polyline path for the full route (ordered terminals)
  const routePath = routeTerminals && routeTerminals.length > 1
    ? routeTerminals.map(t => t.location)
    : [];

  // Handle loading error
  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return <SimpleMap />;
  }

  // Handle loading state
  if (!isLoaded) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading Maps...</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={15}
      onLoad={onLoadCallback}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: true,
        maxZoom: 18,
        minZoom: 10
      }}
    >
      {/* User Location Marker - Live Tracking */}
      {userLocation && (
        <>
          {/* Location History Trail */}
          {locationHistory.length > 1 && (
            <Polyline
              path={locationHistory}
              options={{
                strokeColor: '#10B981',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                geodesic: true
              }}
            />
          )}
          
          {/* Pulsing effect marker */}
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#10B981",
              fillOpacity: 0.2,
              strokeColor: "#10B981",
              strokeWeight: 2,
              scale: 30,
            }}
          />
          
          {/* Main user location marker - Live Tracking */}
          <Marker
            position={userLocation}
            label={{
              text: "🚌 LIVE",
              color: "white",
              fontWeight: "bold",
              fontSize: "14px"
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#10B981", // Green color for live tracking
              fillOpacity: 1,
              strokeColor: "#FFFFFF", // White border
              strokeWeight: 3,
              scale: 18, // Larger size for prominence
            }}
            title="🚌 LIVE TRACKING - Your Current Location"
            onClick={() => {
              setSelectedMarker('user-location');
              if (centerLocationRef?.current) {
                centerLocationRef.current();
              }
            }}
            cursor="pointer"
          />
          
          {/* Inner highlight marker */}
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#FFFFFF",
              fillOpacity: 0.9,
              strokeColor: "#10B981",
              strokeWeight: 1,
              scale: 8,
            }}
          />
        </>
      )}

      {/* Bus Location Marker */}
      {selectedBusETA?.currentLocation && (
        <Marker
          position={selectedBusETA.currentLocation}
          label="Bus"
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/shapes/bus.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
          onClick={() => setSelectedMarker('bus-location')}
        />
      )}

      {/* Start Terminal Marker */}
      {startTerminal?.location && (
        <Marker
          position={startTerminal.location}
          label={startTerminal.name || 'Start'}
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
          onClick={() => setSelectedMarker('start-terminal')}
        />
      )}

      {/* End Terminal Marker */}
      {endTerminal?.location && (
        <Marker
          position={endTerminal.location}
          label={endTerminal.name || 'End'}
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
          onClick={() => setSelectedMarker('end-terminal')}
        />
      )}

      {/* Markers for all other terminals */}
      {terminals.filter(t => t.id !== startTerminal?.id && t.id !== endTerminal?.id).map(terminal => (
        <Marker
          key={terminal.id}
          position={terminal.location}
          label={terminal.name}
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/paddle/wht-circle.png',
            scaledSize: new google.maps.Size(28, 28)
          }}
          onClick={() => setSelectedMarker(`terminal-${terminal.id}`)}
        />
      ))}

      {/* Route Polyline for the full route */}
      {routePath.length > 1 && (
        <Polyline
          path={routePath}
          options={{
            strokeColor: '#FF1493',
            strokeOpacity: 0.8,
            strokeWeight: 4
          }}
        />
      )}

      {/* User to Bus Polyline (if user location available) */}
      {userLocation && selectedBusETA?.currentLocation && (
        <Polyline
          path={[userLocation, selectedBusETA.currentLocation]}
          options={{
            strokeColor: '#3B82F6',
            strokeOpacity: 0.6,
            strokeWeight: 3
          }}
        />
      )}

      {/* Info Windows */}
      {selectedMarker === 'user-location' && userLocation && (
        <InfoWindow
          position={userLocation}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div style={{ minWidth: 320 }} className="text-sm font-sans">
            <div className="flex items-center mb-3 pb-2 border-b border-green-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">🚌</span>
              </div>
              <div>
                <div className="font-bold text-green-700 text-lg">📍 LIVE TRACKING</div>
                <div className="text-sm text-gray-600">Your Current Location</div>
                <div className="text-xs text-green-600 font-medium">Real-time GPS Updates</div>
              </div>
            </div>

            {/* Address Section */}
            {userAddress && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/>
                    <path d="M7 7h.01"/>
                    <path d="M17 7h.01"/>
                  </svg>
                  <span className="font-medium text-gray-700">Current Address</span>
                </div>
                <div className="ml-6 p-2 bg-gray-50 rounded border text-xs text-gray-800">
                  📍 {userAddress}
                </div>
              </div>
            )}

            {/* GPS Coordinates Section */}
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/>
                </svg>
                <span className="font-medium text-gray-700">GPS Coordinates</span>
              </div>
              <div className="ml-6 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono text-gray-800">{userLocation.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono text-gray-800">{userLocation.lng.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium text-gray-800">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Address Loading State */}
            {isLoadingAddress && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 12.414a2 2 0 0 0-2.828 0l-4.243 4.243"/>
                  </svg>
                  <span className="font-medium text-gray-700">Getting Address...</span>
                </div>
                <div className="ml-6 flex items-center">
                  <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mr-2"></div>
                  <span className="text-xs text-gray-500">Resolving coordinates to address</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-green-200">
              <div className="text-xs text-green-600 font-medium">
                ✅ Live tracking active - Your position updates in real-time
              </div>
            </div>
          </div>
        </InfoWindow>
      )}

      {selectedMarker === 'bus-location' && selectedBusETA?.currentLocation && (
        <InfoWindow
          position={selectedBusETA.currentLocation}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div style={{ minWidth: 220 }} className="text-sm font-sans">
            <div className="flex items-center mb-2">
              <img src="https://maps.google.com/mapfiles/kml/shapes/bus.png" alt="Bus" className="w-6 h-6 mr-2" />
              <span className="font-bold text-blue-700 text-base">📍 Bus Location</span>
            </div>
            <div className="text-gray-700">
              <p>Current bus location</p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedBusETA.currentLocation.lat.toFixed(6)}, {selectedBusETA.currentLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedBusMapContent = memo(BusMapContent);

const BusMap: React.FC<BusMapProps> = (props) => {
  // State for location access and controls
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  
  // Refs to communicate with map content
  const centerLocationRef = useRef<(() => void) | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Calculate distance if user location and bus location are available
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const distanceToBus = props.userLocation && props.selectedBusETA?.currentLocation 
    ? calculateDistance(
        props.userLocation.lat, 
        props.userLocation.lng, 
        props.selectedBusETA.currentLocation.lat, 
        props.selectedBusETA.currentLocation.lng
      )
    : null;

  // Function to trigger location access
  const triggerLocationAccess = () => {
    if (navigator.geolocation) {
      setIsRequestingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsRequestingLocation(false);
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          console.log('Location accessed:', position.coords);
          
          // Show success feedback
          setLocationSuccess(true);
          setTimeout(() => setLocationSuccess(false), 3000); // Hide after 3 seconds
          
          // Get address for the new location
          getAddressFromCoordinates(newLocation.lat, newLocation.lng).then(address => {
            if (address) {
              setUserAddress(address);
            }
          });
          
          // Method 1: Trigger custom event for parent component
          console.log('🚀 Dispatching locationRequested event:', newLocation);
          window.dispatchEvent(new CustomEvent('locationRequested', {
            detail: newLocation
          }));
          
          // Method 2: Use callback if provided
          if (props.onLocationUpdate) {
            console.log('🚀 Calling onLocationUpdate callback:', newLocation);
            props.onLocationUpdate(newLocation);
          } else {
            console.log('⚠️ No onLocationUpdate callback provided');
          }
          
          // Method 3: Update local state for immediate feedback
          // This will show the location on the map even if parent doesn't update
          if (mapInstanceRef.current) {
            console.log('🚀 Centering map on new location:', newLocation);
            mapInstanceRef.current.panTo(newLocation);
            mapInstanceRef.current.setZoom(16);
          } else {
            console.log('⚠️ No map instance available for centering');
          }
        },
        (error) => {
          setIsRequestingLocation(false);
          console.error('Location access error:', error);
          
          let errorMessage = 'Unable to access location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information unavailable. Please check your GPS.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'Please check your browser settings.';
          }
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Function to center on user location
  const centerOnUserLocation = () => {
    if (centerLocationRef.current) {
      centerLocationRef.current();
    }
  };

  // Function to get address from coordinates using Google Geocoding API
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps not loaded yet, retrying in 1 second...');
      // Retry after a short delay if Google Maps isn't loaded yet
      setTimeout(() => {
        if (window.google && window.google.maps) {
          getAddressFromCoordinates(lat, lng);
        }
      }, 1000);
      return null;
    }

    setIsLoadingAddress(true);
    
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      
      if (result.results && result.results.length > 0) {
        const addressComponents = result.results[0];
        let address = '';
        
        // Try to get the most readable address format
        if (addressComponents.formatted_address) {
          address = addressComponents.formatted_address;
        } else {
          // Fallback: build address from components
          const components = addressComponents.address_components;
          const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || '';
          const route = components.find(c => c.types.includes('route'))?.long_name || '';
          const locality = components.find(c => c.types.includes('locality'))?.long_name || '';
          const administrativeArea = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '';
          
          if (streetNumber && route) {
            address = `${streetNumber} ${route}`;
          } else if (route) {
            address = route;
          }
          
          if (locality) {
            address += address ? `, ${locality}` : locality;
          }
          
          if (administrativeArea) {
            address += address ? `, ${administrativeArea}` : administrativeArea;
          }
        }
        
        console.log('📍 Address found:', address);
        return address;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Get address when userLocation changes
  useEffect(() => {
    if (props.userLocation && !userAddress) {
      getAddressFromCoordinates(props.userLocation.lat, props.userLocation.lng).then(address => {
        if (address) {
          setUserAddress(address);
        }
      });
    }
  }, [props.userLocation, userAddress, getAddressFromCoordinates]);

  return (
    <div className="mb-6 relative">
      {/* Map Container */}
      <div className="relative">
        <MemoizedBusMapContent 
          {...props} 
          centerLocationRef={centerLocationRef}
          userAddress={userAddress}
          isLoadingAddress={isLoadingAddress}
          onMapLoad={(map) => {
            mapInstanceRef.current = map;
            props.onMapLoad(map);
          }}
        />
        
        {/* Control Panel Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-4 right-4 z-10 bg-white p-2 rounded-lg shadow-md border hover:bg-gray-50 transition-colors"
          title="Toggle Control Panel"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Control Panel */}
        {showControls && (
          <div className="absolute top-16 right-4 z-10 w-80 space-y-4">
            {/* Location Controls */}
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Location Controls</h3>
              
              {props.userLocation ? (
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-100 border border-green-200 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-700 text-sm">🚌 Live Tracking Active</span>
                  </div>
                  
                  {/* Current Address Display */}
                  {userAddress && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-700 font-medium mb-1">📍 Current Address:</div>
                      <div className="text-xs text-blue-800">{userAddress}</div>
                    </div>
                  )}
                  
                  <button
                    onClick={centerOnUserLocation}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                  >
                    📍 Center on My Location
                  </button>
                  
                  <button
                    onClick={triggerLocationAccess}
                    disabled={isRequestingLocation}
                    className={`w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                      isRequestingLocation 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isRequestingLocation ? '🔄 Refreshing...' : '🔄 Refresh Location'}
                  </button>
                  
                  {/* Refresh Address Button */}
                  {props.userLocation && (
                    <button
                      onClick={() => {
                        if (props.userLocation) {
                          getAddressFromCoordinates(props.userLocation.lat, props.userLocation.lng).then(address => {
                            if (address) {
                              setUserAddress(address);
                            }
                          });
                        }
                      }}
                      disabled={isLoadingAddress}
                      className={`w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                        isLoadingAddress 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isLoadingAddress ? '🔄 Getting Address...' : '📍 Refresh Address'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-yellow-700 text-sm">Location Access Required</span>
                  </div>
                  
                  <button
                    onClick={triggerLocationAccess}
                    disabled={isRequestingLocation}
                    className={`w-full py-2 px-3 rounded-lg text-sm transition-colors ${
                      isRequestingLocation 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isRequestingLocation ? '🔄 Requesting...' : '📍 Enable Location Tracking'}
                  </button>
                </div>
              )}
            </div>

            {/* Map Legend */}
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Map Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">📍 Your Location (Live)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Bus</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Start Terminal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">End Terminal</span>
                </div>
                {distanceToBus && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-blue-600 font-medium text-center">
                      📏 {distanceToBus.toFixed(2)} km to bus
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Tracking Status */}
        {props.userLocation && (
          <div className="absolute top-4 left-4 z-10 bg-white border border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm shadow-md max-w-xs">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>🚌 Live Tracking</span>
            </div>
            {userAddress && (
              <div className="text-xs text-gray-600 border-t border-green-200 pt-1">
                📍 {userAddress}
              </div>
            )}
          </div>
        )}

        {/* Location Success Message */}
        {locationSuccess && (
          <div className="absolute top-4 left-4 z-10 bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg text-sm shadow-md animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>✅ Location accessed successfully!</span>
            </div>
          </div>
        )}

        {/* Location Access Status */}
        {!props.userLocation && !locationSuccess && (
          <div className="absolute top-16 left-4 z-10 bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-2 rounded-lg text-sm shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>📍 Enable location tracking</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BusMap);