import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthAPI } from './hooks/useAuthAPI'
import DevWarning from './components/DevWarning'
import { BusTrackingProvider } from './contexts/BusTrackingContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import TrackerPage from './pages/TrackerPage'
import BookingPage from './pages/BookingPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import FeedbackPage from './pages/FeedbackPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import BookingDetailsPage from './pages/BookingDetailsPage'

// Inner component to handle navigation (must be inside Router context)
function AppContent() {
  const { user, loading, isInitialized, refreshSession, shouldRedirect, clearRedirectFlag } = useAuthAPI()
  const isRecovery = typeof window !== 'undefined' && window.location.href.includes('type=recovery')

  // Handle redirect after sign out
  useEffect(() => {
    if (shouldRedirect) {
      // For React Router v6, we'll use window.location for the redirect
      window.location.href = '/'
      clearRedirectFlag()
    }
  }, [shouldRedirect, clearRedirectFlag])

  // Refresh session periodically to keep user logged in
  useEffect(() => {
    if (user && isInitialized) {
      // Refresh session every 5 minutes
      const interval = setInterval(() => {
        refreshSession()
      }, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [user, isInitialized, refreshSession])

  // Show loading spinner while checking authentication
  if (loading || !isInitialized) {
    return <LoadingSpinner />
  }

  return (
    <div className="font-['Poppins'] min-h-screen flex flex-col">
      <Routes>
        {/* Auth route - redirect to home if already logged in */}
        <Route
          path="/auth"
          element={user && !isRecovery ? <Navigate to="/" replace /> : <AuthPage />}
        />
        
        {/* Main app routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="tracker/:busId" element={<TrackerPage />} />
          
          {/* Protected routes */}
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute>
                <BookingDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="booking-success"
            element={
              <ProtectedRoute>
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <NotificationProvider>
      <BusTrackingProvider>
        <Router>
          <AppContent />
          <DevWarning />
        </Router>
      </BusTrackingProvider>
    </NotificationProvider>
  )
}

export default App
