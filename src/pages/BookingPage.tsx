import React, { useState } from 'react'
import { Calendar, MapPin, Users, CreditCard, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function BookingPage() {
  const { user } = useAuth()
  const [selectedBus, setSelectedBus] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const buses = [
    { id: 'bus-001', route: 'Downtown Express', price: 15, availableSeats: 13 },
    { id: 'bus-002', route: 'University Line', price: 12, availableSeats: 8 },
    { id: 'bus-003', route: 'Airport Shuttle', price: 25, availableSeats: 15 },
  ]

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
    if (!selectedBus || !selectedDate || selectedSeats.length === 0) return

    setIsSubmitting(true)

    try {
      // Simulate API call to book seats
      await new Promise(resolve => setTimeout(resolve, 2000))
      setBookingSuccess(true)
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedBusData = buses.find(bus => bus.id === selectedBus)
  const totalPrice = selectedBusData ? selectedBusData.price * selectedSeats.length : 0

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
                <span className="text-gray-600">Route:</span>
                <span className="font-semibold">{selectedBusData?.route}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seats:</span>
                <span className="font-semibold">{selectedSeats.join(', ')}</span>
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Book Your Trip</h1>
        <p className="text-gray-600">Reserve your seat in advance</p>
      </div>

      <form onSubmit={handleBooking} className="space-y-6">
        {/* Bus Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="mr-2 text-pink-500" size={20} />
            Select Route
          </h3>
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
                    <h4 className="font-semibold text-gray-800">{bus.route}</h4>
                    <p className="text-sm text-gray-600">{bus.availableSeats} seats available</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">${bus.price}</div>
                    <div className="text-sm text-gray-600">per seat</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Selection */}
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

        {/* Seat Selection */}
        {selectedBus && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="mr-2 text-pink-500" size={20} />
              Select Seats (Max 4)
            </h3>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              {generateSeats(20, selectedBusData?.availableSeats || 0).map((seat) => (
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

        {/* Booking Summary */}
        {selectedSeats.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CreditCard className="mr-2" size={20} />
              Booking Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Route:</span>
                <span className="font-semibold">{selectedBusData?.route}</span>
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedBus || !selectedDate || selectedSeats.length === 0 || isSubmitting}
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