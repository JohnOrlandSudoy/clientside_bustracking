import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Calendar, MapPin, Star, LogOut, Bell, Phone, MessageSquare, FileText, CheckSquare, AlertCircle } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI } from '../lib/api'
 
interface Booking {
  id: string
  route: string
  date: string
  seats: number[]
  status: 'completed' | 'upcoming' | 'cancelled'
  price: number
}

interface RawBooking {
  id: string
  bus?: { route?: { name?: string } }
  travel_date?: string
  created_at: string
  seats?: number[]
  status?: string
  amount?: number | string
}

export default function ProfilePage() {
  const { user, signOut } = useAuthAPI()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(user?.profile?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  interface ContactResponse { id: string; full_name: string; email: string; message: string; status: string; created_at: string }
  const [submitResult, setSubmitResult] = useState<ContactResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const bookings = await authAPI.getUserBookings(user?.id)
        const mapped: Booking[] = (Array.isArray(bookings) ? bookings : []).map((b: RawBooking) => ({
          id: b.id,
          route: b?.bus?.route?.name || 'Unknown Route',
          date: b.travel_date ? new Date(b.travel_date).toLocaleDateString() : new Date(b.created_at).toLocaleDateString(),
          seats: Array.isArray(b.seats) ? b.seats : [],
          status: (b.status || 'upcoming') as 'completed' | 'upcoming' | 'cancelled',
          price: typeof b.amount === 'number' ? b.amount : Number(b.amount || 0)
        }))
        if (active) setRecentBookings(mapped)
      } catch {
        if (active) setRecentBookings([])
      }
    }
    load()
    return () => { active = false }
  }, [user?.id])

  const [refundReason, setRefundReason] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setRefundError(null)
    setRefundSuccess(null)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const result = reader.result as string | null
          const base64 = result ? result.split(',')[1] : null
          if (!base64) throw new Error('Failed to read file')
          const res = await authAPI.uploadRefundProof({
            file_base64: base64,
            filename: file.name,
            content_type: file.type || 'application/octet-stream',
            user_id: user?.id,
            email: user?.email
          })
          setProofUrl(res.publicUrl)
          setRefundSuccess('File uploaded')
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Upload failed'
          setRefundError(msg)
          setProofUrl(null)
        }
      }
      reader.readAsDataURL(file)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      setRefundError(msg)
      setProofUrl(null)
    }
  }

  const submitRefund = async () => {
    setRefundError(null)
    setRefundSuccess(null)
    setRefundSubmitting(true)
    try {
      const full_name = user?.profile?.fullName || fullName || 'User'
      const emailAddr = user?.email || email
      await authAPI.submitRefund({
        full_name,
        email: emailAddr,
        reason: refundReason,
        proof_url: proofUrl || null,
        agree: agreedToTerms,
        booking_id: null
      })
      setRefundSuccess('Refund submitted')
      setRefundReason('')
      setAgreedToTerms(false)
      setProofUrl(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit'
      setRefundError(msg)
    } finally {
      setRefundSubmitting(false)
    }
  }

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-pink-500 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
          <User className="text-white" size={28} />
        </div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
          {user?.profile?.fullName || user?.username || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 flex items-center justify-center mt-1">
          <Mail size={14} className="mr-1" />
          {user?.email}
        </p>
        {user?.profile?.phone && (
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 flex items-center justify-center mt-1">
            <Phone size={14} className="mr-1" />
            {user.profile.phone}
          </p>
        )}
        {user?.role && (
          <p className="text-pink-600 text-xs sm:text-sm font-medium mt-1 capitalize">
            {user.role}
          </p>
        )}
        {user?.role === 'driver' && (
          <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-xs sm:text-sm text-center">
              🚌 You have driver privileges. You can access bus tracking and management features.
            </p>
          </div>
        )}
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <User className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
          Account Information
        </h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Username:</span>
            <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">{user?.username || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Email:</span>
            <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">{user?.email || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Full Name:</span>
            <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">{user?.profile?.fullName || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Phone:</span>
            <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base">{user?.profile?.phone || 'Not set'}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 text-xs sm:text-sm lg:text-base">Role:</span>
            <span className="font-medium text-gray-800 text-xs sm:text-sm lg:text-base capitalize">{user?.role || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-lg border border-pink-100 text-center">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-600">
            {userStats.totalTrips > 0 ? userStats.totalTrips : '—'}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">Total Trips</p>
          {userStats.totalTrips === 0 && (
            <p className="text-xs text-gray-400 mt-1">No trips yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-lg border border-pink-100 text-center">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-600">
            {userStats.totalSpent > 0 ? `$${userStats.totalSpent}` : '—'}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">Total Spent</p>
          {userStats.totalSpent === 0 && (
            <p className="text-xs text-gray-400 mt-1">No payments yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-lg border border-pink-100 text-center">
          <div className="flex items-center justify-center mb-1">
            <Star className="text-yellow-500 fill-current mr-1" size={16} />
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
              {userStats.averageRating > 0 ? userStats.averageRating : '—'}
            </h3>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">Avg Rating</p>
          {userStats.averageRating === 0 && (
            <p className="text-xs text-gray-400 mt-1">No ratings yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 lg:p-4 shadow-lg border border-pink-100 text-center">
          <MapPin className="text-pink-500 mx-auto mb-1" size={16} />
          <h3 className="text-xs sm:text-sm font-bold text-gray-800">
            {userStats.favoriteRoute !== 'Not available' ? userStats.favoriteRoute : '—'}
          </h3>
          <p className="text-gray-600 text-xs">Favorite Route</p>
          {userStats.favoriteRoute === 'Not available' && (
            <p className="text-xs text-gray-400 mt-1">No routes yet</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Calendar className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
          Recent Bookings
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <button key={booking.id} onClick={() => navigate(`/orders/${booking.id}`)} className="text-left w-full flex flex-col sm:flex-row sm:justify-between sm:items-center p-2.5 sm:p-3 lg:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="mb-1.5 sm:mb-2 lg:mb-0">
                  <h4 className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base">{booking.route}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {booking.date} • Seats: {booking.seats.join(', ')}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">${booking.price}</div>
                  <span
                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      booking.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-4 sm:py-6 lg:py-8 text-gray-500">
              <Calendar className="mx-auto mb-2 sm:mb-3 text-gray-300" size={24} />
              <p className="text-gray-600 mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">No recent bookings</p>
              <p className="text-xs sm:text-sm text-gray-400">Your booking history will appear here</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <FileText className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
          Request Refund
        </h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col">
            <label className="text-gray-600 text-xs sm:text-sm mb-1">Reason</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Describe why you need a refund"
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm h-24 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-600 text-xs sm:text-sm mb-1">Proof</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFileUpload(f)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            {proofUrl && (
              <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs text-pink-600 mt-1 break-all">
                {proofUrl}
              </a>
            )}
          </div>
          <label className="flex items-center text-xs sm:text-sm">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mr-2"
            />
            I agree to the refund terms
          </label>
          {refundError && (
            <div className="text-xs text-red-600 flex items-center">
              <AlertCircle className="mr-1" size={14} />
              {refundError}
            </div>
          )}
          {refundSuccess && (
            <div className="text-xs text-green-600 flex items-center">
              <CheckSquare className="mr-1" size={14} />
              {refundSuccess}
            </div>
          )}
          <button
            onClick={submitRefund}
            disabled={refundSubmitting || !refundReason || !agreedToTerms}
            className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-200 text-xs sm:text-sm lg:text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {refundSubmitting ? 'Submitting…' : 'Submit Refund Request'}
          </button>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="bg-white rounded-2xl shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <div className="p-3 sm:p-4">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-1">
            <button 
              onClick={() => navigate('/notifications')}
              className="w-full flex items-center p-2.5 sm:p-3 lg:p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 active:bg-gray-100 touch-target"
            >
              <Bell className="mr-2 sm:mr-3 text-gray-600" size={18} />
              <span className="text-gray-800 text-xs sm:text-sm lg:text-base">View Notifications</span>
              <div className="ml-auto text-gray-400">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button 
              onClick={() => navigate('/feedback')}
              className="w-full flex items-center p-2.5 sm:p-3 lg:p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 active:bg-gray-100 touch-target"
            >
              <MessageSquare className="mr-2 sm:mr-3 text-gray-600" size={18} />
              <span className="text-gray-800 text-xs sm:text-sm lg:text-base">Send Feedback</span>
              <div className="ml-auto text-gray-400">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <button 
              onClick={() => navigate('/booking')}
              className="w-full flex items-center p-2.5 sm:p-3 lg:p-4 text-left hover:bg-gray-50 rounded-xl transition-colors duration-200 active:bg-gray-100 touch-target"
            >
              <Calendar className="mr-2 sm:mr-3 text-gray-600" size={18} />
              <span className="text-gray-800 text-xs sm:text-sm lg:text-base">Book a Trip</span>
              <div className="ml-auto text-gray-400">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contact Us */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Mail className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
          Contact Us
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          <a
            href={`mailto:auroride201@gmail.com?subject=${encodeURIComponent('AuroRide Support')}&body=${encodeURIComponent(`${fullName ? `Name: ${fullName}\n` : ''}${email ? `Email: ${email}\n\n` : ''}${message || 'Hello, I need assistance.'}`)}`}
            className="w-full inline-flex items-center justify-center px-3 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-200 text-xs sm:text-sm lg:text-base"
          >
            Email Support (auroride201@gmail.com)
          </a>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col">
              <label className="text-gray-600 text-xs sm:text-sm mb-1">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-600 text-xs sm:text-sm mb-1">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-600 text-xs sm:text-sm mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello AuroRide, I need assistance."
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm h-24 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <button
              onClick={async () => {
                setSubmitError(null)
                setSubmitResult(null)
                setSubmitting(true)
                try {
                  const res = await authAPI.submitContact({ fullName, email, message })
                  setSubmitResult(res)
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'Failed to submit'
                  setSubmitError(msg)
                } finally {
                  setSubmitting(false)
                }
              }}
              disabled={submitting || !fullName || !email || !message}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-200 text-xs sm:text-sm lg:text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Send'}
            </button>
            {submitError && (
              <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700">
                {submitError}
              </div>
            )}
            {submitResult && (
              <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg text-xs sm:text-sm text-green-700">
                <div>Submitted</div>
                <div className="mt-1 break-words">{JSON.stringify(submitResult)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="w-full bg-gradient-to-r from-red-500 to-red-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center text-xs sm:text-sm lg:text-base touch-target"
      >
        <LogOut className="mr-1.5 sm:mr-2" size={16} />
        Sign Out
      </button>

      {/* App Info */}
      <div className="text-center mt-4 sm:mt-6 lg:mt-8 text-gray-500 text-xs sm:text-sm">
        <p>AuroRide App v1.0</p>
        <p>Made with ❤️ for better commuting</p>
      </div>
    </div>
  )
}
