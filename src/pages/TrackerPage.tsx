import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapPin, Clock, Users, Navigation, RefreshCw } from 'lucide-react'

export default function TrackerPage() {
  const { busId } = useParams()
  const [buses, setBuses] = useState([
    {
      id: 'bus-001',
      route: 'Downtown Express',
      currentLocation: 'Main Street & 5th Ave',
      nextStop: 'Central Station',
      eta: '5 min',
      capacity: '32/45',
      speed: '25 km/h',
      driver: 'John Smith',
      stops: [
        { name: 'Main Street', status: 'completed', time: '2:15 PM' },
        { name: 'Shopping Plaza', status: 'completed', time: '2:22 PM' },
        { name: 'Central Station', status: 'current', time: '2:30 PM' },
        { name: 'University Campus', status: 'upcoming', time: '2:38 PM' },
        { name: 'Business District', status: 'upcoming', time: '2:45 PM' },
      ],
    },
    {
      id: 'bus-002',
      route: 'University Line',
      currentLocation: 'University Ave & Oak St',
      nextStop: 'Campus Gate',
      eta: '12 min',
      capacity: '28/40',
      speed: '30 km/h',
      driver: 'Sarah Johnson',
      stops: [
        { name: 'Downtown Hub', status: 'completed', time: '2:10 PM' },
        { name: 'Library Corner', status: 'completed', time: '2:18 PM' },
        { name: 'Campus Gate', status: 'current', time: '2:32 PM' },
        { name: 'Student Center', status: 'upcoming', time: '2:40 PM' },
        { name: 'Sports Complex', status: 'upcoming', time: '2:48 PM' },
      ],
    },
    {
      id: 'bus-003',
      route: 'Airport Shuttle',
      currentLocation: 'Highway 101 Exit 15',
      nextStop: 'Terminal 1',
      eta: '8 min',
      capacity: '15/30',
      speed: '45 km/h',
      driver: 'Mike Wilson',
      stops: [
        { name: 'Hotel District', status: 'completed', time: '2:05 PM' },
        { name: 'Business Park', status: 'completed', time: '2:15 PM' },
        { name: 'Terminal 1', status: 'current', time: '2:28 PM' },
        { name: 'Terminal 2', status: 'upcoming', time: '2:35 PM' },
        { name: 'Parking Lot C', status: 'upcoming', time: '2:42 PM' },
      ],
    },
  ])

  const [selectedBus, setSelectedBus] = useState(buses[0])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (busId) {
      const bus = buses.find(b => b.id === busId)
      if (bus) {
        setSelectedBus(bus)
      }
    }
  }, [busId, buses])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'current':
        return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'upcoming':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bus Tracker</h1>
          <p className="text-gray-600">Real-time location updates</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-pink-500 text-white p-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Bus Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Select Bus Route</h3>
        <div className="grid grid-cols-1 gap-3">
          {buses.map((bus) => (
            <button
              key={bus.id}
              onClick={() => setSelectedBus(bus)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedBus.id === bus.id
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800">{bus.route}</h4>
                  <p className="text-sm text-gray-600">ETA: {bus.eta}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{bus.capacity}</div>
                  <div className="flex items-center text-pink-600 text-sm">
                    <Navigation size={14} className="mr-1" />
                    {bus.speed}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Bus Info */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">{selectedBus.route}</h3>
          <div className="flex items-center bg-pink-50 px-3 py-1 rounded-full">
            <Clock size={16} className="text-pink-600 mr-1" />
            <span className="text-pink-600 font-semibold">{selectedBus.eta}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center text-gray-600 mb-1">
              <MapPin size={16} className="mr-1" />
              <span className="text-sm">Current Location</span>
            </div>
            <p className="font-semibold text-gray-800 text-sm">{selectedBus.currentLocation}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center text-gray-600 mb-1">
              <Users size={16} className="mr-1" />
              <span className="text-sm">Capacity</span>
            </div>
            <p className="font-semibold text-gray-800">{selectedBus.capacity}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-xl p-4 text-white">
          <h4 className="font-semibold mb-1">Next Stop</h4>
          <p className="text-pink-100">{selectedBus.nextStop}</p>
          <p className="text-sm text-pink-100 mt-2">Driver: {selectedBus.driver}</p>
        </div>
      </div>

      {/* Bus Route Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Route Progress</h3>
        <div className="space-y-4">
          {selectedBus.stops.map((stop, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-4 border-2 ${getStatusColor(stop.status)}`}>
                {stop.status === 'completed' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-0.5"></div>
                )}
                {stop.status === 'current' && (
                  <div className="w-2 h-2 bg-pink-500 rounded-full mx-auto mt-0.5 animate-pulse"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h4 className={`font-semibold ${
                    stop.status === 'current' ? 'text-pink-700' : 
                    stop.status === 'completed' ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {stop.name}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(stop.status)}`}>
                    {stop.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="mt-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
        <MapPin size={48} className="text-purple-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Interactive Map</h3>
        <p className="text-gray-600 text-sm">
          Real-time bus location visualization coming soon
        </p>
      </div>
    </div>
  )
}