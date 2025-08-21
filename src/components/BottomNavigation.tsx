import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, MapPin, Calendar, MessageCircle, User, LogOut, Bell } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { useNotifications } from '../contexts/NotificationContext'

export default function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthAPI()
  const { state: notificationState } = useNotifications()

  const handleLogout = async () => {
    await signOut()
    navigate('/auth')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home', shortLabel: 'Home', key: 'home' },
    { path: '/tracker', icon: MapPin, label: 'Tracker', shortLabel: 'Track', key: 'tracker' },
    { 
      path: user ? '/notifications' : '/auth', 
      icon: Bell, 
      label: 'Notifications',
      shortLabel: 'Notifs',
      key: 'notifications',
      requiresAuth: true,
      badge: notificationState?.unreadCount || 0
    },
    { 
      path: user ? '/booking' : '/auth', 
      icon: Calendar, 
      label: 'Book',
      shortLabel: 'Book',
      key: 'booking',
      requiresAuth: true 
    },
    { 
      path: user ? '/feedback' : '/auth', 
      icon: MessageCircle, 
      label: 'Feedback',
      shortLabel: 'Feedback',
      key: 'feedback',
      requiresAuth: true 
    },
    { 
      path: user ? '/profile' : '/auth', 
      icon: User, 
      label: 'Profile',
      shortLabel: 'Profile',
      key: 'profile',
      requiresAuth: true 
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-pink-100 px-1 sm:px-2 py-1 sm:py-2 z-50 safe-bottom">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label, shortLabel, key, requiresAuth, badge }) => {
          const isActive = location.pathname === path
          const isDisabled = requiresAuth && !user
          
          return (
            <Link
              key={key}
              to={path}
              className={`flex flex-col items-center py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg transition-all duration-200 relative min-h-[56px] sm:min-h-[60px] justify-center touch-target ${
                isActive
                  ? 'text-pink-600 bg-pink-50 scale-105 sm:scale-110'
                  : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-pink-500 hover:bg-pink-25 active:scale-95'
              }`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                }
              }}
            >
              <div className="relative">
                <Icon size={18} className="mb-1" />
                {/* Badge for notifications */}
                {badge && typeof badge === 'number' && badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              {/* Use short labels for very small screens to prevent overlapping */}
              <span className="text-xs font-medium leading-tight text-center max-w-[50px] sm:max-w-[60px] lg:max-w-none truncate">
                <span className="hidden xs:inline">{label}</span>
                <span className="xs:hidden">{shortLabel}</span>
              </span>
              {isDisabled && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-300 rounded-full"></div>
              )}
            </Link>
          )
        })}
        
        {/* Logout Button - Only show when user is logged in */}
        {user && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 min-h-[56px] sm:min-h-[60px] justify-center touch-target"
          >
            <LogOut size={18} className="mb-1" />
            <span className="text-xs font-medium leading-tight text-center max-w-[50px] sm:max-w-[60px] lg:max-w-none truncate">
              <span className="hidden xs:inline">Logout</span>
              <span className="xs:hidden">Logout</span>
            </span>
          </button>
        )}
      </div>
    </nav>
  )
}