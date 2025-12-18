import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI } from '../lib/api'

interface RawBooking {
  id: string
  status?: string
  payment_status?: string
  payment_method?: string
  created_at: string
  travel_date?: string
  seats?: number[]
  amount?: number | string
  receipt_sent?: boolean
  bus?: { bus_number?: string; route?: { name?: string } }
}

export default function BookingDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthAPI()
  const [booking, setBooking] = useState<RawBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id || !user?.id) return
      try {
        const data = await authAPI.getBookingById(id, user.id)
        if (active) setBooking(data || null)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id, user?.id])

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A'
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  const copyId = async () => {
    if (!booking?.id) return
    try {
      await navigator.clipboard.writeText(booking.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const paid = booking?.payment_status === 'paid'
  const confirmed = booking?.status === 'confirmed'

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-800">Booking Details</div>
          <div className="text-sm text-gray-500">{id}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-500">Loading booking...</div>
        </div>
      ) : !booking ? (
        <div className="text-center py-16">
          <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
          <div className="text-gray-700 font-medium">Booking not found</div>
          <div className="text-gray-500 text-sm">Please go back and try again</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-pink-100">
            <div className="bg-gradient-to-r from-pink-500 to-pink-400 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Route</div>
                  <div className="text-xl font-bold">{booking.bus?.route?.name || 'Unknown Route'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Bus</div>
                  <div className="text-xl font-bold">{booking.bus?.bus_number || '—'}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${confirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {confirmed ? 'Confirmed' : (booking.status || 'Pending')}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {paid ? 'Paid' : (booking.payment_status || 'Unpaid')}
                </span>
                {booking.receipt_sent && (
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    Receipt Sent
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Booking ID</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">{booking.id}</span>
                  <button onClick={copyId} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg">
                    <Copy size={14} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Date</div>
                <div className="text-sm font-semibold text-gray-800">
                  {formatDate(booking.travel_date) || formatDate(booking.created_at)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Seats</div>
                <div className="text-sm font-semibold text-gray-800">{(booking.seats || []).join(', ') || '—'}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-gray-600 text-sm">Amount</div>
                <div className="text-sm font-bold text-pink-600">
                  {typeof booking.amount === 'number' ? `$${booking.amount}` : `$${Number(booking.amount || 0)}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500">Payment Method</div>
                  <div className="text-sm font-semibold text-gray-800">{booking.payment_method || '—'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500">Receipt</div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                    {booking.receipt_sent ? <CheckCircle size={16} className="text-green-600" /> : null}
                    {booking.receipt_sent ? 'Sent' : 'Not sent'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
