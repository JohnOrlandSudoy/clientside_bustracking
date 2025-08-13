import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuthAPI } from '../hooks/useAuthAPI';
import { Notification } from '../types';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthAPI();
  const { state, loadNotifications, markAsRead, markAllAsRead, refreshNotifications, forceLoadNotifications } = useNotifications();

  // Load notifications when user changes - ONLY ONCE
  useEffect(() => {
    if (user?.id && state.notifications.length === 0 && !state.isLoading) {
      loadNotifications(user.id);
    }
  }, [user?.id, state.notifications.length, state.isLoading, loadNotifications]);

  // Handle manual refresh with debouncing
  const handleManualRefresh = useCallback(async () => {
    if (user?.id && !state.isLoading) {
      await refreshNotifications(user.id);
    }
  }, [user?.id, refreshNotifications, state.isLoading]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead(user.id);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'route_change': return '🛣️';
      case 'delay': return '⏰';
      case 'cancellation': return '❌';
      case 'reminder': return '🔔';
      default: return '📝';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {/* Unread Badge */}
        {state.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {state.unreadCount > 99 ? '99+' : state.unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-white">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center gap-2">
              {state.unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleToggle}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                <span>{state.error}</span>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {state.isLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading notifications...</p>
              </div>
            ) : state.notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs">We'll notify you about important updates</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {state.notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {notification.title || notification.type.replace('_', ' ').toUpperCase()}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Priority and Status */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          
                          {notification.is_read ? (
                            <CheckCheck size={16} className="text-green-500" />
                          ) : (
                            <Check size={16} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                onClick={handleManualRefresh}
                disabled={state.isLoading}
                className="text-xs text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => forceLoadNotifications(user.id)}
                disabled={state.isLoading}
                className="text-xs text-pink-600 hover:text-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Force load notifications (bypasses throttling)"
              >
                Force Load
              </button>
            </div>
            {state.lastFetchTime && (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(state.lastFetchTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleToggle}
        />
      )}
    </div>
  );
}
