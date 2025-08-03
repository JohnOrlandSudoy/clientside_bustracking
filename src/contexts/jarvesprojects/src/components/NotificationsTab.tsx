import React, { useState } from 'react';
import { NotificationPayload } from '../types';
import { notificationAPI } from '../utils/api';
import { ErrorAlert } from './ErrorAlert';
import { Send, Bell } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NotificationPayload>({
    recipient_id: '',
    type: 'general',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await notificationAPI.sendNotification(formData);
      setSuccess('Notification sent successfully!');
      setFormData({ recipient_id: '', type: 'general', message: '' });
    } catch (err) {
      setError('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { value: 'delay', label: 'Delay', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'route_change', label: 'Route Change', color: 'bg-blue-100 text-blue-800' },
    { value: 'traffic', label: 'Traffic Alert', color: 'bg-red-100 text-red-800' },
    { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Bell className="h-8 w-8 text-pink-600 mr-3" />
        <h2 className="text-3xl font-bold text-gray-900">Send Notifications</h2>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <div className="flex items-center">
            <Send className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient ID</label>
            <input
              type="text"
              value={formData.recipient_id}
              onChange={(e) => setFormData(prev => ({...prev, recipient_id: e.target.value}))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter recipient ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {notificationTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({...prev, type: type.value as any}))}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.type === type.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    formData.type === type.value ? 'bg-pink-100 text-pink-800' : type.color
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              placeholder="Enter your notification message..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">{formData.message.length}/500 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Send className="h-5 w-5 mr-2" />
            )}
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* Notification Preview */}
      {formData.message && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-pink-500">
            <div className="flex items-center mb-2">
              <Bell className="h-4 w-4 text-pink-600 mr-2" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                notificationTypes.find(t => t.value === formData.type)?.color
              }`}>
                {notificationTypes.find(t => t.value === formData.type)?.label}
              </span>
            </div>
            <p className="text-gray-800">{formData.message}</p>
            <p className="text-xs text-gray-500 mt-2">To: {formData.recipient_id || 'Recipient ID'}</p>
          </div>
        </div>
      )}
    </div>
  );
};