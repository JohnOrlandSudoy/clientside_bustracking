import { Outlet, useNavigate } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import NotificationBell from './NotificationBell'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { useState, useEffect } from 'react'
import { Menu, Home, Bell, LogOut, ClipboardList } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import { authAPI } from '../lib/api'

export default function Layout() {
  const { user, signOut } = useAuthAPI()
  const navigate = useNavigate()
  const { state: notificationState } = useNotifications()
  const [open, setOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  interface RawBooking {
    id: string
    status?: string
    travel_date?: string
    created_at?: string
    bus?: { route?: { name?: string } }
  }
  interface OrderItem { id: string; route?: string; status?: string; date?: string }
  const [pendingOrders, setPendingOrders] = useState<OrderItem[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user?.id) return
      try {
        setOrdersLoading(true)
        const bookings = await authAPI.getUserBookings(user.id) as RawBooking[] | unknown
        const list: RawBooking[] = Array.isArray(bookings) ? (bookings as RawBooking[]) : []
        const filtered: OrderItem[] = list
          .filter((b: RawBooking) => {
            const s = (b.status || '').toLowerCase()
            return s === 'pending' || s === 'upcoming'
          })
          .map((b: RawBooking): OrderItem => ({
            id: b.id,
            route: b?.bus?.route?.name || 'Unknown Route',
            status: b.status || 'pending',
            date: b.travel_date ? new Date(b.travel_date).toLocaleDateString() : (b.created_at ? new Date(b.created_at).toLocaleDateString() : '')
          }))
        if (active) setPendingOrders(filtered)
      } finally {
        if (active) setOrdersLoading(false)
      }
    }
    load()
    const timer = window.setInterval(load, 10000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [user?.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white pb-28 sm:pb-24">
      {/* Header with Notification Bell */}
      {user && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
          <div className="max-w-lg mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 flex items-center justify-between">
            <div className="flex items-center">
              <img src="/AuroRide.jpg" alt="AuroRide" className="h-10 w-10 rounded-lg object-cover mr-3 shadow-sm" />
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Auro Ride</h1>
            </div>
            <div className="flex items-center gap-2 relative">
              {/* Orders icon with badge */}
              <button
                className="p-2 rounded-lg hover:bg-pink-50 active:scale-95 transition relative"
                onClick={() => setOrdersOpen((v) => !v)}
                aria-label="View orders"
              >
                <span className="relative inline-flex">
                  <ClipboardList size={20} />
                  {!ordersLoading && pendingOrders.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
                    </span>
                  )}
                </span>
              </button>
              {ordersOpen && (
                <div className="absolute right-12 top-10 bg-white border border-pink-100 rounded-xl shadow-lg w-64 z-50">
                  <div className="px-3 py-2 border-b">
                    <div className="flex items-center gap-2 text-gray-800">
                      <ClipboardList size={16} />
                      <span className="text-sm font-semibold">Orders</span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {ordersLoading ? (
                      <div className="px-3 py-3 text-xs text-gray-600">Loading orders…</div>
                    ) : pendingOrders.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-gray-600">No pending orders</div>
                    ) : (
                      pendingOrders.slice(0, 5).map((o) => (
                        <button
                          key={o.id}
                          className="w-full text-left px-3 py-2 hover:bg-pink-50"
                          onClick={() => { setOrdersOpen(false); navigate(`/orders/${o.id}`) }}
                        >
                          <div className="text-sm font-medium text-gray-800 truncate">{o.route}</div>
                          <div className="text-xs text-gray-500">
                            {o.date} • {o.status}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="px-3 py-2 border-t">
                    <button
                      className="w-full text-sm bg-pink-50 hover:bg-pink-100 text-pink-700 px-3 py-2 rounded-lg"
                      onClick={() => { setOrdersOpen(false); navigate('/profile') }}
                    >
                      View all
                    </button>
                  </div>
                </div>
              )}
              <NotificationBell />
              <button
                className="p-2 rounded-lg hover:bg-pink-50 active:scale-95 transition"
                onClick={() => setOpen((v) => !v)}
              >
                <Menu size={20} />
              </button>
              {open && (
                <div className="absolute right-0 top-10 bg-white border border-pink-100 rounded-xl shadow-lg w-48 z-50">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-pink-50 text-gray-800"
                    onClick={() => { setOpen(false); navigate('/') }}
                  >
                    <Home size={16} />
                    <span className="text-sm">Home</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-pink-50 text-gray-800 relative"
                    onClick={() => { setOpen(false); navigate('/notifications') }}
                  >
                    <Bell size={16} />
                    <span className="text-sm">Notifications</span>
                    {notificationState?.unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 px-2 flex items-center justify-center">
                        {notificationState.unreadCount > 99 ? '99+' : notificationState.unreadCount}
                      </span>
                    )}
                  </button>
                  {user && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600"
                      onClick={async () => { setOpen(false); await signOut(); navigate('/auth') }}
                    >
                      <LogOut size={16} />
                      <span className="text-sm">Logout</span>
                    </button>
                  )}
                </div>
              )}
              {(open || ordersOpen) && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => { setOpen(false); setOrdersOpen(false); }}
                />
              )}
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content with proper mobile spacing */}
      <main className="px-3 sm:px-4 lg:px-6 max-w-lg mx-auto pt-16 sm:pt-20">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  )
}
