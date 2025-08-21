import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthAPI } from '../hooks/useAuthAPI'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isInitialized } = useAuthAPI()

  // Show loading spinner while checking authentication
  if (loading || !isInitialized) {
    return <LoadingSpinner />
  }

  // Only redirect if authentication check is complete and user is not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}