import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, MessageCircle, User, ArrowRight } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'

export default function HomePage() {
  const { user } = useAuthAPI()

  const quickActions = [
    {
      title: 'Track Bus',
      description: 'Real-time bus locations',
      icon: MapPin,
      path: '/tracker',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Book Trip',
      description: 'Reserve your seat',
      icon: Calendar,
      path: user ? '/booking' : '/auth',
      color: 'from-pink-500 to-pink-600',
      requiresAuth: true,
    },
    {
      title: 'Send Feedback',
      description: 'Share your experience',
      icon: MessageCircle,
      path: user ? '/feedback' : '/auth',
      color: 'from-green-500 to-green-600',
      requiresAuth: true,
    },
    {
      title: 'View Profile',
      description: 'Your account details',
      icon: User,
      path: user ? '/profile' : '/auth',
      color: 'from-purple-500 to-purple-600',
      requiresAuth: true,
    },
  ]

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
          Welcome to Bus Tracker
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 sm:px-2">
          {user ? (
            <>
              Hello, {user.profile?.fullName || user.username || user.email?.split('@')[0]}! 
              Track your buses and manage your trips.
            </>
          ) : (
            'Track buses in real-time and book your trips with ease.'
          )}
        </p>
      </div>

      {/* Get Started Section - Only show if not logged in */}
      {!user && (
        <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-2xl p-3 sm:p-4 lg:p-6 text-white mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-2">Get Started</h2>
          <p className="mb-3 sm:mb-4 opacity-90 text-xs sm:text-sm lg:text-base">
            Sign in to access booking, feedback, and profile features.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center bg-white text-pink-600 px-3 sm:px-4 py-2.5 sm:py-3 lg:py-2 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm lg:text-base touch-target"
          >
            Sign In
            <ArrowRight size={14} className="ml-2" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon
          const isDisabled = action.requiresAuth && !user
          
          return (
            <Link
              key={action.title}
              to={action.path}
              className={`block p-3 sm:p-4 lg:p-6 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] flex flex-col justify-between touch-target ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                }
              }}
            >
              <div>
                <Icon size={18} className="mb-1.5 sm:mb-2 lg:mb-3" />
                <h3 className="font-semibold mb-1 text-xs sm:text-sm lg:text-base leading-tight">{action.title}</h3>
                <p className="text-xs sm:text-sm opacity-90 leading-tight">{action.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Features */}
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-2">Real-time Tracking</h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            Get live updates on bus locations and arrival times.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-2">Easy Booking</h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            Reserve your seat in advance with our simple booking system.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-2">User Feedback</h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600">
            Help us improve by sharing your experience and suggestions.
          </p>
        </div>
      </div>
    </div>
  )
}