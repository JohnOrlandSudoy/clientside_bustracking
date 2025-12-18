import React, { useEffect, useState } from 'react';
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
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if needed
    if ((!startTerminal || !endTerminal) && selectedBusETA?.route) {
      setLoading(true);
      (async () => {
        try {
          const data = await (await import('../../lib/api')).authAPI.getTerminals();
          setTerminals(data || []);
        } catch (err) {
          setTerminals([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [startTerminal, endTerminal, selectedBusETA]);

  // Helper to get terminal name by ID
  const getTerminalName = (id: string | undefined | null) => {
    if (!id) return 'Unknown';
    const found = terminals.find(t => t.id === id);
    return found ? found.name : 'Unknown';
  };

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Route Details</h3>
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-4 border-2 bg-green-100 text-green-700 border-green-200 flex-shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mx-auto mt-0.5"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <h4 className="font-semibold text-green-700 text-xs sm:text-sm">Start Terminal</h4>
              <span className="text-xs px-2 py-1 rounded-full border bg-green-100 text-green-700 border-green-200 truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]">
                {startTerminal?.name || getTerminalName(selectedBusETA?.route.start_terminal_id) || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-4 border-2 bg-pink-100 text-pink-700 border-pink-200 flex-shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full mx-auto mt-0.5 animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <h4 className="font-semibold text-pink-700 text-xs sm:text-sm">Current Location</h4>
              <span className="text-xs px-2 py-1 rounded-full border bg-pink-100 text-pink-700 border-pink-200 truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]">
                {selectedBusETA?.currentLocation
                  ? `Lat: ${selectedBusETA.currentLocation.lat.toFixed(6)}, Lng: ${selectedBusETA.currentLocation.lng.toFixed(6)}`
                  : 'En route'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-4 border-2 bg-gray-100 text-gray-600 border-gray-200 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
              <h4 className="font-semibold text-gray-600 text-xs sm:text-sm">End Terminal</h4>
              <span className="text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200 truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]">
                {endTerminal?.name || getTerminalName(selectedBusETA?.route.end_terminal_id) || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {loading && (
        <div className="text-xs text-gray-400 mt-2">Loading terminal info...</div>
      )}
    </div>
  );
};

export default RouteDetails;