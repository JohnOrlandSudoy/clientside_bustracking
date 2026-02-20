import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User as UserIcon, Mail, Calendar, MapPin, Star, LogOut, Bell, Phone, MessageSquare, FileText, CheckSquare, AlertCircle } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI } from '../lib/api'
import { supabase } from '../lib/supabase'

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

interface ContactResponse { 
  id: string; 
  full_name: string; 
  email: string; 
  message: string; 
  status: string; 
  created_at: string 
}

export default function ProfilePage() {
  const auth = useAuthAPI()
  const { user, signOut } = auth
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  
  // Update local state when user data becomes available
  useEffect(() => {
    if (user) {
      setFullName(user.profile?.fullName || '')
      setEmail(user.email || '')
    }
  }, [user])

  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<ContactResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSignOut = async () => {
    if (signOut) {
      await signOut()
      navigate('/auth')
    }
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
        const mapped: Booking[] = (Array.isArray(bookings) ? bookings : [])
          .filter((b: any) => b && typeof b === 'object') // Filter out null/undefined entries
          .map((b: RawBooking) => ({
            id: b.id || `temp-${Math.random()}`, // Fallback ID if missing
            route: b?.bus?.route?.name || 'Unknown Route',
            date: b.travel_date ? new Date(b.travel_date).toLocaleDateString() : (b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Unknown Date'),
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

  useEffect(() => {
    if (!user?.id) return

    let active = true

    const loadDiscountStatus = async () => {
      try {
        setLoadingDiscount(true)
        const status = await authAPI.getDiscountVerificationStatus(user.id)
        if (active) {
          setDiscountVerification(status)
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
      .channel(`profile_discount_verifications_user_${user.id}`)
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
            const status = await authAPI.getDiscountVerificationStatus(user.id)
            setDiscountVerification(status)
          } catch (err) {
            console.error('Failed to refresh discount status after realtime update (profile):', err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const [refundReason, setRefundReason] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [refundSubmitting, setRefundSubmitting] = useState(false)
  const [refundError, setRefundError] = useState<string | null>(null)
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null)

  const [discountVerification, setDiscountVerification] = useState<any>(null)
  const [loadingDiscount, setLoadingDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<'student' | 'senior_citizen'>('student')
  const [discountFile, setDiscountFile] = useState<File | null>(null)
  const [discountSubmitting, setDiscountSubmitting] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null)

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

  const submitDiscount = async () => {
    if (!user?.id || !discountFile) return
    setDiscountError(null)
    setDiscountSuccess(null)
    setDiscountSubmitting(true)
    
    try {
      // 1. Validation: Check file size (max 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (discountFile.size > MAX_SIZE) {
        throw new Error('File is too large. Please upload an image smaller than 5MB.')
      }

      // 2. Validation: Check file type
      if (!discountFile.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image (JPG, PNG).')
      }

      // 3. Read file as Base64
      const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Failed to read file. Please try again.'))
          reader.readAsDataURL(file)
        })
      }

      const base64 = await readFileAsBase64(discountFile)
      const base64Content = base64.split(',')[1]

      // 4. Upload to Supabase Storage via Backend
      const { publicUrl } = await authAPI.uploadDiscountID({
        file_base64: base64Content,
        filename: discountFile.name,
        content_type: discountFile.type,
        user_id: user.id,
        email: user.email
      })

      if (!publicUrl) {
        throw new Error('Upload successful but no URL returned from server.')
      }

      // 5. Submit Verification Request to Database
      await authAPI.submitDiscountVerification({
        userId: user.id,
        type: discountType as 'student' | 'senior_citizen',
        idImageUrl: publicUrl
      })

      setDiscountSuccess('ID submitted successfully for verification!')
      setDiscountFile(null)
      
      // 6. Refresh Status
      const status = await authAPI.getDiscountVerificationStatus(user.id)
      setDiscountVerification(status)
    } catch (err: any) {
      console.error('Discount submission failed:', err)
      const msg = err.message || 'Failed to submit discount verification. Please try again.'
      setDiscountError(msg)
    } finally {
      setDiscountSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-24 lg:pb-12 pt-16 sm:pt-20 lg:pt-24 px-3 sm:px-4 lg:px-8 font-sans">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
            <UserIcon className="text-pink-500 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
            {user?.profile?.fullName || user?.username}
          </h2>
          <p className="text-pink-600 text-xs sm:text-sm font-medium mt-1 capitalize">
            {user?.role}
          </p>
        </div>
      </div>

      {/* User Information Card */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <UserIcon className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
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

      {/* Discount Verification Card */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100 mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <Star className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
          Discount Verification
        </h3>
        
        {loadingDiscount ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          </div>
        ) : !discountVerification ? (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Are you a student or a senior citizen? Submit your ID to get a 20% discount on all your bookings.
            </p>
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-gray-600 text-xs sm:text-sm mb-1">ID Type</label>
                <select 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="student">Student ID</option>
                  <option value="senior_citizen">Senior Citizen ID</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600 text-xs sm:text-sm mb-1">ID Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDiscountFile(e.target.files?.[0] || null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              {discountError && (
                <div className="text-xs text-red-600 flex items-center">
                  <AlertCircle className="mr-1" size={14} />
                  {discountError}
                </div>
              )}
              {discountSuccess && (
                <div className="text-xs text-green-600 flex items-center">
                  <CheckSquare className="mr-1" size={14} />
                  {discountSuccess}
                </div>
              )}
              <button
                onClick={submitDiscount}
                disabled={discountSubmitting || !discountFile}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-200 text-xs sm:text-sm lg:text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {discountSubmitting ? 'Submitting…' : 'Submit ID for Discount'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 rounded-xl border-2 border-pink-50 bg-pink-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-800 capitalize">
                {(discountVerification?.type || 'Discount').replace('_', ' ')} Discount
              </span>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                discountVerification.status === 'approved' ? 'bg-green-100 text-green-700' :
                discountVerification.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {discountVerification.status}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-600 mb-2">
              Submitted on: {discountVerification.submitted_at ? new Date(discountVerification.submitted_at).toLocaleDateString() : 'Unknown Date'}
            </p>
            {discountVerification.status === 'approved' && (
              <p className="text-xs text-green-700 font-medium">
                ✅ Your 20% discount is active and will be applied automatically to your bookings.
              </p>
            )}
            {discountVerification.status === 'pending' && (
              <p className="text-xs text-blue-700">
                ⏳ Our team is reviewing your ID. This usually takes 24-48 hours.
              </p>
            )}
            {discountVerification.status === 'rejected' && (
              <div className="space-y-2">
                <p className="text-xs text-red-700">
                  ❌ Verification failed. {discountVerification.rejection_reason && `Reason: ${discountVerification.rejection_reason}`}
                </p>
                <button
                  onClick={() => setDiscountVerification(null)}
                  className="text-xs text-pink-600 font-bold hover:underline"
                >
                  Try Again with a Different ID
                </button>
              </div>
            )}
          </div>
        )}
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
