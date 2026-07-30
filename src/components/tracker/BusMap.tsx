import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusETA, Terminal } from '../../types';
import { MAP_TILE_CONFIG } from '../../constants/map';
import { reverseGeocode } from '../../utils/osmGeocoding';
import { formatAccuracyMeters, UserLocationSource } from '../../utils/geolocation';
import { isValidLatLng, normalizeLatLng } from '../../utils/location';
import PickupLocationSearch from './PickupLocationSearch';
import {
  busIcon,
  endTerminalIcon,
  ensureLeafletDefaultIcons,
  routeTerminalIcon,
  startTerminalIcon,
  userLocationIcon,
} from '../../utils/leafletSetup';

ensureLeafletDefaultIcons();

const MAP_INSTANCE_KEY = 'auroride-tracker-osm';

interface BusMapProps {
  selectedBusETA: BusETA | null;
  startTerminal: Terminal | null;
  endTerminal: Terminal | null;
  terminals: Terminal[];
  routeTerminals: Terminal[];
  onMapLoad: (map: LeafletMap) => void;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  userLocationSource?: UserLocationSource | null;
  locationAccuracy?: number | null;
  centerLocationRef?: React.MutableRefObject<(() => void) | null>;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onUserLocationChange?: (location: { lat: number; lng: number }) => void;
  onRequestLocation?: () => void | Promise<unknown>;
  onRefreshLocation?: () => void | Promise<unknown>;
  onUseApproximateLocation?: () => void;
  onSearchPickup?: (suggestion: import('../../utils/osmGeocoding').GeocodeSuggestion) => void;
  pickupAddress?: string | null;
  locationError?: string | null;
  locationLoading?: boolean;
  userAddress?: string | null;
  isLoadingAddress?: boolean;
  pickupMode?: boolean;
}

function resolveBusLocation(eta: BusETA | null, _pickupMode?: boolean) {
  const loc = normalizeLatLng(eta?.currentLocation);
  if (!loc || !isValidLatLng(loc)) return null;
  return loc;
}

function isLiveBusLocation(eta: BusETA | null): boolean {
  return eta?.locationSource === 'employee_live';
}

function PickupMapClick({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewport({
  center,
  userLocation,
  busLocation,
  pickupMode,
  onMapLoad,
  centerLocationRef,
}: {
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  busLocation?: { lat: number; lng: number } | null;
  pickupMode?: boolean;
  onMapLoad: (map: LeafletMap) => void;
  centerLocationRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const map = useMap();
  const mapLoadedRef = useRef(false);
  const fitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeUser = isValidLatLng(userLocation) ? userLocation : null;
  const safeBus = isValidLatLng(busLocation) ? busLocation : null;

  useEffect(() => {
    if (!mapLoadedRef.current) {
      mapLoadedRef.current = true;
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  useEffect(() => {
    if (centerLocationRef) {
      centerLocationRef.current = () => {
        try {
          if (pickupMode && safeUser && safeBus) {
            map.fitBounds(L.latLngBounds([safeUser.lat, safeUser.lng], [safeBus.lat, safeBus.lng]), {
              padding: [60, 60],
              maxZoom: 16,
            });
          } else if (safeUser) {
            map.setView([safeUser.lat, safeUser.lng], 16);
          }
        } catch (err) {
          console.warn('Map center failed:', err);
        }
      };
    }
  }, [map, centerLocationRef, safeUser, safeBus, pickupMode]);

  useEffect(() => {
    if (fitTimerRef.current) clearTimeout(fitTimerRef.current);

    fitTimerRef.current = setTimeout(() => {
      try {
        if (pickupMode && safeUser && safeBus) {
          map.fitBounds(L.latLngBounds([safeUser.lat, safeUser.lng], [safeBus.lat, safeBus.lng]), {
            padding: [60, 60],
            maxZoom: 16,
          });
          return;
        }
        if (safeUser) {
          map.setView([safeUser.lat, safeUser.lng], 15);
          return;
        }
        if (safeBus) {
          map.setView([safeBus.lat, safeBus.lng], 15);
          return;
        }
        if (isValidLatLng(center)) {
          map.setView([center.lat, center.lng], 12);
        }
      } catch (err) {
        console.warn('Map viewport update failed:', err);
      }
    }, 120);

    return () => {
      if (fitTimerRef.current) clearTimeout(fitTimerRef.current);
    };
  }, [map, pickupMode, safeUser, safeBus, center.lat, center.lng]);

  return null;
}

const BusMapContent = ({
  selectedBusETA,
  startTerminal,
  endTerminal,
  terminals,
  routeTerminals,
  onMapLoad,
  center,
  userLocation,
  userLocationSource,
  locationAccuracy,
  centerLocationRef,
  onUserLocationChange,
  userAddress,
  isLoadingAddress,
  pickupMode = false,
}: BusMapProps) => {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<
    Array<{ lat: number; lng: number; timestamp: string }>
  >([]);

  const safeUser = isValidLatLng(userLocation) ? userLocation : null;
  const busLocation = resolveBusLocation(selectedBusETA, pickupMode);
  const busLocationLive = isLiveBusLocation(selectedBusETA);

  useEffect(() => {
    if (!safeUser) return;
    setLocationHistory((prev) => {
      const next = [...prev, { ...safeUser, timestamp: new Date().toISOString() }];
      return next.length > 50 ? next.slice(-50) : next;
    });
  }, [safeUser?.lat, safeUser?.lng]);

  const routePath: [number, number][] =
    !pickupMode && routeTerminals && routeTerminals.length > 1
      ? routeTerminals
          .map((t) => normalizeLatLng(t.location))
          .filter(isValidLatLng)
          .map((p) => [p.lat, p.lng])
      : [];

  const historyPath: [number, number][] = locationHistory.map((p) => [p.lat, p.lng]);
  const initialCenter: [number, number] = safeUser
    ? [safeUser.lat, safeUser.lng]
    : busLocation
      ? [busLocation.lat, busLocation.lng]
      : isValidLatLng(center)
        ? [center.lat, center.lng]
        : [14.5995, 120.9842];

  const safeTerminals = terminals.filter((t) => isValidLatLng(normalizeLatLng(t.location)));

  return (
    <MapContainer
      key={MAP_INSTANCE_KEY}
      center={initialCenter}
      zoom={15}
      style={{ height: '500px', width: '100%', borderRadius: '16px' }}
      scrollWheelZoom
    >
      <TileLayer url={MAP_TILE_CONFIG.url} attribution={MAP_TILE_CONFIG.attribution} />
      {pickupMode && onUserLocationChange && (
        <PickupMapClick enabled={Boolean(safeUser)} onPick={(lat, lng) => onUserLocationChange({ lat, lng })} />
      )}
      <MapViewport
        center={center}
        userLocation={safeUser}
        busLocation={busLocation}
        pickupMode={pickupMode}
        onMapLoad={onMapLoad}
        centerLocationRef={centerLocationRef}
      />

      {historyPath.length > 1 && pickupMode && (
        <Polyline positions={historyPath} pathOptions={{ color: '#10B981', weight: 4, opacity: 0.8 }} />
      )}

      {safeUser && locationAccuracy != null && locationAccuracy > 40 && (
        <Circle
          center={[safeUser.lat, safeUser.lng]}
          radius={locationAccuracy}
          pathOptions={{ color: '#EC4899', fillColor: '#EC4899', fillOpacity: 0.12, weight: 1 }}
        />
      )}

      {safeUser && (
        <Marker
          position={[safeUser.lat, safeUser.lng]}
          icon={userLocationIcon}
          draggable={pickupMode && Boolean(onUserLocationChange)}
          eventHandlers={{
            click: () => setSelectedMarker('user-location'),
            dragend: (event) => {
              if (!onUserLocationChange) return;
              const marker = event.target;
              const { lat, lng } = marker.getLatLng();
              onUserLocationChange({ lat, lng });
            },
          }}
        >
          {selectedMarker === 'user-location' && (
            <Popup onClose={() => setSelectedMarker(null)}>
              <div className="text-sm min-w-[240px]">
                <div className="font-bold text-green-700 mb-1">
                  📍 Your pickup
                  {userLocationSource === 'search'
                    ? ' (from address search)'
                    : userLocationSource === 'manual'
                      ? ' (adjusted by you)'
                      : userLocationSource === 'approximate'
                        ? ' (approximate)'
                        : ' (GPS)'}
                </div>
                {pickupMode && onUserLocationChange && (
                  <p className="text-xs text-gray-600 mb-1">Drag this pin or tap the map if the spot is wrong.</p>
                )}
                {isLoadingAddress ? (
                  <p className="text-xs text-gray-500">Getting address…</p>
                ) : userAddress ? (
                  <p className="text-xs text-gray-700">{userAddress}</p>
                ) : null}
                <p className="text-xs font-mono text-gray-500 mt-1">
                  {safeUser.lat.toFixed(6)}, {safeUser.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          )}
        </Marker>
      )}

      {busLocation && (
        <Marker
          position={[busLocation.lat, busLocation.lng]}
          icon={busIcon}
          eventHandlers={{ click: () => setSelectedMarker('bus-location') }}
        >
          {selectedMarker === 'bus-location' && (
            <Popup onClose={() => setSelectedMarker(null)}>
              <div className="text-sm">
                <div className="font-bold text-blue-700">
                  {busLocationLive ? '🚌 Bus location (driver GPS — live)' : '🚌 Bus location (last known)'}
                </div>
                {!busLocationLive && pickupMode && (
                  <p className="text-xs text-amber-700 mt-1">
                    Driver app is offline. Position may be outdated until the driver goes online.
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {selectedBusETA?.busNumber ? `Bus ${selectedBusETA.busNumber}` : 'Live from employee app'}
                </p>
                <p className="text-xs font-mono text-gray-500 mt-1">
                  {busLocation.lat.toFixed(6)}, {busLocation.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          )}
        </Marker>
      )}

      {!pickupMode && startTerminal?.location && isValidLatLng(normalizeLatLng(startTerminal.location)) && (
        <Marker
          position={[startTerminal.location.lat, startTerminal.location.lng]}
          icon={startTerminalIcon}
        >
          <Popup>{startTerminal.name || 'Start terminal'}</Popup>
        </Marker>
      )}

      {!pickupMode && endTerminal?.location && isValidLatLng(normalizeLatLng(endTerminal.location)) && (
        <Marker
          position={[endTerminal.location.lat, endTerminal.location.lng]}
          icon={endTerminalIcon}
        >
          <Popup>{endTerminal.name || 'End terminal'}</Popup>
        </Marker>
      )}

      {!pickupMode &&
        safeTerminals
          .filter((t) => t.id !== startTerminal?.id && t.id !== endTerminal?.id)
          .map((terminal) => (
            <Marker
              key={terminal.id}
              position={[terminal.location.lat, terminal.location.lng]}
              icon={routeTerminalIcon}
            >
              <Popup>{terminal.name}</Popup>
            </Marker>
          ))}

      {routePath.length > 1 && (
        <Polyline positions={routePath} pathOptions={{ color: '#FF1493', weight: 4, opacity: 0.8 }} />
      )}

      {safeUser && busLocation && (
        <Polyline
          positions={[
            [safeUser.lat, safeUser.lng],
            [busLocation.lat, busLocation.lng],
          ]}
          pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.7, dashArray: '8 8' }}
        />
      )}
    </MapContainer>
  );
};

const MemoizedBusMapContent = memo(BusMapContent);

function ClientOnlyMap(props: BusMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div className="h-[500px] w-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-500">
        Loading map…
      </div>
    );
  }
  return <MemoizedBusMapContent {...props} />;
}

const BusMap: React.FC<BusMapProps> = (props) => {
  const {
    pickupMode = false,
    onRequestLocation,
    onRefreshLocation,
    onUseApproximateLocation,
    onUserLocationChange,
    onSearchPickup,
    locationError,
    locationLoading = false,
    locationAccuracy,
    userLocationSource,
    pickupAddress,
  } = props;
  const [showControls, setShowControls] = useState(() => pickupMode && !isValidLatLng(props.userLocation));
  const [localLocationError, setLocalLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const centerLocationRef = useRef<(() => void) | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  const safeUser = isValidLatLng(props.userLocation) ? props.userLocation : null;
  const busLocation = resolveBusLocation(props.selectedBusETA, pickupMode);
  const busLocationLive = isLiveBusLocation(props.selectedBusETA);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distanceToBus =
    safeUser && busLocation
      ? calculateDistance(safeUser.lat, safeUser.lng, busLocation.lat, busLocation.lng)
      : null;

  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      return await reverseGeocode(lat, lng);
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  useEffect(() => {
    if (pickupAddress) {
      setUserAddress(pickupAddress);
      return;
    }
    if (!safeUser) {
      setUserAddress(null);
      return;
    }
    let active = true;
    setUserAddress(null);
    void getAddressFromCoordinates(safeUser.lat, safeUser.lng).then((address) => {
      if (active && address) setUserAddress(address);
    });
    return () => {
      active = false;
    };
  }, [safeUser?.lat, safeUser?.lng, pickupAddress, getAddressFromCoordinates]);

  useEffect(() => {
    if (pickupMode && !safeUser) {
      setShowControls(true);
    }
  }, [pickupMode, safeUser]);

  const accuracyLabel = formatAccuracyMeters(locationAccuracy);
  const locationSourceLabel =
    userLocationSource === 'search'
      ? 'From typed address'
      : userLocationSource === 'manual'
        ? 'Adjusted on map'
        : userLocationSource === 'approximate'
          ? 'Approximate area only'
          : 'From device GPS';

  const triggerRefreshLocation = async () => {
    const handler = onRefreshLocation ?? onRequestLocation;
    if (!handler) {
      setLocalLocationError('Location handler is not available. Please refresh the page.');
      return;
    }
    if (locationLoading) return;
    setLocalLocationError(null);
    try {
      const result = await handler();
      const gotLocation =
        result &&
        typeof result === 'object' &&
        'lat' in result &&
        'lng' in result &&
        isValidLatLng(result as { lat: number; lng: number });
      if (gotLocation) {
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
        centerLocationRef.current?.();
      }
    } catch (error) {
      setLocalLocationError(
        error instanceof Error ? error.message : 'Could not refresh your location. Drag the pin on the map.'
      );
    }
  };

  const displayLocationError = locationError || localLocationError;

  return (
    <div id="bus-map-section" className="mb-6 relative z-0">
      <div className="auroride-map-shell relative">
        <ClientOnlyMap
          {...props}
          pickupMode={pickupMode}
          centerLocationRef={centerLocationRef}
          userAddress={userAddress}
          isLoadingAddress={isLoadingAddress}
          onMapLoad={(map) => {
            mapInstanceRef.current = map;
            props.onMapLoad(map);
          }}
        />

        {pickupMode && !safeUser && (
          <div className="absolute bottom-4 left-1/2 z-20 flex w-[min(100%,20rem)] -translate-x-1/2 flex-col gap-2 px-3">
            <button
              type="button"
              onClick={() => void triggerRefreshLocation()}
              disabled={locationLoading}
              className="rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {locationLoading ? 'Getting location…' : '📍 Enable my location'}
            </button>
            {onUseApproximateLocation && (
              <button
                type="button"
                onClick={onUseApproximateLocation}
                disabled={locationLoading}
                className="rounded-full border border-white bg-white/95 px-4 py-2 text-xs font-semibold text-pink-700 shadow disabled:opacity-60"
              >
                Use approximate location instead
              </button>
            )}
          </div>
        )}

        {pickupMode && safeUser && busLocation && (
          <div className="absolute bottom-4 right-4 z-20 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-md border border-gray-200 space-y-1 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-pink-500" />
              You (device GPS)
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
              Bus (driver GPS)
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          className="absolute top-4 right-4 z-20 bg-white p-2 rounded-lg shadow-md border hover:bg-gray-50 transition-colors"
          title="Location controls"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {showControls && (
          <div className="absolute top-16 right-4 z-20 w-80 space-y-4">
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <h3 className="font-semibold text-gray-800 mb-1">Location Controls</h3>
              <p className="text-xs text-gray-500 mb-3">Map: OpenStreetMap · type address or use GPS</p>
              {pickupMode && onSearchPickup && (
                <PickupLocationSearch
                  className="mb-3"
                  disabled={locationLoading}
                  onSelect={onSearchPickup}
                  placeholder="Type pickup (e.g. Madjaas Payatas)"
                />
              )}
              {locationSuccess && (
                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                  Location enabled successfully.
                </div>
              )}
              {safeUser ? (
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-100 border border-green-200 rounded-lg text-sm text-green-700">
                    📍 Pickup set · {locationSourceLabel}
                  </div>
                  {accuracyLabel && userLocationSource === 'gps' && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                      GPS accuracy {accuracyLabel}. If wrong, drag the pink pin or tap the map.
                    </p>
                  )}
                  {userLocationSource === 'approximate' && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                      This is only an approximate area. Drag the pin to your exact pickup spot.
                    </p>
                  )}
                  {pickupMode && (
                    <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2">
                      Wrong spot? <strong>Drag the pink pin</strong> or <strong>tap the map</strong> where you are waiting.
                    </p>
                  )}
                  {busLocation ? (
                    <div className="flex items-center p-3 bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-700">
                      🚌 Driver GPS received
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg text-sm text-amber-800">
                      {busLocation
                        ? 'Showing last known bus position — live GPS when driver app is online.'
                        : 'Waiting for driver GPS — employee app must be online on this bus.'}
                    </div>
                  )}
                  {userAddress && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                      {userAddress}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => centerLocationRef.current?.()}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm"
                  >
                    Show me &amp; bus on map
                  </button>
                  <button
                    type="button"
                    onClick={() => void triggerRefreshLocation()}
                    disabled={locationLoading}
                    className="w-full py-2 px-3 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                  >
                    {locationLoading ? 'Getting precise GPS…' : 'Refresh with precise GPS'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => void triggerRefreshLocation()}
                    disabled={locationLoading}
                    className="w-full py-2 px-3 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                  >
                    {locationLoading ? 'Requesting location…' : 'Enable location tracking'}
                  </button>
                  {displayLocationError && (
                    <p className="text-xs text-red-600">{displayLocationError}</p>
                  )}
                </div>
              )}
            </div>
            {distanceToBus != null && (
              <div className="bg-white rounded-lg shadow-lg border p-4 text-center text-blue-600 font-medium text-sm">
                📏 {distanceToBus.toFixed(2)} km to bus
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BusMap);
