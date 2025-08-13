import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationCounterProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function NotificationCounter({ 
  className = '', 
  size = 'md' 
}: NotificationCounterProps) {
  const { state } = useNotifications();
  
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  };

  if (!state.unreadCount || state.unreadCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <Bell size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} className="text-gray-600" />
      <span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-medium ${sizeClasses[size]}`}>
        {state.unreadCount > 99 ? '99+' : state.unreadCount}
      </span>
    </div>
  );
}
