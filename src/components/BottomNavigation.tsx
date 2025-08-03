import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, MapPin, Calendar, MessageCircle, User, LogOut } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'

export default function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthAPI()

  const handleLogout = async () => {
    await signOut()
    navigate('/auth')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home', key: 'home' },
    { path: '/tracker', icon: MapPin, label: 'Tracker', key: 'tracker' },
    { 
      path: user ? '/booking' : '/auth', 
      icon: Calendar, 
      label: 'Book',
      key: 'booking',
      requiresAuth: true 
    },
    { 
      path: user ? '/feedback' : '/auth', 
      icon: MessageCircle, 
      label: 'Feedback',
      key: 'feedback',
      requiresAuth: true 
    },
    { 
      path: user ? '/profile' : '/auth', 
      icon: User, 
      label: 'Profile',
      key: 'profile',
      requiresAuth: true 
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-pink-100 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label, key, requiresAuth }) => {
          const isActive = location.pathname === path
          const isDisabled = requiresAuth && !user
          
          return (
            <Link
              key={key}
              to={path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-pink-600 bg-pink-50 scale-110'
                  : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-pink-500 hover:bg-pink-25'
              }`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                }
              }}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{label}</span>
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
            className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut size={20} className="mb-1" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        )}
      </div>
    </nav>
  )
}