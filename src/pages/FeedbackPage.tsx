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
        
        // Load buses
        const busesResponse = await authAPI.getBuses()
        if (busesResponse && Array.isArray(busesResponse)) {
          setBuses(busesResponse)
        } else {
          // Fallback to mock data if API doesn't return expected format
          setBuses([
            { id: 'c7c715d0-8195-4308-af1c-78b88f150cf4', route: 'Downtown Express' },
            { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', route: 'University Line' },
            { id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210', route: 'Airport Shuttle' },
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
          { id: 'c7c715d0-8195-4308-af1c-78b88f150cf4', route: 'Downtown Express' },
          { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', route: 'University Line' },
          { id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210', route: 'Airport Shuttle' },
        ])
      } finally {
        setLoadingBuses(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBus || rating === 0 || !user) {
      setError('Please select a bus and provide a rating.')
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

      console.log('Submitting feedback:', feedbackData) // Debug log

      const response = await authAPI.submitFeedback(feedbackData)
      
      console.log('Feedback response:', response) // Debug log
      
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
        {/* Bus Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Bus Route</h3>
          {loadingBuses ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading buses...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {buses.map((bus) => (
                <label
                  key={bus.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
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
                  <div className="font-semibold text-gray-800">{bus.route}</div>
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