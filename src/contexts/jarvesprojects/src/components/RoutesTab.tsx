import React, { useState, useEffect } from 'react';
import { Route, Terminal } from '../types';
import { routeAPI, terminalAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { Route as RouteIcon, Plus, ArrowRight } from 'lucide-react';

export const RoutesTab: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_terminal_id: '',
    end_terminal_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routesResponse, terminalsResponse] = await Promise.all([
        routeAPI.getRoutes(),
        terminalAPI.getTerminals(),
      ]);
      setRoutes(routesResponse.data);
      setTerminals(terminalsResponse.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await routeAPI.createRoute(formData);
      await fetchData();
      setShowForm(false);
      setFormData({ name: '', start_terminal_id: '', end_terminal_id: '' });
    } catch (err) {
      setError('Failed to create route');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Route Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Route
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Add Route Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Add New Route</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Terminal</label>
                <select
                  value={formData.start_terminal_id}
                  onChange={(e) => setFormData(prev => ({...prev, start_terminal_id: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Select Start Terminal</option>
                  {terminals.map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Terminal</label>
                <select
                  value={formData.end_terminal_id}
                  onChange={(e) => setFormData(prev => ({...prev, end_terminal_id: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">Select End Terminal</option>
                  {terminals.map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
              >
                Create Route
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 p-2 rounded-lg mr-3">
                <RouteIcon className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
            </div>
            
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Start</p>
                <p className="text-lg font-semibold text-pink-600">{route.start_terminal.name}</p>
                <p className="text-xs text-gray-500">{route.start_terminal.address}</p>
              </div>
              
              <ArrowRight className="h-6 w-6 text-pink-500" />
              
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">End</p>
                <p className="text-lg font-semibold text-pink-600">{route.end_terminal.name}</p>
                <p className="text-xs text-gray-500">{route.end_terminal.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {routes.length === 0 && !loading && (
        <div className="text-center py-12">
          <RouteIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No routes found. Add your first route!</p>
        </div>
      )}
    </div>
  );
};