import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import NotificationBell from './NotificationBell'
import { useAuthAPI } from '../hooks/useAuthAPI'

export default function Layout() {
  const { user } = useAuthAPI()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white pb-28 sm:pb-24">
      {/* Header with Notification Bell */}
      {user && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm safe-top">
          <div className="max-w-lg mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Auro Ride</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content with proper mobile spacing */}
      <main className="px-3 sm:px-4 lg:px-6 max-w-lg mx-auto">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  )
}