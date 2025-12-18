import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedBus, setSelectedBus] = useState(searchParams.get('busId') || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [error, setError] = useState('')
  const [buses, setBuses] = useState<Bus[]>([])
  const [loadingBuses, setLoadingBuses] = useState(true)
  const [bookingData, setBookingData] = useState<Booking | null>(null)
  const [copySuccess, setCopySuccess] = useState('')

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
      if (paymentMethod === 'cash') {
        // Create bookings (one per seat) using existing endpoint
        const bookingPromises = selectedSeats.map(async (seatNumber) => {
          const bookingData = {
            userId: user.id,
            busId: selectedBus,
            seat_number: seatNumber
          }

          console.log('Creating booking (cash):', bookingData)
          return await authAPI.createBooking(bookingData)
        })

        const bookingResults = await Promise.all(bookingPromises)
        const successfulBookings = bookingResults.filter(result => result && result.id)

        if (successfulBookings.length === selectedSeats.length) {
          setBookingSuccess(true)
          setBookingData(successfulBookings[0])
        } else {
          setError(`Failed to book ${selectedSeats.length - successfulBookings.length} seats. Please try again.`)
        }
      } else {
        // Online payment: create a Stripe Checkout session on the backend
        try {
          const sessionResp: any = await authAPI.createPaymentSession({
            userId: user.id,
            email: user.email,
            busId: selectedBus,
            seats: selectedSeats,
            date: selectedDate,
            totalAmount: totalPrice
          })

          if (sessionResp && sessionResp.url) {
            window.location.href = sessionResp.url
            return
          }

          throw new Error('Failed to create payment session')
        } catch (err) {
          console.error('Failed to create payment session', err)
          throw err
        }
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

  const copyBookingId = async () => {
    if (!bookingData?.id) return
    try {
      await navigator.clipboard.writeText(bookingData.id)
      setCopySuccess('Copied!')
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (e) {
      setCopySuccess('Unable to copy')
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }

  const downloadReceipt = () => {
    if (!bookingData) return
    const receipt = []
    receipt.push('AuroRide - Booking Receipt')
    receipt.push('--------------------------')
    receipt.push(`Booking ID: ${bookingData.id}`)
    receipt.push(`Route: ${selectedBusData?.route_name || 'N/A'}`)
    receipt.push(`Date: ${selectedDate || 'N/A'}`)
    receipt.push(`Seats: ${selectedSeats.join(', ')}`)
    receipt.push(`Status: ${bookingData.status || 'N/A'}`)
    receipt.push(`Total: $${totalPrice}`)
    const blob = new Blob([receipt.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AuroRide_receipt_${bookingData.id}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (bookingSuccess) {
      const t = setTimeout(() => {
        navigate('/booking')
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [bookingSuccess, navigate])

  if (bookingSuccess) {
    return (
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto">
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <Check className="text-white" size={32} />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Booking Confirmed!</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6 px-2">
            Your seats have been successfully reserved
          </p>
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-green-100 mb-4 sm:mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg">Booking Details</h3>
            <div className="flex items-center justify-end space-x-2 mb-3">
              <button
                type="button"
                onClick={copyBookingId}
                className="px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                aria-label="Copy booking id"
              >
                Copy ID
              </button>
              <button
                type="button"
                onClick={downloadReceipt}
                className="px-3 py-1.5 text-xs sm:text-sm bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-lg"
                aria-label="Download receipt"
              >
                Download Receipt
              </button>
              {copySuccess && (
                <span className="text-xs text-green-600 ml-2">{copySuccess}</span>
              )}
            </div>
            <div className="space-y-2 text-left">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Booking ID:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base break-all">{bookingData?.id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Route:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base text-right">{selectedBusData?.route_name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Date:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{selectedDate}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Seats:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Status:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base capitalize">{bookingData?.status}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-t pt-2">
                <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Total:</span>
                <span className="font-bold text-pink-600 text-sm sm:text-base lg:text-lg">${totalPrice}</span>
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
            className="bg-gradient-to-r from-pink-500 to-pink-400 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-xs sm:text-sm lg:text-base touch-target"
          >
            Book Another Trip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Book Your Trip</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">Reserve your seat in advance</p>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertCircle className="text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-red-600 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleBooking} className="space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <MapPin className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
            Select Route
          </h3>
          {loadingBuses ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600 text-xs sm:text-sm">Loading buses...</span>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {buses.map((bus) => (
                <label
                  key={bus.id}
                  className={`block p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base truncate">
                        {bus.route_name || 'Unknown Route'}
                      </h4>
                      <div className="space-y-1 mt-1">
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <Clock className="mr-1" size={12} />
                          {bus.eta ? `ETA: ${bus.eta}` : 'ETA: --'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {bus.available_seats || 0} seats available
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Bus: {bus.bus_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base sm:text-lg lg:text-xl font-bold text-pink-600">$15</div>
                      <div className="text-xs sm:text-sm text-gray-600">per seat</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <Calendar className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
            Select Date
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2.5 sm:p-3 lg:p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-xs sm:text-sm lg:text-base touch-target"
            required
          />
        </div>

        {selectedBus && (
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Users className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
              Select Seats (Max 4)
            </h3>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Method</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="form-radio text-pink-500"
                  />
                  <span className="text-sm text-gray-700">Cash Payment</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="form-radio text-pink-500"
                  />
                  <span className="text-sm text-gray-700">Online Payment (Credit/Debit Card)</span>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {generateSeats(selectedBusData?.total_seats || 20, selectedBusData?.available_seats || 0).map((seat) => (
                <button
                  key={seat.number}
                  type="button"
                  onClick={() => !seat.isOccupied && handleSeatSelect(seat.number)}
                  disabled={seat.isOccupied}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 touch-target ${
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-2 sm:gap-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded mr-1.5 sm:mr-2"></div>
                  <span className="text-gray-600">Occupied</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-pink-500 rounded mr-1.5 sm:mr-2"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
              </div>
              <span className="text-gray-600 text-center sm:text-right">
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
        )}

        {selectedSeats.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-2xl p-3 sm:p-4 lg:p-6 text-white shadow-lg">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
              <CreditCard className="mr-1.5 sm:mr-2" size={18} />
              Booking Summary
            </h3>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-xs sm:text-sm">Route:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base text-right">{selectedBusData?.route_name || 'Unknown Route'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-xs sm:text-sm">ETA:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{selectedBusData?.eta || 'N/A'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-xs sm:text-sm">Seats:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <span className="text-xs sm:text-sm">Date:</span>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{selectedDate}</span>
              </div>
              <div className="border-t border-pink-300 pt-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm sm:text-base lg:text-lg">
                  <span>Total:</span>
                  <span className="font-bold">${totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Payment Method</h3>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="mr-2"
              />
              <span className="text-sm">Cash</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="payment"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
                className="mr-2"
              />
              <span className="text-sm">Pay Online (Card)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedBus || !selectedDate || selectedSeats.length === 0 || isSubmitting || !user}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm lg:text-base touch-target"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
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
