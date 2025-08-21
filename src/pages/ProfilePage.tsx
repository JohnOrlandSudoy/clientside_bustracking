import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Calendar, MapPin, Star, LogOut, Settings, Bell, CreditCard, Phone, MessageSquare } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'

interface Bus {
  id: string
  route: string
  name?: string
}

interface Feedback {
  id: string
  user_id: string | null
  bus_id: string | null
  rating: number
  comment: string
  created_at: string
}

interface Booking {
  id: string
  route: string
  date: string
  seats: number[]
  status: 'completed' | 'upcoming' | 'cancelled'
  price: number
}

export default function ProfilePage() {
  const { user, signOut } = useAuthAPI()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  // Dynamic user stats based on actual user data
  const getUserStats = () => {
    if (!user) return {
      totalTrips: 0,
      favoriteRoute: 'Not available',
      totalSpent: 0,
      averageRating: 0,
    }
    
    return {
      totalTrips: 0, // This would come from actual booking data
      favoriteRoute: 'Not available', // This would come from actual trip data
      totalSpent: 0, // This would come from actual payment data
      averageRating: 0, // This would come from actual feedback data
    }
  }

  const userStats = getUserStats()

  // Dynamic recent bookings - would come from actual API data
  const getRecentBookings = (): Booking[] => {
    // This would be fetched from an actual bookings API
    // For now, showing empty state
    return []
  }

  const recentBookings = getRecentBookings()

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-pink-500 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="text-white" size={32} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          {user?.profile?.fullName || user?.username || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 flex items-center justify-center mt-1">
          <Mail size={16} className="mr-1" />
          {user?.email}
        </p>
        {user?.profile?.phone && (
          <p className="text-sm sm:text-base text-gray-600 flex items-center justify-center mt-1">
            <Phone size={16} className="mr-1" />
            {user.profile.phone}
          </p>
        )}
        {user?.role && (
          <p className="text-pink-600 text-sm font-medium mt-1 capitalize">
            {user.role}
          </p>
        )}
        {user?.role === 'driver' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm text-center">
              🚌 You have driver privileges. You can access bus tracking and management features.
            </p>
          </div>
        )}
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <User className="mr-2 text-pink-500" size={20} />
          Account Information
        </h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm sm:text-base">Username:</span>
            <span className="font-medium text-gray-800 text-sm sm:text-base">{user?.username || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm sm:text-base">Email:</span>
            <span className="font-medium text-gray-800 text-sm sm:text-base">{user?.email || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm sm:text-base">Full Name:</span>
            <span className="font-medium text-gray-800 text-sm sm:text-base">{user?.profile?.fullName || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm sm:text-base">Phone:</span>
            <span className="font-medium text-gray-800 text-sm sm:text-base">{user?.profile?.phone || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-sm sm:text-base">Role:</span>
            <span className="font-medium text-gray-800 text-sm sm:text-base capitalize">{user?.role || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-lg border border-pink-100 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-pink-600">
            {userStats.totalTrips > 0 ? userStats.totalTrips : '—'}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">Total Trips</p>
          {userStats.totalTrips === 0 && (
            <p className="text-xs text-gray-400 mt-1">No trips yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-lg border border-pink-100 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-pink-600">
            {userStats.totalSpent > 0 ? `$${userStats.totalSpent}` : '—'}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">Total Spent</p>
          {userStats.totalSpent === 0 && (
            <p className="text-xs text-gray-400 mt-1">No payments yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-lg border border-pink-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <Star className="text-yellow-500 fill-current mr-1" size={18} />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
              {userStats.averageRating > 0 ? userStats.averageRating : '—'}
            </h3>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">Avg Rating</p>
          {userStats.averageRating === 0 && (
            <p className="text-xs text-gray-400 mt-1">No ratings yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-lg border border-pink-100 text-center">
          <MapPin className="text-pink-500 mx-auto mb-1" size={18} />
          <h3 className="text-sm font-bold text-gray-800">
            {userStats.favoriteRoute !== 'Not available' ? userStats.favoriteRoute : '—'}
          </h3>
          <p className="text-gray-600 text-xs">Favorite Route</p>
          {userStats.favoriteRoute === 'Not available' && (
            <p className="text-xs text-gray-400 mt-1">No routes yet</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-pink-100 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="mr-2 text-pink-500" size={20} />
          Recent Bookings
        </h3>
        <div className="space-y-3">
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <div key={booking.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">{booking.route}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {booking.date} • Seats: {booking.seats.join(', ')}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-base sm:text-lg font-bold text-gray-800">${booking.price}</div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Calendar className="mx-auto mb-3 text-gray-300" size={28} />
              <p className="text-gray-600 mb-2 text-sm sm:text-base">No recent bookings</p>
              <p className="text-xs sm:text-sm text-gray-400">Your booking history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Menu */}
      <div className="bg-white rounded-2xl shadow-lg border border-pink-100 mb-4 sm:mb-6">
        <div className="p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-1">
            <button 
              onClick={() => navigate('/notifications')}
              className="w-full flex items-center p-3 sm:p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 active:bg-gray-100"
            >
              <Bell className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-800 text-sm sm:text-base">View Notifications</span>
              <div className="ml-auto text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button 
              onClick={() => navigate('/feedback')}
              className="w-full flex items-center p-3 sm:p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 active:bg-gray-100"
            >
              <MessageSquare className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-800 text-sm sm:text-base">Send Feedback</span>
              <div className="ml-auto text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button 
              onClick={() => navigate('/booking')}
              className="w-full flex items-center p-3 sm:p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 active:bg-gray-100"
            >
              <Calendar className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-800 text-sm sm:text-base">Book a Trip</span>
              <div className="ml-auto text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-gradient-to-r from-red-500 to-red-400 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center text-sm sm:text-base"
      >
        <LogOut className="mr-2" size={18} />
        Sign Out
      </button>

      {/* App Info */}
      <div className="text-center mt-6 sm:mt-8 text-gray-500 text-xs sm:text-sm">
        <p>Bus Tracker App v1.0</p>
        <p>Made with ❤️ for better commuting</p>
      </div>
    </div>
  )
}