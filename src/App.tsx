import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthAPI } from './hooks/useAuthAPI'
import { BusTrackingProvider } from './contexts/BusTrackingContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import TrackerPage from './pages/TrackerPage'
import BookingPage from './pages/BookingPage'
import FeedbackPage from './pages/FeedbackPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'

function App() {
  const { user, loading } = useAuthAPI()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <NotificationProvider>
      <BusTrackingProvider>
        <Router>
          <div className="font-['Poppins'] bg-gradient-to-br from-pink-50 to-white min-h-screen">
            <Routes>
              {/* Auth route - redirect to home if already logged in */}
              <Route
                path="/auth"
                element={user ? <Navigate to="/" replace /> : <AuthPage />}
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
        </Router>
      </BusTrackingProvider>
    </NotificationProvider>
  )
}

export default App