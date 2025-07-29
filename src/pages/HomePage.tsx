import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, MessageCircle, Clock, Users, Star } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  const buses = [
    {
      id: 'bus-001',
      route: 'Downtown Express',
      nextStop: 'Central Station',
      eta: '5 min',
      capacity: '32/45',
      rating: 4.8,
    },
    {
      id: 'bus-002',
      route: 'University Line',
      nextStop: 'Campus Gate',
      eta: '12 min',
      capacity: '28/40',
      rating: 4.6,
    },
    {
      id: 'bus-003',
      route: 'Airport Shuttle',
      nextStop: 'Terminal 1',
      eta: '8 min',
      capacity: '15/30',
      rating: 4.9,
    },
  ]

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome{user ? `, ${user.email?.split('@')[0]}` : ''}! 👋
        </h1>
        <p className="text-gray-600">Track your buses in real-time</p>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-400 to-pink-300 rounded-3xl p-6 mb-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Smart Bus Tracking</h2>
        <p className="text-pink-100 mb-4">Never miss your bus again with real-time updates</p>
        <Link
          to="/tracker"
          className="inline-flex items-center bg-white text-pink-600 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <MapPin size={18} className="mr-2" />
          Track Now
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link
          to="/tracker"
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-md hover:scale-105 transition-all duration-200"
        >
          <MapPin className="text-pink-500 mb-2" size={24} />
          <span className="text-sm font-medium text-gray-700">Track</span>
        </Link>
        <Link
          to="/booking"
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-md hover:scale-105 transition-all duration-200"
        >
          <Calendar className="text-pink-500 mb-2" size={24} />
          <span className="text-sm font-medium text-gray-700">Book</span>
        </Link>
        <Link
          to="/feedback"
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-pink-100 hover:shadow-md hover:scale-105 transition-all duration-200"
        >
          <MessageCircle className="text-pink-500 mb-2" size={24} />
          <span className="text-sm font-medium text-gray-700">Review</span>
        </Link>
      </div>

      {/* Available Buses */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Available Buses</h3>
        <div className="space-y-4">
          {buses.map((bus) => (
            <Link
              key={bus.id}
              to={`/tracker/${bus.id}`}
              className="block bg-white rounded-2xl p-5 shadow-sm border border-pink-100 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{bus.route}</h4>
                  <p className="text-gray-600 text-sm">Next: {bus.nextStop}</p>
                </div>
                <div className="flex items-center bg-pink-50 px-3 py-1 rounded-full">
                  <Clock size={14} className="text-pink-600 mr-1" />
                  <span className="text-pink-600 font-semibold text-sm">{bus.eta}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-gray-600">
                  <Users size={16} className="mr-1" />
                  <span className="text-sm">{bus.capacity}</span>
                </div>
                <div className="flex items-center">
                  <Star size={16} className="text-yellow-500 mr-1 fill-current" />
                  <span className="text-sm font-medium text-gray-700">{bus.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}