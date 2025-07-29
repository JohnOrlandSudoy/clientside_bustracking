import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, Calendar, MessageCircle, User } from 'lucide-react'

export default function BottomNavigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tracker', icon: MapPin, label: 'Tracker' },
    { path: '/booking', icon: Calendar, label: 'Book' },
    { path: '/feedback', icon: MessageCircle, label: 'Feedback' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-pink-100 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-pink-600 bg-pink-50 scale-110'
                  : 'text-gray-600 hover:text-pink-500 hover:bg-pink-25'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}