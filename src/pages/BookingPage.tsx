import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Users, CreditCard, Check, AlertCircle, Clock } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI, BusETA } from '../lib/api'

interface Bus {
  id: string
  bus_number: string
  available_seats: number
  total_seats: number
  route_id: string
  eta?: string
  currentLocation?: { lat: number; lng: number } | null
  route_name?: string
}

interface Booking {
  id: string
  user_id: string
  bus_id: string
  status: string
  created_at: string
}

export default function BookingPage() {
  const { user } = useAuthAPI()
  const [searchParams] = useSearchParams()
  const [selectedBus, setSelectedBus] = useState(searchParams.get('busId') || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [error, setError] = useState('')
  const [buses, setBuses] = useState<Bus[]>([])
  const [loadingBuses, setLoadingBuses] = useState(true)
  const [bookingData, setBookingData] = useState<Booking | null>(null)

  // Load buses and ETAs from API
  useEffect(() => {
    const loadBusesAndETAs = async () => {
      try {
        setLoadingBuses(true)
        setError('')

        // Fetch buses
        let busResponse
        try {
          busResponse = await authAPI.getBuses()
          if (!busResponse || !Array.isArray(busResponse)) {
            throw new Error('Invalid bus response format')
          }
        } catch (busError) {
          console.error('Failed to fetch buses:', busError)
          throw new Error('Failed to fetch bus list')
        }

        // Fetch ETAs
        let etaResponse
        try {
          etaResponse = await authAPI.getBusETA()
          if (!etaResponse || !Array.isArray(etaResponse)) {
            throw new Error('Invalid ETA response format')
          }
        } catch (etaError) {
          console.error('Failed to fetch ETAs:', etaError)
          throw new Error('Failed to fetch ETA data')
        }

        // Merge bus and ETA data
        const mergedBuses = busResponse.map((bus: any) => {
          const etaData = etaResponse.find((eta: BusETA) => eta.busId === bus.id)
          return {
            id: bus.id,
            bus_number: bus.bus_number,
            available_seats: bus.available_seats,
            total_seats: bus.total_seats,
            route_id: bus.route_id,
            eta: etaData?.eta,
            currentLocation: etaData?.currentLocation,
            route_name: etaData?.route.name
          }
        })

        setBuses(mergedBuses)

        // Validate pre-selected busId
        const busIdFromUrl = searchParams.get('busId')
        if (busIdFromUrl && !mergedBuses.find(bus => bus.id === busIdFromUrl)) {
          setError('Invalid bus selected. Please choose another bus.')
          setSelectedBus('')
        }
      } catch (error) {
        console.error('Failed to load buses or ETAs:', error)
        setError(error instanceof Error ? error.message : 'Failed to load bus information. Using fallback data.')
        // Fallback to mock data
        setBuses([
          {
            id: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
            bus_number: 'BUS001',
            available_seats: 13,
            total_seats: 20,
            route_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            eta: '15 minutes',
            currentLocation: { lat: 14.5995, lng: 120.9842 },
            route_name: 'Downtown Express'
          },
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            bus_number: 'BUS002',
            available_seats: 8,
            total_seats: 20,
            route_id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
            eta: '20 minutes',
            currentLocation: { lat: 14.6000, lng: 120.9850 },
            route_name: 'University Line'
          }
        ])
      } finally {
        setLoadingBuses(false)
      }
    }

    loadBusesAndETAs()
  }, [searchParams])

  const generateSeats = (totalSeats: number, availableSeats: number) => {
    const seats = []
    const occupiedSeats = totalSeats - availableSeats
    const occupiedSeatNumbers = Array.from({ length: occupiedSeats }, () => Math.floor(Math.random() * totalSeats) + 1)
    
    for (let i = 1; i <= totalSeats; i++) {
      seats.push({
        number: i,
        isOccupied: occupiedSeatNumbers.includes(i),
        isSelected: selectedSeats.includes(i),
      })
    }
    return seats
  }

  const handleSeatSelect = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber))
    } else if (selectedSeats.length < 4) {
      setSelectedSeats([...selectedSeats, seatNumber])
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBus || !selectedDate || selectedSeats.length === 0 || !user) {
      setError('Please select a bus, date, and at least one seat.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const bookingPromises = selectedSeats.map(async (seatNumber) => {
        const bookingData = {
          userId: user.id,
          busId: selectedBus
        }

        console.log('Creating booking:', bookingData)
        return await authAPI.createBooking(bookingData)
      })

      const bookingResults = await Promise.all(bookingPromises)
      
      console.log('Booking results:', bookingResults)
      
      const successfulBookings = bookingResults.filter(result => result && result.id)
      
      if (successfulBookings.length === selectedSeats.length) {
        setBookingSuccess(true)
        setBookingData(successfulBookings[0])
      } else {
        setError(`Failed to book ${selectedSeats.length - successfulBookings.length} seats. Please try again.`)
      }
    } catch (error) {
      console.error('Booking failed:', error)
      if (error instanceof Error) {
        setError(`Booking failed: ${error.message}`)
      } else {
        setError('Booking failed. Please check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBusData = buses.find(bus => bus.id === selectedBus)
  const totalPrice = selectedBusData ? 15 * selectedSeats.length : 0

  if (bookingSuccess) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your seats have been successfully reserved
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Booking Details</h3>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-semibold">{bookingData?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-semibold">{selectedBusData?.route_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats:</span>
                <span className="font-semibold">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold capitalize">{bookingData?.status}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-pink-600">${totalPrice}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setBookingSuccess(false)
              setSelectedBus('')
              setSelectedDate('')
              setSelectedSeats([])
              setBookingData(null)
            }}
            className="bg-gradient-to-r from-pink-500 to-pink-400 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Book Another Trip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Book Your Trip</h1>
        <p className="text-gray-600">Reserve your seat in advance</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
          <AlertCircle className="text-red-500 mr-3" size={20} />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleBooking} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="mr-2 text-pink-500" size={20} />
            Select Route
          </h3>
          {loadingBuses ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading buses...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {buses.map((bus) => (
                <label
                  key={bus.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedBus === bus.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="bus"
                    value={bus.id}
                    checked={selectedBus === bus.id}
                    onChange={(e) => setSelectedBus(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{bus.route_name || 'Unknown Route'}</h4>
                      <p className="text-sm text-gray-600">
                        {bus.eta ? `ETA: ${bus.eta}` : 'ETA: --'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bus.currentLocation 
                          ? `Current: Lat ${bus.currentLocation.lat}, Lng ${bus.currentLocation.lng}`
                          : 'Location unavailable'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bus.available_seats || 0} seats available
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-pink-600">$15</div>
                      <div className="text-sm text-gray-600">per seat</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Bus: {bus.bus_number}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2 text-pink-500" size={20} />
            Select Date
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        {selectedBus && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="mr-2 text-pink-500" size={20} />
              Select Seats (Max 4)
            </h3>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              {generateSeats(selectedBusData?.total_seats || 20, selectedBusData?.available_seats || 0).map((seat) => (
                <button
                  key={seat.number}
                  type="button"
                  onClick={() => !seat.isOccupied && handleSeatSelect(seat.number)}
                  disabled={seat.isOccupied}
                  className={`w-12 h-12 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    seat.isOccupied
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : seat.isSelected
                      ? 'bg-pink-500 text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-600'
                  }`}
                >
                  {seat.number}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                  <span className="text-gray-600">Occupied</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-pink-500 rounded mr-2"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
              </div>
              <span className="text-gray-600">
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        )}

        {selectedSeats.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="mr-2" size={20} />
              Booking Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Route:</span>
                <span className="font-semibold">{selectedBusData?.route_name || 'Unknown Route'}</span>
              </div>
              <div className="flex justify-between">
                <span>ETA:</span>
                <span className="font-semibold">{selectedBusData?.eta || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Seats:</span>
                <span className="font-semibold">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold">{selectedDate}</span>
              </div>
              <div className="border-t border-pink-300 pt-2">
                <div className="flex justify-between text-lg">
                  <span>Total:</span>
                  <span className="font-bold">${totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedBus || !selectedDate || selectedSeats.length === 0 || isSubmitting || !user}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing Booking...
            </div>
          ) : (
            `Book ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''} - $${totalPrice}`
          )}
        </button>
      </form>
    </div>
  )
}