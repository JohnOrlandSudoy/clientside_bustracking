import React, { useState, useEffect, useCallback, memo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { BusETA, Terminal } from '../../types';

interface BusMapProps {
  selectedBusETA: BusETA | null;
  startTerminal: Terminal | null;
  endTerminal: Terminal | null;
  onMapLoad: (map: google.maps.Map) => void;
  center: { lat: number; lng: number };
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
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
  onMapLoad,
  center
}: BusMapProps) => {
  // Use the Google Maps JS API loader hook
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    id: 'google-map-script'
  });

  // Polyline path for the route
  const path = [
    startTerminal?.location || center,
    selectedBusETA?.currentLocation || center,
    endTerminal?.location || center
  ];

  // Memoize the map instance to prevent unnecessary re-renders
  const onLoadCallback = useCallback((map: google.maps.Map) => {
    onMapLoad(map);
  }, [onMapLoad]);

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
      {selectedBusETA?.currentLocation && (
        <Marker
          position={selectedBusETA.currentLocation}
          label="Bus"
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/shapes/bus.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
        />
      )}
      {startTerminal?.location && (
        <Marker
          position={startTerminal.location}
          label="Start"
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
        />
      )}
      {endTerminal?.location && (
        <Marker
          position={endTerminal.location}
          label="End"
          icon={{
            url: 'https://maps.google.com/mapfiles/kml/paddle/red-circle.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
        />
      )}
      {path.length >= 2 && (
        <Polyline
          path={path}
          options={{
            strokeColor: '#FF1493',
            strokeOpacity: 0.8,
            strokeWeight: 4
          }}
        />
      )}
    </GoogleMap>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedBusMapContent = memo(BusMapContent);

const BusMap: React.FC<BusMapProps> = (props) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Bus Location</h3>
      <MemoizedBusMapContent {...props} />
    </div>
  );
};

export default memo(BusMap);