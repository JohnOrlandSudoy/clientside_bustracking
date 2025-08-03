import React, { useState, useEffect } from 'react';
import { Terminal } from '../types';
import { terminalAPI } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { MapPin, Plus } from 'lucide-react';

export const TerminalsTab: React.FC = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const response = await terminalAPI.getTerminals();
      setTerminals(response.data);
    } catch (err) {
      setError('Failed to fetch terminals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await terminalAPI.createTerminal({
        name: formData.name,
        address: formData.address,
      });
      await fetchTerminals();
      setShowForm(false);
      setFormData({ name: '', address: '' });
    } catch (err) {
      setError('Failed to create terminal');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Terminal Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Add Terminal Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Add New Terminal</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terminal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
              >
                Create Terminal
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

      {/* Terminals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center mb-3">
              <div className="bg-pink-100 p-2 rounded-lg mr-3">
                <MapPin className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{terminal.name}</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Address:</strong> {terminal.address}</p>
            </div>
          </div>
        ))}
      </div>

      {terminals.length === 0 && !loading && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No terminals found. Add your first terminal!</p>
        </div>
      )}
    </div>
  );
};