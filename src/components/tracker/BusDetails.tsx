import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';
import { Bus, BusETA } from '../../types';

interface BusDetailsProps {
  selectedBus: Bus;
  selectedBusETA: BusETA | null;
  loadingETA: boolean;
  onBookNow: (busId: string) => void;
}

const BusDetails: React.FC<BusDetailsProps> = ({
  selectedBus,
  selectedBusETA,
  loadingETA,
  onBookNow
}) => {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
          {selectedBusETA?.route?.name || 'Unknown Route'}
        </h3>
        <div className="flex items-center bg-pink-50 px-2 sm:px-3 py-1 rounded-full">
          <Clock size={14} className="text-pink-600 mr-1" />
          <span className="text-pink-600 font-semibold text-xs sm:text-sm">
            {loadingETA ? 'Loading...' : selectedBusETA?.eta || 'ETA: --'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
          <div className="flex items-center text-gray-600 mb-1">
            <MapPin size={14} className="mr-1" />
            <span className="text-xs sm:text-sm">Current Location</span>
          </div>
          <p className="font-semibold text-gray-800 text-xs sm:text-sm break-all">
            {selectedBusETA?.currentLocation 
              ? `Lat: ${selectedBusETA.currentLocation.lat.toFixed(6)}, Lng: ${selectedBusETA.currentLocation.lng.toFixed(6)}`
              : 'Location unavailable'}
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

      <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-xl p-3 sm:p-4 text-white">
        <h4 className="font-semibold mb-1 text-sm sm:text-base">Route Information</h4>
        <p className="text-pink-100 text-xs sm:text-sm truncate">
          {selectedBusETA?.route?.name || 'Unknown Route'}
        </p>
        <p className="text-xs sm:text-sm text-pink-100 mt-2 truncate">
          Bus: {selectedBusETA?.busNumber || selectedBus.bus_number || '--'}
        </p>
        <button
          onClick={() => onBookNow(selectedBus.id)}
          className="mt-3 text-xs sm:text-sm bg-white text-pink-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-pink-100 transition-all duration-200 touch-target"
        >
          Book This Bus
        </button>
      </div>
    </div>
  );
};

export default BusDetails;