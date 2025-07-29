import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import TrackerPage from './pages/TrackerPage'
import BookingPage from './pages/BookingPage'
import FeedbackPage from './pages/FeedbackPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <div className="font-['Poppins'] bg-gradient-to-br from-pink-50 to-white min-h-screen">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="tracker" element={<TrackerPage />} />
            <Route path="tracker/:busId" element={<TrackerPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App