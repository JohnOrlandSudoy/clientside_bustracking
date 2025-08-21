import React, { useState, useEffect } from 'react'
import { Star, MessageSquare, Send, ThumbsUp, AlertCircle, MapPin, RefreshCw, Check } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { authAPI } from '../lib/api'

interface Bus {
  id: string
  route: string
  name: string
  route_name?: string
  bus_number?: string
  available_seats?: number
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
  const [success, setSuccess] = useState('')

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
            name: bus.bus_number || bus.name,
            route_name: bus.route_name,
            bus_number: bus.bus_number,
            available_seats: bus.available_seats
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
    setSuccess('')

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
        setSuccess('Your feedback has been submitted! Thank you for your feedback.')
        
        // Reset form after success
        setTimeout(() => {
          setSubmitted(false)
          setSelectedBus('')
          setRating(0)
          setComment('')
          setSubmittedFeedback(null) // Clear submitted feedback data
          setSuccess('') // Clear success message
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

  const loadBuses = async () => {
    setLoadingBuses(true)
    try {
      const busesResponse = await authAPI.getAllBuses()
      if (busesResponse && Array.isArray(busesResponse)) {
        const transformedBuses = busesResponse.map((bus: any) => ({
          id: bus.id,
          route: bus.route || bus.route_name || `Bus ${bus.bus_number}`,
          name: bus.bus_number || bus.name,
          route_name: bus.route_name,
          bus_number: bus.bus_number,
          available_seats: bus.available_seats
        }))
        setBuses(transformedBuses)
      } else {
        setBuses([
          { id: 'c7c715d0-8195-4308-af1c-78b88f150cf4', route: 'Downtown Express', name: 'BUS001' },
          { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', route: 'University Line', name: 'BUS002' },
          { id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210', route: 'Airport Shuttle', name: 'BUS003' },
          { id: 'd4e5f6g7-h8i9-0123-jklm-n4o5p6q7r8s9', route: 'Shopping Center Express', name: 'BUS004' },
          { id: 'e5f6g7h8-i9j0-1234-klmn-o5p6q7r8s9t0', route: 'Hospital Route', name: 'BUS005' },
        ])
      }
    } catch (error) {
      console.error('Failed to reload buses:', error)
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
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-lg mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Send Feedback</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">Help us improve our service</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-800 mb-2 flex items-center">
          <MessageSquare className="mr-1.5 sm:mr-2" size={18} />
          How to Submit Feedback
        </h3>
        <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
          <li>• Select a bus route you want to provide feedback for</li>
          <li>• Rate your experience from 1-5 stars</li>
          <li>• Share your comments and suggestions</li>
          <li>• Your feedback helps improve our service</li>
        </ul>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertCircle className="text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-red-600 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
          <Check className="text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-green-600 text-xs sm:text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <MapPin className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
            Select Bus Route
          </h3>
          
          {loadingBuses ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600 text-xs sm:text-sm">Loading routes...</span>
            </div>
          ) : buses.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <MapPin className="mx-auto mb-2 sm:mb-3 text-gray-300" size={24} />
              <p className="text-gray-600 mb-1.5 sm:mb-2 text-xs sm:text-sm lg:text-base">No bus routes available</p>
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Please try refreshing the page</p>
              <button
                type="button"
                onClick={loadBuses}
                className="bg-pink-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-pink-600 transition-colors duration-200 touch-target"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {buses.map((bus) => (
                <label
                  key={bus.id}
                  className={`block p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedBus === bus.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base truncate">
                        {bus.route_name || 'Unknown Route'}
                      </h4>
                      <div className="space-y-1 mt-1">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Bus: {bus.bus_number}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {bus.available_seats || 0} seats available
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs sm:text-sm text-gray-500">Route ID</div>
                      <div className="text-xs sm:text-sm font-mono text-gray-600 break-all max-w-[80px] sm:max-w-[120px]">
                        {bus.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          {buses.length > 0 && (
            <button
              type="button"
              onClick={loadBuses}
              className="mt-3 sm:mt-4 w-full sm:w-auto bg-gray-100 text-gray-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center touch-target"
            >
              <RefreshCw className="mr-1.5 sm:mr-2" size={14} />
              Refresh Routes
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <Star className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
            Rate Your Experience
          </h3>
          
          <div className="flex justify-center space-x-1 sm:space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl sm:text-3xl lg:text-4xl transition-all duration-200 hover:scale-110 active:scale-95 touch-target ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          
          <div className="text-center mt-2 sm:mt-3">
            <p className="text-xs sm:text-sm text-gray-600">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <MessageSquare className="mr-1.5 sm:mr-2 text-pink-500" size={18} />
            Additional Comments
          </h3>
          
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience, suggestions, or any issues you encountered..."
            rows={4}
            className="w-full p-3 sm:p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none text-xs sm:text-sm lg:text-base touch-target"
            maxLength={500}
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {comment.length}/500 characters
            </span>
            {comment.length > 400 && (
              <span className="text-xs text-orange-600">
                {500 - comment.length} characters left
              </span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedBus || rating === 0 || isSubmitting}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs sm:text-sm lg:text-base touch-target"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
              Submitting Feedback...
            </div>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </form>

      {/* Recent Feedback */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100 mt-4 sm:mt-6">
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