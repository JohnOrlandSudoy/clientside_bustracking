import React from 'react'

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="text-pink-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}