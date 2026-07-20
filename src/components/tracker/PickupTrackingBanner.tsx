import React from 'react';
import { Bus, Clock, MapPin, Navigation } from 'lucide-react';
import { BusETA } from '../../types';
import { distanceKm, estimateEtaMinutes, formatDistance, formatEtaMinutes } from '../../utils/geo';

interface PickupTrackingBannerProps {
  selectedBusETA: BusETA | null;
  userLocation: { lat: number; lng: number } | null;
  busNumber?: string;
  routeName?: string;
  isRefreshing?: boolean;
  onEnableLocation?: () => void | Promise<unknown>;
  locationLoading?: boolean;
  locationError?: string | null;
}

const PickupTrackingBanner: React.FC<PickupTrackingBannerProps> = ({
  selectedBusETA,
  userLocation,
  busNumber,
  routeName,
  isRefreshing,
  onEnableLocation,
  locationLoading = false,
  locationError,
}) => {
  const busLoc = selectedBusETA?.currentLocation;
  const hasLiveBus = selectedBusETA?.locationSource === 'employee_live';
  const hasAnyBus = Boolean(busLoc);

  let distanceLabel = 'Waiting for bus location…';
  let etaLabel = '—';
  let statusLabel = 'Connecting to your bus';

  if (userLocation && busLoc) {
    const km = distanceKm(
      userLocation.lat,
      userLocation.lng,
      busLoc.lat,
      busLoc.lng
    );
    const etaMin = estimateEtaMinutes(km);
    distanceLabel = `${formatDistance(km)} away`;
    etaLabel = formatEtaMinutes(etaMin);
    statusLabel = km < 0.3 ? 'Your bus is nearby' : 'Your bus is on the way to you';
  } else if (!userLocation) {
    statusLabel = 'Enable location to see yourself and the bus on the map';
  } else if (!hasAnyBus) {
    statusLabel = 'Bus location will appear when the driver is online';
  } else if (!hasLiveBus) {
    statusLabel = 'Showing last known bus position — live GPS when driver is online';
  }

  return (
    <div className="mb-4 rounded-2xl overflow-hidden shadow-lg border border-pink-200 bg-gradient-to-br from-pink-500 via-pink-500 to-rose-500 text-white">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-pink-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
              Pickup tracking
            </p>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5">{statusLabel}</h2>
            {(routeName || busNumber) && (
              <p className="text-pink-100 text-xs sm:text-sm mt-1 flex items-center gap-1">
                <Bus size={14} />
                {busNumber ? `Bus ${busNumber}` : ''}
                {routeName ? ` · ${routeName}` : ''}
              </p>
            )}
          </div>
          {isRefreshing && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full shrink-0">Updating…</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center text-pink-100 text-xs mb-1">
              <MapPin size={12} className="mr-1" />
              Distance
            </div>
            <p className="font-bold text-sm sm:text-base">{distanceLabel}</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center text-pink-100 text-xs mb-1">
              <Clock size={12} className="mr-1" />
              Est. arrival
            </div>
            <p className="font-bold text-sm sm:text-base">{etaLabel}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-pink-100 flex items-start gap-1.5">
          <Navigation size={12} className="shrink-0 mt-0.5" />
          Like ride-hailing: watch the bus move on the map as it heads to your pickup point.
        </p>

        {!userLocation && onEnableLocation && (
          <button
            type="button"
            onClick={() => void onEnableLocation()}
            disabled={locationLoading}
            className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-pink-600 shadow disabled:opacity-60"
          >
            {locationLoading ? 'Getting your location…' : '📍 Enable my location on map'}
          </button>
        )}
        {locationError && (
          <p className="mt-2 text-xs text-pink-100">{locationError}</p>
        )}
      </div>
    </div>
  );
};

export default PickupTrackingBanner;
