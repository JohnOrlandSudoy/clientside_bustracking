import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import NotificationBell from './NotificationBell'
import { useAuthAPI } from '../hooks/useAuthAPI'

export default function Layout() {
  const { user } = useAuthAPI()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white pb-24 sm:pb-20">
      {/* Header with Notification Bell */}
      {user && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm safe-top">
          <div className="max-w-lg mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Bus Tracker</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>
      )}
      
      {/* Main Content with proper mobile spacing */}
      <main className="px-4 sm:px-6 max-w-lg mx-auto">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  )
}