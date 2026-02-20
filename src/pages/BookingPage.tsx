import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, MapPin, Users, CreditCard, Check, AlertCircle, Clock, Star } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI, BusETA } from '../lib/api'
import { supabase } from '../lib/supabase'

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
  const [occupiedSeatSet, setOccupiedSeatSet] = useState<Set<number>>(new Set())
  const [discountVerification, setDiscountVerification] = useState<any>(null)
  const [loadingDiscount, setLoadingDiscount] = useState(false)
  const [isDiscountSubmitting, setIsDiscountSubmitting] = useState(false)
  const [discountType, setDiscountType] = useState<'student' | 'senior_citizen' | 'pwd' | ''>('')
  const [discountFile, setDiscountFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [discountSuccess, setDiscountSuccess] = useState(false)
  const [isRegularClient, setIsRegularClient] = useState(false)
  const USD_TO_PHP = 58.74
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const formatRouteName = (name?: string | null) => {
    if (!name) return 'Unknown Route'
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  console.log('BookingPage user debug:', {
    id: user?.id,
    email: user?.email,
    username: user?.username
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setDiscountFile(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const [discountError, setDiscountError] = useState<string | null>(null)

  const handleDiscountSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
    
    console.log('Starting discount submission process...')
    setIsDiscountSubmitting(true)
    setDiscountError(null)
    
    try {
      console.log('Discount submit for user:', user?.id, user?.email)
      if (!user?.id) {
        throw new Error('You must be logged in to submit verification.')
      }
      
      if (!discountType) {
        throw new Error('Please select a discount type.')
      }
      
      if (!discountFile) {
        throw new Error('Please select an ID image to upload.')
      }
    
      console.log('Validating file...', discountFile.name, discountFile.size, discountFile.type)

      
      // 1. Validation: Check file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (discountFile.size > MAX_SIZE) {
        throw new Error('File is too large. Please upload an image smaller than 5MB.')
      }

      // 2. Validation: Check file type
      if (!discountFile.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image (JPG, PNG).')
      }

      // 3. Read file
      const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Failed to read file. Please try again.'))
          reader.readAsDataURL(file)
        })
      }

      console.log('Reading file...')
      const base64 = await readFileAsBase64(discountFile)
      // Check if base64 string is valid
      if (!base64 || !base64.includes(',')) {
          throw new Error('Failed to process image file.')
      }
      const base64Content = base64.split(',')[1]

      console.log('Uploading to server...')

      // 4. Upload to Supabase Storage via Backend
      const uploadResponse = await authAPI.uploadDiscountID({
        file_base64: base64Content,
        filename: discountFile.name,
        content_type: discountFile.type,
        user_id: user.id,
        email: user.email
      })
      
      console.log('Upload response:', uploadResponse)

      if (!uploadResponse || !uploadResponse.publicUrl) {
        throw new Error('Upload successful but no URL returned from server.')
      }

      const { publicUrl } = uploadResponse

      // 5. Submit Verification Record
      console.log('Submitting verification record...', { userId: user.id, type: discountType, idImageUrl: publicUrl })
      
      const verificationResponse = await authAPI.submitDiscountVerification({
        userId: user.id,
        type: discountType as 'student' | 'senior_citizen' | 'pwd',
        idImageUrl: publicUrl,
        email: user.email,
        username: user.username || user.email?.split('@')[0] || 'user',
        fullName: user.profile?.fullName
      })

      console.log('Verification response:', verificationResponse)
      
      // If we got here, it's successful
      console.log('Verification record submitted successfully to Server/Database')

      // Optimistically set local status to pending for debugging/UX
      setDiscountVerification({
        ...(verificationResponse || {}),
        status: 'pending',
        type: discountType as 'student' | 'senior_citizen' | 'pwd',
      })

      // 6. Refresh Status
      try {
        const status = await authAPI.getDiscountVerificationStatus(user.id)
        console.log('New status fetched:', status)
        setDiscountVerification(status)
      } catch (statusErr) {
        console.warn('Could not fetch new status immediately:', statusErr)
        setDiscountVerification({
            status: 'pending',
            type: discountType as 'student' | 'senior_citizen' | 'pwd',
            submitted_at: new Date().toISOString()
        })
      }

      setDiscountSuccess(true)
      setDiscountType('')
      setDiscountFile(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Discount submission failed:', err)
      // Display a friendly error message
      const errorMessage = err.message || 'Failed to submit discount verification. Please try again.'
      setDiscountError(errorMessage)
    } finally {
      setIsDiscountSubmitting(false)
    }
  }

  // Load buses and ETAs from API
  useEffect(() => {
    if (!user?.id) return

    try {
      const raw = localStorage.getItem('booking_draft')
      if (!raw) return
      const draft = JSON.parse(raw)
      if (!draft || draft.userId !== user.id) return

      if (draft.selectedBus) setSelectedBus(draft.selectedBus)
      if (draft.selectedDate) setSelectedDate(draft.selectedDate)
      if (Array.isArray(draft.selectedSeats)) setSelectedSeats(draft.selectedSeats)
      if (draft.paymentMethod === 'cash' || draft.paymentMethod === 'online') {
        setPaymentMethod(draft.paymentMethod)
      }
      if (typeof draft.isRegularClient === 'boolean') {
        setIsRegularClient(draft.isRegularClient)
      }
      if (draft.discountType === 'student' || draft.discountType === 'senior_citizen' || draft.discountType === 'pwd' || draft.discountType === '') {
        setDiscountType(draft.discountType)
      }
    } catch (err) {
      console.error('Failed to load booking draft:', err)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const draft = {
      userId: user.id,
      selectedBus,
      selectedDate,
      selectedSeats,
      paymentMethod,
      isRegularClient,
      discountType
    }

    try {
      localStorage.setItem('booking_draft', JSON.stringify(draft))
    } catch (err) {
      console.error('Failed to save booking draft:', err)
    }
  }, [user?.id, selectedBus, selectedDate, selectedSeats, paymentMethod, isRegularClient, discountType])

  useEffect(() => {
    const loadBusesAndETAs = async () => {
      try {
        setLoadingBuses(true)
        // Fetch all buses
        const busesData = await authAPI.getAllBuses()
        
        // Fetch ETAs for all buses
        const etas = await authAPI.getBusETA()
        
        // Merge bus data with ETA data
        const mergedBuses = busesData.map((bus: any) => {
          const busEta = etas.find((eta: BusETA) => eta.busId === bus.id)
          return {
            ...bus,
            eta: busEta?.eta,
            currentLocation: busEta?.currentLocation,
            route_name: busEta?.route?.name || bus.route_name || bus.route // Handle different API response structures
          }
        })
        
        setBuses(mergedBuses)
        
        // If a busId is in the URL, select it
        const urlBusId = searchParams.get('busId')
        if (urlBusId && mergedBuses.some((b: Bus) => b.id === urlBusId)) {
          setSelectedBus(urlBusId)
        }
      } catch (err) {
        console.error('Failed to load buses:', err)
        setError('Failed to load available buses. Please try again.')
      } finally {
        setLoadingBuses(false)
      }
    }

    loadBusesAndETAs()
  }, [searchParams])

  useEffect(() => {
    if (!user?.id) return

    let active = true

    const loadDiscountStatus = async () => {
      try {
        console.log('Loading discount status for user:', user.id)
        setLoadingDiscount(true)
        const status = await authAPI.getDiscountVerificationStatus(user.id)
        console.log('Discount status API response:', status)
        if (active) {
          setDiscountVerification(status)
          if (status && status.status !== 'pending') {
            setDiscountSuccess(false)
          }
        }
      } catch (err) {
        console.error('Failed to load discount status:', err)
      } finally {
        if (active) {
          setLoadingDiscount(false)
        }
      }
    }

    loadDiscountStatus()

    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`discount_verifications_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discount_verifications',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          try {
            console.log('Realtime discount change detected for user:', user.id)
            const status = await authAPI.getDiscountVerificationStatus(user.id)
            console.log('Discount status after realtime event:', status)
            setDiscountVerification(status)
            if (status && status.status !== 'pending') {
              setDiscountSuccess(false)
            }
          } catch (err) {
            console.error('Failed to refresh discount status after realtime update:', err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const hashString = (str: string) => {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0
    }
    return h
  }

  const lcg = (seed: number) => {
    let s = seed >>> 0
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s
    }
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
          localStorage.removeItem('booking_draft')
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
  const isDiscounted = discountVerification?.status === 'approved' && !isRegularClient
  const basePricePerSeat = 15
  const baseTotalPrice = selectedBusData ? basePricePerSeat * selectedSeats.length : 0
  const discountPercent = isDiscounted ? 20 : 0
  const discountAmount = baseTotalPrice * (discountPercent / 100)
  const totalPrice = baseTotalPrice - discountAmount

  useEffect(() => {
    const total = selectedBusData?.total_seats || 0
    const available = selectedBusData?.available_seats || 0
    const count = total > available ? total - available : 0
    if (!total || count <= 0) {
      setOccupiedSeatSet(new Set())
      return
    }
    const seedStr = `${selectedBus}|${selectedDate}`
    const seed = hashString(seedStr)
    const rnd = lcg(seed)
    const order: number[] = Array.from({ length: total }, (_, i) => i + 1)
    for (let i = order.length - 1; i > 0; i--) {
      const j = rnd() % (i + 1)
      const tmp = order[i]
      order[i] = order[j]
      order[j] = tmp
    }
    setOccupiedSeatSet(new Set(order.slice(0, count)))
  }, [selectedBus, selectedDate, selectedBusData?.total_seats, selectedBusData?.available_seats])

  const seats = useMemo(() => {
    const total = selectedBusData?.total_seats || 20
    const selectedSet = new Set(selectedSeats)
    const list = []
    for (let i = 1; i <= total; i++) {
      list.push({
        number: i,
        isOccupied: occupiedSeatSet.has(i),
        isSelected: selectedSet.has(i),
      })
    }
    return list
  }, [selectedBusData?.total_seats, occupiedSeatSet, selectedSeats])

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
    receipt.push(`Base Total: $${baseTotalPrice.toFixed(2)} (≈ ₱${(baseTotalPrice * USD_TO_PHP).toFixed(2)} PHP)`)
    if (discountPercent > 0 && discountAmount > 0) {
      receipt.push(`Discount (${discountPercent}%): -$${discountAmount.toFixed(2)} (≈ ₱${(discountAmount * USD_TO_PHP).toFixed(2)} PHP)`)
    }
    receipt.push(`Total: $${totalPrice.toFixed(2)} (≈ ₱${(totalPrice * USD_TO_PHP).toFixed(2)} PHP)`)
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
                <span className="font-bold text-pink-600 text-sm sm:text-base lg:text-lg">
                  ${totalPrice}
                  <span className="ml-2 text-gray-700 font-medium">≈ ₱{(totalPrice * USD_TO_PHP).toFixed(2)}</span>
                </span>
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
                        {formatRouteName(bus.route_name)}
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
                      <div className="text-base sm:text-lg lg:text-xl font-bold text-pink-600">
                        $15
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">≈ ₱{(15 * USD_TO_PHP).toFixed(2)}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">per seat</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        

        {selectedBus && (
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Users className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
              Select Seats (Max 4)
            </h3>

            {/* Discount Status Section */}
            <div className="mb-4 p-3 rounded-xl border border-blue-100 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                  <Star className="mr-1.5 text-blue-500" size={16} />
                  Discount Program
                </h4>
                {(loadingDiscount || isDiscountSubmitting) && (
                  <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                )}
              </div>
              
              {/* Debug: show raw discount status */}
              <div className="mb-2 text-[10px] text-gray-500">
                Debug status:{' '}
                {loadingDiscount
                  ? 'loading...'
                  : discountVerification?.status || 'none'}
              </div>
              
              <div className="mb-2">
                <label className="inline-flex items-center text-xs text-blue-800">
                  <input
                    type="checkbox"
                    checked={isRegularClient}
                    onChange={(e) => setIsRegularClient(e.target.checked)}
                    className="mr-2"
                  />
                  <span>I am a regular client and do not want to apply a discount now.</span>
                </label>
              </div>

              {!isRegularClient && (
                <>
                  {discountSuccess && (
                    <div className="mb-3 p-2 bg-green-50 text-green-700 rounded border border-green-100 flex items-start animate-pulse">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">ID uploaded successfully!</span>
                        <span className="text-xs mt-0.5">Waiting for verification...</span>
                      </div>
                    </div>
                  )}
                  
                  {discountError && (
                    <div className="mb-3 p-2 bg-red-50 text-red-700 rounded border border-red-100 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{discountError}</span>
                    </div>
                  )}

                  {!discountVerification || discountVerification.status === 'none' || discountVerification.status === 'rejected' ? (
                    <div className="text-xs text-blue-700">
                      {discountVerification?.status === 'rejected' && (
                        <div className="mb-3 p-2 bg-red-50 text-red-700 rounded border border-red-100">
                          <p className="font-semibold">Previous verification rejected</p>
                          {discountVerification.rejection_reason && <p>Reason: {discountVerification.rejection_reason}</p>}
                        </div>
                      )}
                      
                      <p className="mb-2">Students, Senior Citizens, and Persons with Disability (PWD) are eligible for a 20% discount. Upload your ID to verify.</p>
                      
                      <div className="space-y-3 mt-2">
                        <div>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as any)}
                            className="w-full p-2 text-xs border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                            required
                          >
                            <option value="">Select Type</option>
                            <option value="student">Student</option>
                            <option value="senior_citizen">Senior Citizen</option>
                            <option value="pwd">PWD</option>
                          </select>
                        </div>
                        
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                            required
                          />
                          {imagePreview && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Preview:</p>
                              <img 
                                src={imagePreview} 
                                alt="ID Preview" 
                                className="h-32 object-contain border border-gray-200 rounded-lg bg-gray-50" 
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleDiscountSubmit}
                          disabled={isDiscountSubmitting || !discountType || !discountFile}
                          className="w-full py-1.5 px-3 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                          {isDiscountSubmitting ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Submitting...
                            </>
                          ) : 'Submit ID for Verification'}
                        </button>
                      </div>
                    </div>
                  ) : discountVerification.status === 'pending' ? (
                    <div className="text-xs text-blue-700 flex items-center">
                      <Clock className="mr-1.5" size={14} />
                      Status: waiting for verification...
                    </div>
                  ) : discountVerification.status === 'approved' ? (
                    <div className="text-xs text-green-700 flex items-center">
                      <Check className="mr-1.5" size={14} />
                      Your discount is approved. 20% {discountVerification.type.replace('_', ' ')} discount applied!
                    </div>
                  ) : null}
                </>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {seats.map((seat) => (
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
                <span className="font-semibold text-xs sm:text-sm lg:text-base text-right">
                  {formatRouteName(selectedBusData?.route_name)}
                </span>
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
              <div className="border-t border-pink-300 pt-2 space-y-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm lg:text-base opacity-90">
                  <span>Base Total:</span>
                  <span className="font-semibold">
                    ${baseTotalPrice.toFixed(2)}
                    <span className="ml-1">≈ ₱{(baseTotalPrice * USD_TO_PHP).toFixed(2)}</span>
                  </span>
                </div>
                {discountPercent > 0 && discountAmount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm lg:text-base">
                    <span>Discount ({discountPercent}%):</span>
                    <span className="font-semibold">
                      -${discountAmount.toFixed(2)}
                      <span className="ml-1">≈ ₱{(discountAmount * USD_TO_PHP).toFixed(2)}</span>
                    </span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm sm:text-base lg:text-lg mt-1">
                  <span>Total to pay:</span>
                  <span className="font-bold">
                    ${totalPrice.toFixed(2)}
                    <span className="ml-2 font-semibold">≈ ₱{(totalPrice * USD_TO_PHP).toFixed(2)}</span>
                  </span>
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
            `Book ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''} - $${totalPrice} • ≈ ₱${(totalPrice * USD_TO_PHP).toFixed(2)}`
          )}
        </button>
      </form>
    </div>
  )
}
