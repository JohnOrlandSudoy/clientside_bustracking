import React, { useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuthAPI } from '../hooks/useAuthAPI';
import { Notification } from '../types';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthAPI();
  const { state, loadNotifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();

  // Load notifications when component mounts
  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
    }
  }, [user?.id, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllAsRead(user.id);
    }
  };

  // Handle manual refresh
  const handleManualRefresh = useCallback(async () => {
    if (user?.id && !state.isLoading) {
      await refreshNotifications(user.id);
    }
  }, [user?.id, refreshNotifications, state.isLoading]);

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
      case 'urgent': return 'border-red-500 bg-red-50 text-red-700';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'normal': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'low': return 'border-gray-500 bg-gray-50 text-gray-700';
      default: return 'border-blue-500 bg-blue-50 text-blue-700';
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

  const getTypeLabel = (type: string): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            <p className="text-gray-600">
              {state.unreadCount > 0 ? `${state.unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {state.unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-2 text-sm text-pink-600 hover:text-pink-700 font-medium bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
          
          <button
            onClick={handleManualRefresh}
            disabled={state.isLoading}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={state.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <span className="font-medium">{state.error}</span>
          </div>
          <p className="text-red-600 text-sm mt-2">
            Try refreshing the page or check your connection.
          </p>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {state.isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : state.notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No notifications yet</h3>
            <p className="text-gray-500 text-sm">We'll notify you about important updates, route changes, and announcements</p>
          </div>
        ) : (
          state.notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
                !notification.is_read ? 'ring-2 ring-blue-200 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div className="text-3xl">{getTypeIcon(notification.type)}</div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">
                        {notification.title || getTypeLabel(notification.type)}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                    {notification.message}
                  </p>
                  
                  {/* Action Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Type: {getTypeLabel(notification.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {notification.is_read ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCheck size={14} />
                          <span>Read</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors"
                        >
                          <Check size={14} />
                          <span>Mark as read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        {state.notifications.length > 0 && (
          <p className="text-gray-500 text-sm mb-2">
            You have {state.notifications.length} notification{state.notifications.length !== 1 ? 's' : ''}
          </p>
        )}
        {state.lastFetchTime && (
          <p className="text-gray-400 text-xs">
            Last updated: {new Date(state.lastFetchTime).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
