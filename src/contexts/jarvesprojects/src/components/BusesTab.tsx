import React, { useState, useEffect } from 'react';
import { Bus } from '../types';
import { busAPI } from '../utils/api';
import { BusMap } from './BusMap';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { Settings, Users, MapPin } from 'lucide-react';

export const BusesTab: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [reassignForm, setReassignForm] = useState({
    driver_id: '',
    conductor_id: '',
    route_id: '',
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await busAPI.getBuses();
      setBuses(response.data);
    } catch (err) {
      setError('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;

    try {
      await busAPI.reassignBus(selectedBus.id, reassignForm);
      await fetchBuses();
      setSelectedBus(null);
      setReassignForm({ driver_id: '', conductor_id: '', route_id: '' });
    } catch (err) {
      setError('Failed to reassign bus');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Bus Management</h2>
        <button
          onClick={fetchBuses}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Map */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-pink-600" />
          Bus Locations
        </h3>
        <BusMap buses={buses} />
      </div>

      {/* Bus Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buses.map((bus) => (
          <div key={bus.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bus {bus.bus_number}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                {bus.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Seats: {bus.available_seats}/{bus.total_seats}
              </div>
              {bus.current_location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Lat: {bus.current_location.lat.toFixed(4)}, Lng: {bus.current_location.lng.toFixed(4)}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBus(bus)}
              className="mt-4 w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Reassign
            </button>
          </div>
        ))}
      </div>

      {/* Reassignment Modal */}
      {selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Reassign Bus {selectedBus.bus_number}</h3>
            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID</label>
                <input
                  type="text"
                  value={reassignForm.driver_id}
                  onChange={(e) => setReassignForm(prev => ({...prev, driver_id: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conductor ID</label>
                <input
                  type="text"
                  value={reassignForm.conductor_id}
                  onChange={(e) => setReassignForm(prev => ({...prev, conductor_id: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route ID</label>
                <input
                  type="text"
                  value={reassignForm.route_id}
                  onChange={(e) => setReassignForm(prev => ({...prev, route_id: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
                >
                  Reassign
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBus(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};