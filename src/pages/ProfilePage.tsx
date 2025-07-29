import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Calendar, MapPin, Star, LogOut, Settings, Bell, CreditCard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const userStats = {
    totalTrips: 47,
    favoriteRoute: 'Downtown Express',
    totalSpent: 340,
    averageRating: 4.8,
  }

  const recentBookings = [
    {
      id: 1,
      route: 'Downtown Express',
      date: '2024-01-15',
      seats: [12, 13],
      status: 'completed',
      price: 30,
    },
    {
      id: 2,
      route: 'University Line',
      date: '2024-01-12',
      seats: [8],
      status: 'completed',
      price: 12,
    },
    {
      id: 3,
      route: 'Airport Shuttle',
      date: '2024-01-20',
      seats: [15],
      status: 'upcoming',
      price: 25,
    },
  ]

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="text-white" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-gray-600 flex items-center justify-center mt-1">
          <Mail size={16} className="mr-1" />
          {user?.email}
        </p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-pink-100 text-center">
          <h3 className="text-2xl font-bold text-pink-600">{userStats.totalTrips}</h3>
          <p className="text-gray-600 text-sm">Total Trips</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-pink-100 text-center">
          <h3 className="text-2xl font-bold text-pink-600">${userStats.totalSpent}</h3>
          <p className="text-gray-600 text-sm">Total Spent</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-pink-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <Star className="text-yellow-500 fill-current mr-1" size={20} />
            <h3 className="text-xl font-bold text-gray-800">{userStats.averageRating}</h3>
          </div>
          <p className="text-gray-600 text-sm">Avg Rating</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-pink-100 text-center">
          <MapPin className="text-pink-500 mx-auto mb-1" size={20} />
          <h3 className="text-sm font-bold text-gray-800">{userStats.favoriteRoute}</h3>
          <p className="text-gray-600 text-xs">Favorite Route</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="mr-2 text-pink-500" size={20} />
          Recent Bookings
        </h3>
        <div className="space-y-3">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <div>
                <h4 className="font-semibold text-gray-800">{booking.route}</h4>
                <p className="text-sm text-gray-600">
                  {booking.date} • Seats: {booking.seats.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">${booking.price}</div>
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
          ))}
        </div>
      </div>

      {/* Settings Menu */}
      <div className="bg-white rounded-2xl shadow-lg border border-pink-100 mb-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200">
              <Settings className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-800">Account Settings</span>
            </button>
            <button className="w-full flex items-center p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200">
              <Bell className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-800">Notifications</span>
            </button>
            <button className="w-full flex items-center p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200">
              <CreditCard className="mr-3 text-gray-600" size={20} />
              <span className="text-gray-800">Payment Methods</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-gradient-to-r from-red-500 to-red-400 text-white py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center"
      >
        <LogOut className="mr-2" size={18} />
        Sign Out
      </button>

      {/* App Info */}
      <div className="text-center mt-8 text-gray-500 text-sm">
        <p>Bus Tracker App v1.0</p>
        <p>Made with ❤️ for better commuting</p>
      </div>
    </div>
  )
}