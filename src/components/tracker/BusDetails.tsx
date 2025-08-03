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
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {selectedBusETA?.route?.name || 'Unknown Route'}
        </h3>
        <div className="flex items-center bg-pink-50 px-3 py-1 rounded-full">
          <Clock size={16} className="text-pink-600 mr-1" />
          <span className="text-pink-600 font-semibold">
            {loadingETA ? 'Loading...' : selectedBusETA?.eta || 'ETA: --'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center text-gray-600 mb-1">
            <MapPin size={16} className="mr-1" />
            <span className="text-sm">Current Location</span>
          </div>
          <p className="font-semibold text-gray-800 text-sm">
            {selectedBusETA?.currentLocation 
              ? `Lat: ${selectedBusETA.currentLocation.lat}, Lng: ${selectedBusETA.currentLocation.lng}`
              : 'Location unavailable'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center text-gray-600 mb-1">
            <Users size={16} className="mr-1" />
            <span className="text-sm">Bus Number</span>
          </div>
          <p className="font-semibold text-gray-800">
            {selectedBusETA?.busNumber || selectedBus.bus_number || '--'}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-xl p-4 text-white">
        <h4 className="font-semibold mb-1">Route Information</h4>
        <p className="text-pink-100">
          {selectedBusETA?.route?.name || 'Unknown Route'}
        </p>
        <p className="text-sm text-pink-100 mt-2">
          Bus: {selectedBusETA?.busNumber || selectedBus.bus_number || '--'}
        </p>
        <button
          onClick={() => onBookNow(selectedBus.id)}
          className="mt-3 text-sm bg-white text-pink-600 px-4 py-2 rounded-lg font-semibold hover:bg-pink-100 transition-all duration-200"
        >
          Book This Bus
        </button>
      </div>
    </div>
  );
};

export default BusDetails;