import React, { useState, useEffect } from 'react'
import { Star, MessageSquare, Send, ThumbsUp, AlertCircle } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI } from '../lib/api'

interface Bus {
  id: string
  route: string
  name?: string
}

interface Feedback {
  id: string
  user_id: string | null
  bus_id: string | null
  rating: number
  comment: string
  created_at: string
}

export default function FeedbackPage() {
  const { user } = useAuthAPI()
  const [selectedBus, setSelectedBus] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [buses, setBuses] = useState<Bus[]>([])
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([])
  const [loadingBuses, setLoadingBuses] = useState(true)
  const [submittedFeedback, setSubmittedFeedback] = useState<Feedback | null>(null)

  // Load buses from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingBuses(true)
        
        // Load buses - use getAllBuses for client access
        const busesResponse = await authAPI.getAllBuses()
        if (busesResponse && Array.isArray(busesResponse)) {
          // Transform the response to match our Bus interface
          const transformedBuses = busesResponse.map((bus: any) => ({
            id: bus.id,
            route: bus.route || bus.route_name || `Bus ${bus.bus_number}`,
            name: bus.bus_number || bus.name
          }))
          setBuses(transformedBuses)
        } else {
          // Fallback to mock data if API doesn't return expected format
          setBuses([
            { id: 'c7c715d0-8195-4308-af1c-78b88f150cf4', route: 'Downtown Express', name: 'BUS001' },
            { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', route: 'University Line', name: 'BUS002' },
            { id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210', route: 'Airport Shuttle', name: 'BUS003' },
            { id: 'd4e5f6g7-h8i9-0123-jklm-n4o5p6q7r8s9', route: 'Shopping Center Express', name: 'BUS004' },
            { id: 'e5f6g7h8-i9j0-1234-klmn-o5p6q7r8s9t0', route: 'Hospital Route', name: 'BUS005' },
          ])
        }

        // Load recent feedback
        try {
          const feedbackResponse = await authAPI.getRecentFeedback()
          if (feedbackResponse && Array.isArray(feedbackResponse)) {
            setRecentFeedback(feedbackResponse)
          }
        } catch (feedbackError) {
          console.error('Failed to load recent feedback:', feedbackError)
          // Keep empty array for recent feedback
        }
      } catch (error) {
        console.error('Failed to load buses:', error)
        // Fallback to mock data
        setBuses([
          { id: 'c7c715d0-8195-4308-af1c-78b88f150cf4', route: 'Downtown Express', name: 'BUS001' },
          { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', route: 'University Line', name: 'BUS002' },
          { id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210', route: 'Airport Shuttle', name: 'BUS003' },
          { id: 'd4e5f6g7-h8i9-0123-jklm-n4o5p6q7r8s9', route: 'Shopping Center Express', name: 'BUS004' },
          { id: 'e5f6g7h8-i9j0-1234-klmn-o5p6q7r8s9t0', route: 'Hospital Route', name: 'BUS005' },
        ])
      } finally {
        setLoadingBuses(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBus) {
      setError('Please select a bus route to provide feedback for.')
      return
    }
    if (rating === 0) {
      setError('Please provide a rating for your experience.')
      return
    }
    if (!user) {
      setError('Please log in to submit feedback.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const feedbackData = {
        user_id: user.id,
        bus_id: selectedBus,
        rating: rating,
        comment: comment || 'No comment provided'
      }

      const response = await authAPI.submitFeedback(feedbackData)
      
      if (response && response.id) {
        setSubmitted(true)
        setSubmittedFeedback(response) // Store the submitted feedback data
        
        // Reset form after success
        setTimeout(() => {
          setSubmitted(false)
          setSelectedBus('')
          setRating(0)
          setComment('')
          setSubmittedFeedback(null) // Clear submitted feedback data
        }, 3000)
      } else {
        setError('Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      if (error instanceof Error) {
        setError(`Failed to submit feedback: ${error.message}`)
      } else {
        setError('Failed to submit feedback. Please check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (currentRating: number, interactive: boolean = false, size: number = 24) => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type={interactive ? 'button' : undefined}
        onClick={interactive ? () => setRating(index + 1) : undefined}
        className={`${interactive ? 'hover:scale-110 transition-transform duration-200' : ''} ${
          interactive ? 'cursor-pointer' : 'cursor-default'
        }`}
        disabled={!interactive}
      >
        <Star
          size={size}
          className={`${
            index < currentRating
              ? 'text-yellow-500 fill-current'
              : 'text-gray-300'
          } ${interactive ? 'hover:text-yellow-400' : ''}`}
        />
      </button>
    ))
  }

  if (submitted) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ThumbsUp className="text-white" size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your feedback helps us improve our service
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <h3 className="font-semibold text-gray-800 mb-2">Feedback Submitted</h3>
            <div className="flex justify-center mb-2">
              {renderStars(submittedFeedback?.rating || 0)}
            </div>
            <p className="text-gray-600 text-sm">
              Your {submittedFeedback?.rating}-star review for {buses.find(b => b.id === submittedFeedback?.bus_id)?.route} has been recorded
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Share Your Experience</h1>
        <p className="text-gray-600">Help us improve our bus service</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
          <AlertCircle className="text-red-500 mr-3" size={20} />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        {/* Instructions */}
        <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-2xl p-6 border border-pink-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">How to provide feedback</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Select the bus route you traveled on</li>
                <li>2. Rate your experience from 1 to 5 stars</li>
                <li>3. Add optional comments about your journey</li>
                <li>4. Submit your feedback to help improve our service</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Bus Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Select Bus Route</h3>
            {!loadingBuses && buses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setLoadingBuses(true)
                  // Reload buses
                  const loadData = async () => {
                    try {
                      const busesResponse = await authAPI.getAllBuses()
                      if (busesResponse && Array.isArray(busesResponse)) {
                        const transformedBuses = busesResponse.map((bus: any) => ({
                          id: bus.id,
                          route: bus.route || bus.route_name || `Bus ${bus.bus_number}`,
                          name: bus.bus_number || bus.name
                        }))
                        setBuses(transformedBuses)
                      }
                    } catch (error) {
                      console.error('Failed to reload buses:', error)
                    } finally {
                      setLoadingBuses(false)
                    }
                  }
                  loadData()
                }}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
          {loadingBuses ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading bus routes...</span>
            </div>
          ) : buses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">No bus routes available</p>
              <p className="text-sm text-gray-500 mb-4">We couldn't load the available bus routes</p>
              <button
                type="button"
                onClick={() => {
                  setLoadingBuses(true)
                  const loadData = async () => {
                    try {
                      const busesResponse = await authAPI.getAllBuses()
                      if (busesResponse && Array.isArray(busesResponse)) {
                        const transformedBuses = busesResponse.map((bus: any) => ({
                          id: bus.id,
                          route: bus.route || bus.route_name || `Bus ${bus.bus_number}`,
                          name: bus.bus_number || bus.name
                        }))
                        setBuses(transformedBuses)
                      }
                    } catch (error) {
                      console.error('Failed to reload buses:', error)
                    } finally {
                      setLoadingBuses(false)
                    }
                  }
                  loadData()
                }}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {buses.map((bus) => (
                <label
                  key={bus.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedBus === bus.id
                      ? 'border-pink-500 bg-pink-50 shadow-md'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
                  }`}
                >
                  <input
                    type="radio"
                    name="bus"
                    value={bus.id}
                    checked={selectedBus === bus.id}
                    onChange={(e) => setSelectedBus(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{bus.route}</div>
                      {bus.name && (
                        <div className="text-sm text-gray-600 mt-1">Bus {bus.name}</div>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedBus === bus.id
                        ? 'border-pink-500 bg-pink-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedBus === bus.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Star className="mr-2 text-pink-500" size={20} />
            Rate Your Experience
          </h3>
          <div className="flex justify-center space-x-2 mb-4">
            {renderStars(rating, true, 32)}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && 'Poor - Needs significant improvement'}
              {rating === 2 && 'Fair - Below expectations'}
              {rating === 3 && 'Good - Met expectations'}
              {rating === 4 && 'Very Good - Exceeded expectations'}
              {rating === 5 && 'Excellent - Outstanding service'}
            </p>
          </div>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="mr-2 text-pink-500" size={20} />
            Comments (Optional)
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience... What went well? What could be improved?"
            rows={4}
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none"
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500 mt-2">
            {comment.length}/500 characters
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedBus || rating === 0 || isSubmitting || !user}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Submitting Feedback...
            </>
          ) : !selectedBus ? (
            <>
              <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select a Bus Route First
            </>
          ) : rating === 0 ? (
            <>
              <Star className="mr-2" size={18} />
              Rate Your Experience
            </>
          ) : (
            <>
              <Send className="mr-2" size={18} />
              Submit Feedback
            </>
          )}
        </button>
      </form>

      {/* Recent Feedback */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {recentFeedback.length > 0 ? (
            recentFeedback.map((feedback) => (
              <div key={feedback.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">User</h4>
                    <p className="text-sm text-gray-600">
                      {buses.find(b => b.id === feedback.bus_id)?.route || 'Unknown Route'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex">{renderStars(feedback.rating, false, 16)}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{feedback.comment}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto mb-2" size={24} />
              <p>No recent feedback available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}