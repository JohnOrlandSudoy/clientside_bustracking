import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Copy, Clock, Navigation } from 'lucide-react'
import { authAPI } from '../lib/api'
import { useAuthAPI } from '../hooks/useAuthAPI'

export default function BookingSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user } = useAuthAPI()
  const bookingId = params.get('bookingId') || ''
  const sessionId = params.get('session_id') || ''
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<null | boolean>(null)
  const [copied, setCopied] = useState(false)
  const [trackBusId, setTrackBusId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function lookupBusId() {
      if (!bookingId || !user?.id) return
      try {
        const b = await authAPI.getBookingById(bookingId, user.id)
        const id = typeof b?.bus_id === 'string' ? b.bus_id : typeof b?.bus?.id === 'string' ? b.bus.id : null
        if (!cancelled && id) setTrackBusId(id)
      } catch {
        /* ignore lookup failures */
      }
    }
    void lookupBusId()
    return () => {
      cancelled = true
    }
  }, [bookingId, user?.id])

  useEffect(() => {
    const confirmAndSend = async () => {
      if (!bookingId) return
      try {
        setSending(true)
        let resp = null
        if (sessionId) {
          resp = await authAPI.confirmPaymentAndSendReceipt(bookingId, sessionId)
        }
        if (!resp || !resp.success) {
          resp = await authAPI.sendReceiptForBooking(bookingId)
        }
        setSent(!!resp?.success)
      } catch {
        setSent(false)
      } finally {
        setSending(false)
      }
    }
    confirmAndSend()
  }, [bookingId, sessionId])

  useEffect(() => {
    if (!trackBusId) return
    const timer = setTimeout(() => {
      navigate(`/tracker/${trackBusId}?pickup=1`)
    }, 6000)
    return () => clearTimeout(timer)
  }, [trackBusId, navigate])

  const copyId = async () => {
    if (!bookingId) return
    try {
      await navigator.clipboard.writeText(bookingId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <div className="rounded-3xl overflow-hidden shadow-xl border border-pink-100">
        <div className="bg-gradient-to-r from-pink-500 to-pink-400 p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md ring-2 ring-white/40">
              <Check className="text-white" size={28} />
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-xl sm:text-2xl">Payment Successful</div>
              <div className="text-white/80 text-xs sm:text-sm">Your booking has been confirmed</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6">
          <div className="grid gap-4 sm:gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-gray-700 text-sm">Booking ID</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 break-all">{bookingId || 'N/A'}</span>
                <button
                  onClick={copyId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Copy size={14} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-gray-700 text-sm">Email Receipt</div>
              <span
                className={`px-3 py-1.5 text-xs rounded-full font-medium ${
                  sending
                    ? 'bg-yellow-100 text-yellow-700'
                    : sent
                    ? 'bg-green-100 text-green-700'
                    : sent === false
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {sending ? 'Sending…' : sent ? 'Sent' : sent === false ? 'Failed' : 'Pending'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4">
              <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                <Clock size={14} className="mr-1 shrink-0" />
                Track your bus on the map after payment
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {trackBusId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/tracker/${trackBusId}?pickup=1`)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-400 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <Navigation size={14} />
                    Track my bus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/booking')}
                  className="bg-gradient-to-r from-pink-500 to-pink-400 text-white px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  Go to Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
