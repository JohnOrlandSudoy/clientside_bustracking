import React from 'react';
import { BusETA, Terminal } from '../../types';

interface RouteDetailsProps {
  selectedBusETA: BusETA | null;
  startTerminal: Terminal | null;
  endTerminal: Terminal | null;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
  selectedBusETA,
  startTerminal,
  endTerminal
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Route Details</h3>
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full mr-4 border-2 bg-green-100 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-0.5"></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-green-700">Start Terminal</h4>
              <span className="text-xs px-2 py-1 rounded-full border bg-green-100 text-green-700 border-green-200">
                {startTerminal?.name || selectedBusETA?.route.start_terminal_id || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full mr-4 border-2 bg-pink-100 text-pink-700 border-pink-200">
            <div className="w-2 h-2 bg-pink-500 rounded-full mx-auto mt-0.5 animate-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-pink-700">Current Location</h4>
              <span className="text-xs px-2 py-1 rounded-full border bg-pink-100 text-pink-700 border-pink-200">
                {selectedBusETA?.currentLocation
                  ? `Lat: ${selectedBusETA.currentLocation.lat}, Lng: ${selectedBusETA.currentLocation.lng}`
                  : 'En route'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full mr-4 border-2 bg-gray-100 text-gray-600 border-gray-200"></div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-600">End Terminal</h4>
              <span className="text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                {endTerminal?.name || selectedBusETA?.route.end_terminal_id || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetails;