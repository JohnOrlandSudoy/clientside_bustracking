import React, { useEffect, useState } from 'react';
import { Clock, MapPin, Navigation, Users } from 'lucide-react';
import { Bus, BusETA } from '../../types';
import PickupLocationSearch from './PickupLocationSearch';
import { GeocodeSuggestion, reverseGeocode } from '../../utils/osmGeocoding';
import { normalizeLatLng, isValidLatLng } from '../../utils/location';
import { distanceKm, estimateEtaMinutes, formatDistance, formatEtaMinutes } from '../../utils/geo';

interface BusDetailsProps {
  selectedBus: Bus;
  selectedBusETA: BusETA | null;
  loadingETA: boolean;
  onBookNow: (busId: string) => void;
  pickupMode?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  userAddress?: string | null;
  onEnableLocation?: () => void | Promise<unknown>;
  onSearchPickup?: (suggestion: GeocodeSuggestion) => void;
  onUseApproximateLocation?: () => void;
  locationLoading?: boolean;
}

const BusDetails: React.FC<BusDetailsProps> = ({
  selectedBus,
  selectedBusETA,
  loadingETA,
  onBookNow,
  pickupMode = false,
  userLocation,
  userAddress,
  onEnableLocation,
  onSearchPickup,
  onUseApproximateLocation,
  locationLoading = false,
}) => {
  const [busAddress, setBusAddress] = useState<string | null>(null);
  const busLocation = (() => {
    const loc = normalizeLatLng(selectedBusETA?.currentLocation);
    if (!loc || !isValidLatLng(loc)) return null;
    return loc;
  })();
  const busLocationLive = selectedBusETA?.locationSource === 'employee_live';

  useEffect(() => {
    if (!busLocation) {
      setBusAddress(null);
      return;
    }
    let active = true;
    void reverseGeocode(busLocation.lat, busLocation.lng).then((addr) => {
      if (active) setBusAddress(addr);
    });
    return () => {
      active = false;
    };
  }, [busLocation?.lat, busLocation?.lng]);

  const distanceLabel =
    pickupMode && userLocation && busLocation
      ? formatDistance(
          distanceKm(userLocation.lat, userLocation.lng, busLocation.lat, busLocation.lng)
        )
      : null;
  const etaLabel =
    pickupMode && userLocation && busLocation
      ? formatEtaMinutes(
          estimateEtaMinutes(
            distanceKm(userLocation.lat, userLocation.lng, busLocation.lat, busLocation.lng)
          )
        )
      : null;

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
          {selectedBusETA?.route?.name || 'Unknown Route'}
        </h3>
        <div className="flex items-center bg-pink-50 px-2 sm:px-3 py-1 rounded-full">
          <Clock size={14} className="text-pink-600 mr-1" />
          <span className="text-pink-600 font-semibold text-xs sm:text-sm">
            {loadingETA ? 'Loading...' : etaLabel || selectedBusETA?.eta || 'ETA: --'}
          </span>
        </div>
      </div>

      {pickupMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-emerald-50 rounded-xl p-2.5 sm:p-3 border border-emerald-100">
            <div className="flex items-center text-emerald-700 mb-1">
              <Navigation size={14} className="mr-1" />
              <span className="text-xs sm:text-sm font-medium">Your pickup point</span>
            </div>
            {onSearchPickup && (
              <PickupLocationSearch
                className="mb-2"
                disabled={locationLoading}
                onSelect={onSearchPickup}
                placeholder="Type address (e.g. Madjaas Payatas)"
              />
            )}
            <p className="font-semibold text-gray-800 text-xs sm:text-sm">
              {userLocation
                ? userAddress || `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
                : 'Search address above or enable GPS'}
            </p>
            {!userLocation && onEnableLocation && (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => void onEnableLocation()}
                  disabled={locationLoading}
                  className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {locationLoading ? 'Getting location…' : '📍 Enable my location'}
                </button>
                {onUseApproximateLocation && (
                  <button
                    type="button"
                    onClick={onUseApproximateLocation}
                    disabled={locationLoading}
                    className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-60"
                  >
                    Use approximate location
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5 sm:p-3 border border-blue-100">
            <div className="flex items-center text-blue-700 mb-1">
              <MapPin size={14} className="mr-1" />
              <span className="text-xs sm:text-sm font-medium">Bus location (driver GPS)</span>
            </div>
            <p className="font-semibold text-gray-800 text-xs sm:text-sm">
              {busLocation
                ? busAddress || `${busLocation.lat.toFixed(5)}, ${busLocation.lng.toFixed(5)}`
                : 'Waiting for driver app GPS…'}
            </p>
            {busLocation && !busLocationLive && (
              <p className="mt-1 text-xs text-amber-700">Last known position — live when driver is online</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
            <div className="flex items-center text-gray-600 mb-1">
              <MapPin size={14} className="mr-1" />
              <span className="text-xs sm:text-sm">Bus location (driver GPS)</span>
            </div>
            <p className="font-semibold text-gray-800 text-xs sm:text-sm break-all">
              {busLocation
                ? busAddress || `${busLocation.lat.toFixed(6)}, ${busLocation.lng.toFixed(6)}`
                : 'Location unavailable — driver must be online'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
            <div className="flex items-center text-gray-600 mb-1">
              <Users size={14} className="mr-1" />
              <span className="text-xs sm:text-sm">Bus Number</span>
            </div>
            <p className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
              {selectedBusETA?.busNumber || selectedBus.bus_number || '--'}
            </p>
          </div>
        </div>
      )}

      {pickupMode && distanceLabel && (
        <p className="text-sm text-pink-600 font-medium mb-3">
          Bus is {distanceLabel} away from you
          {etaLabel ? ` · ${etaLabel}` : ''}
        </p>
      )}

      <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-xl p-3 sm:p-4 text-white">
        <h4 className="font-semibold mb-1 text-sm sm:text-base">
          {pickupMode ? 'Your booked ride' : 'Route Information'}
        </h4>
        <p className="text-pink-100 text-xs sm:text-sm truncate">
          {selectedBusETA?.route?.name || 'Unknown Route'}
        </p>
        <p className="text-xs sm:text-sm text-pink-100 mt-2 truncate">
          Bus: {selectedBusETA?.busNumber || selectedBus.bus_number || '--'}
        </p>
        {!pickupMode && (
          <button
            onClick={() => onBookNow(selectedBus.id)}
            className="mt-3 text-xs sm:text-sm bg-white text-pink-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-pink-100 transition-all duration-200 touch-target"
          >
            Book This Bus
          </button>
        )}
      </div>
    </div>
  );
};

export default BusDetails;
