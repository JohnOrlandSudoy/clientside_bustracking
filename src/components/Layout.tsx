import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white pb-20">
      <Outlet />
      <BottomNavigation />
    </div>
  )
}