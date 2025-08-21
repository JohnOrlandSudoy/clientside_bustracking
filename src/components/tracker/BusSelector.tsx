import React from 'react';
import { Navigation, Clock, Users } from 'lucide-react';
import { Bus, BusETA } from '../../types';

interface BusSelectorProps {
  buses: Bus[];
  busETAs: BusETA[];
  selectedBusId: string | null;
  loadingETA: boolean;
  onSelectBus: (bus: Bus) => void;
  onETAClick: (bus: Bus) => void;
  onBookNow: (busId: string) => void;
}

const BusSelector: React.FC<BusSelectorProps> = ({
  buses,
  busETAs,
  selectedBusId,
  loadingETA,
  onSelectBus,
  onETAClick,
  onBookNow
}) => {
  // Ref for scrolling the map into view
  const mapSectionRef = React.useRef<HTMLDivElement | null>(null);

  // Scroll to map when a bus is selected
  const handleSelectBus = (bus: Bus) => {
    onSelectBus(bus);
    // Try to scroll the map section into view
    setTimeout(() => {
      const mapSection = document.getElementById('bus-map-section');
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3">Select Bus Route</h3>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {buses.map((bus) => {
          const busETA = busETAs.find(eta => eta.busId === bus.id);
          return (
            <button
              key={bus.id}
              onClick={() => handleSelectBus(bus)}
              className={`p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedBusId === bus.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  {/* Route Name - Truncated if too long */}
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base truncate mb-1">
                    {busETA?.route.name || 'Unknown Route'}
                  </h4>
                  
                  {/* ETA with icon */}
                  <div className="flex items-center mb-2">
                    <Clock size={12} className="mr-1 text-pink-600 flex-shrink-0" />
                    <p
                      className="text-xs sm:text-sm text-pink-600 cursor-pointer hover:underline truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        onETAClick(bus);
                      }}
                    >
                      {loadingETA ? 'Loading ETA...' : 
                       busETA ? `ETA: ${busETA.eta}` : 'ETA: --'}
                    </p>
                  </div>
                  
                  {/* Seats info */}
                  <div className="flex items-center mb-2">
                    <Users size={12} className="mr-1 text-gray-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      {bus.available_seats !== undefined ? `${bus.available_seats} seats` : 'Seats: --'}
                    </span>
                  </div>
                  
                  {/* Book Now Button */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookNow(bus.id);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        onBookNow(bus.id);
                      }
                    }}
                    className="inline-block text-xs sm:text-sm text-white bg-gradient-to-r from-pink-500 to-pink-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400 touch-target"
                  >
                    Book Now
                  </span>
                </div>
                
                {/* Right side info - Bus number and ID */}
                <div className="text-right flex-shrink-0 min-w-0">
                  {/* Bus Number */}
                  <div className="flex items-center justify-end text-pink-600 text-xs sm:text-sm mb-1">
                    <Navigation size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate max-w-[60px] sm:max-w-[80px] lg:max-w-[100px]">
                      {busETA?.busNumber || bus.bus_number || '--'}
                    </span>
                  </div>
                  
                  {/* Bus ID - Truncated with ellipsis */}
                  <div className="text-xs text-gray-500">
                    <div className="truncate max-w-[80px] sm:max-w-[100px] lg:max-w-[120px] font-mono">
                      {bus.id.length > 12 ? `${bus.id.slice(0, 8)}...` : bus.id}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BusSelector;