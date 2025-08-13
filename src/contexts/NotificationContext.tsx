import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback } from 'react';
import { authAPI } from '../lib/api';
import { Notification } from '../types';
import { playNotificationSound, playUrgentNotificationSound } from '../utils/notificationSound';

// Define notification state interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  isRefreshing: boolean;
}

// Define notification action types
type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LAST_FETCH_TIME'; payload: number };

// Create context
const NotificationContext = createContext<{
  state: NotificationState;
  loadNotifications: (userId: string, force?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  refreshNotifications: (userId: string) => Promise<void>;
  forceLoadNotifications: (userId: string) => Promise<void>;
} | undefined>(undefined);

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetchTime: null,
  isRefreshing: false,
};

// Constants for throttling
const MIN_FETCH_INTERVAL = 30000; // 30 seconds minimum between API calls
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Reducer function
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  let newState: NotificationState;
  
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      const unreadCount = action.payload.filter(n => !n.is_read).length;
      newState = { 
        ...state, 
        notifications: action.payload, 
        unreadCount, 
        isLoading: false,
        isRefreshing: false,
        error: null
      };
      return newState;
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      const newUnreadCount = newNotifications.filter(n => !n.is_read).length;
      newState = { ...state, notifications: newNotifications, unreadCount: newUnreadCount };
      return newState;
    
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      );
      const updatedUnreadCount = updatedNotifications.filter(n => !n.is_read).length;
      newState = { ...state, notifications: updatedNotifications, unreadCount: updatedUnreadCount };
      return newState;
    
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString()
      }));
      newState = { ...state, notifications: allReadNotifications, unreadCount: 0 };
      return newState;
    
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      return newState;
    
    case 'SET_REFRESHING':
      newState = { ...state, isRefreshing: action.payload };
      return newState;
    
    case 'SET_ERROR':
      newState = { ...state, error: action.payload, isLoading: false, isRefreshing: false };
      return newState;
    
    case 'CLEAR_ERROR':
      newState = { ...state, error: null };
      return newState;
    
    case 'SET_LAST_FETCH_TIME':
      newState = { ...state, lastFetchTime: action.payload };
      return newState;
    
    default:
      return state;
  }
}

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  
  // Refs to track state and prevent infinite loops
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const lastRequestTime = useRef(0);
  const isRequestInProgress = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check if we should throttle the request
  const shouldThrottleRequest = useCallback((): boolean => {
    const now = Date.now();
    if (state.lastFetchTime && (now - state.lastFetchTime) < MIN_FETCH_INTERVAL) {
      return true;
    }
    return false;
  }, [state.lastFetchTime]);

  // Load notifications with proper error handling and throttling
  const loadNotifications = useCallback(async (userId: string, force: boolean = false) => {
    
    if (!userId || !isMounted.current) {
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isRequestInProgress.current && !force) {
      return;
    }
    
    // Throttle requests unless forced
    if (!force && shouldThrottleRequest()) {
      return;
    }

    try {
      isRequestInProgress.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.getNotifications(userId);
      
      if (!isMounted.current) {
        return;
      }
      
      // Handle the API response - it should be an array of notifications
      if (response && Array.isArray(response)) {
        const previousUnreadCount = state.unreadCount;
        const newUnreadCount = response.filter(n => !n.is_read).length;
        
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response });
        
        dispatch({ type: 'SET_LAST_FETCH_TIME', payload: Date.now() });
        
        // Reset retry count on success
        retryCount.current = 0;
        
        // Play sound for new notifications
        if (newUnreadCount > previousUnreadCount) {
          const newNotifications = response.filter(n => !n.is_read);
          const hasUrgent = newNotifications.some(n => n.priority === 'urgent');
          
          if (hasUrgent) {
            playUrgentNotificationSound();
          } else {
            playNotificationSound();
          }
        }
      } else {
        console.error('Invalid notifications response format:', response);
        console.error('Expected array but got:', typeof response);
        throw new Error('Invalid notifications response format - expected array');
      }
    } catch (error) {
      if (!isMounted.current) return;
      
      console.error('Failed to load notifications:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('ERR_INSUFFICIENT_RESOURCES') || 
            error.message.includes('net::ERR_INSUFFICIENT_RESOURCES')) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: 'Server resources temporarily unavailable. Please try again later.' 
          });
        } else if (error.message.includes('Failed to fetch') || 
                   error.message.includes('NetworkError')) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: 'Network error. Please check your connection and try again.' 
          });
        } else if (error.message.includes('Invalid notifications response format')) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: 'Invalid response from server. Please contact support.' 
          });
        } else {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: `Failed to load notifications: ${error.message}` 
          });
        }
      } else {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'An unexpected error occurred. Please try again.' 
        });
      }
      
      // Implement retry logic with exponential backoff
      if (retryCount.current < MAX_RETRY_ATTEMPTS) {
        retryCount.current++;
        const retryDelay = RETRY_DELAY * Math.pow(2, retryCount.current - 1);
        
        setTimeout(() => {
          if (isMounted.current) {
            loadNotifications(userId, true);
          }
        }, retryDelay);
      }
    } finally {
      if (isMounted.current) {
        isRequestInProgress.current = false;
      }
    }
  }, [shouldThrottleRequest, state.unreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await authAPI.markNotificationAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Still update local state for better UX
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      await authAPI.markAllNotificationsAsRead(userId);
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Still update local state for better UX
      dispatch({ type: 'MARK_ALL_AS_READ' });
    }
  }, []);

  // Refresh notifications (force refresh)
  const refreshNotifications = useCallback(async (userId: string) => {
    await loadNotifications(userId, true);
  }, [loadNotifications]);

  // Force load notifications (bypasses all throttling and checks)
  const forceLoadNotifications = useCallback(async (userId: string) => {
    await loadNotifications(userId, true);
  }, [loadNotifications]);

  return (
    <NotificationContext.Provider value={{
      state,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
      forceLoadNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
