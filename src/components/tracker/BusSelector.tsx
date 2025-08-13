import React from 'react';
import { Navigation } from 'lucide-react';
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
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Bus Route</h3>
      <div className="grid grid-cols-1 gap-3">
        {buses.map((bus) => {
          const busETA = busETAs.find(eta => eta.busId === bus.id);
          return (
            <button
              key={bus.id}
              onClick={() => handleSelectBus(bus)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedBusId === bus.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800">{busETA?.route.name || 'Unknown Route'}</h4>
                  <p
                    className="text-sm text-pink-600 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onETAClick(bus);
                    }}
                  >
                    {loadingETA ? 'Loading ETA...' : 
                     busETA ? `ETA: ${busETA.eta}` : 'ETA: --'}
                  </p>
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
                    className="mt-2 inline-block text-sm text-white bg-gradient-to-r from-pink-500 to-pink-400 px-3 py-1 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    Book Now
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {bus.available_seats !== undefined ? `${bus.available_seats} seats` : 'Seats: --'}
                  </div>
                  <div className="flex items-center text-pink-600 text-sm">
                    <Navigation size={14} className="mr-1" />
                    {busETA?.busNumber || bus.bus_number || '--'}
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