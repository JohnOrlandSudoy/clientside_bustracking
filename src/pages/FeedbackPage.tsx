import React, { useState } from 'react'
import { Star, MessageSquare, Send, ThumbsUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function FeedbackPage() {
  const { user } = useAuth()
  const [selectedBus, setSelectedBus] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const buses = [
    { id: 'bus-001', route: 'Downtown Express' },
    { id: 'bus-002', route: 'University Line' },
    { id: 'bus-003', route: 'Airport Shuttle' },
  ]

  const recentFeedback = [
    {
      id: 1,
      user: 'Sarah M.',
      route: 'Downtown Express',
      rating: 5,
      comment: 'Always on time and very clean buses. Great service!',
      date: '2 days ago',
    },
    {
      id: 2,
      user: 'Mike R.',
      route: 'University Line',
      rating: 4,
      comment: 'Good service overall, but could use more frequent trips during rush hour.',
      date: '1 week ago',
    },
    {
      id: 3,
      user: 'Emma L.',
      route: 'Airport Shuttle',
      rating: 5,
      comment: 'Perfect for airport trips! Driver was very helpful with luggage.',
      date: '2 weeks ago',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBus || rating === 0) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSubmitted(true)
      
      // Reset form after success
      setTimeout(() => {
        setSubmitted(false)
        setSelectedBus('')
        setRating(0)
        setComment('')
      }, 3000)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
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
              {renderStars(rating)}
            </div>
            <p className="text-gray-600 text-sm">
              Your {rating}-star review for {buses.find(b => b.id === selectedBus)?.route} has been recorded
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

      {/* Feedback Form */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        {/* Bus Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Bus Route</h3>
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
          disabled={!selectedBus || rating === 0 || isSubmitting}
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
          {recentFeedback.map((feedback) => (
            <div key={feedback.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{feedback.user}</h4>
                  <p className="text-sm text-gray-600">{feedback.route}</p>
                </div>
                <div className="text-right">
                  <div className="flex">{renderStars(feedback.rating, false, 16)}</div>
                  <p className="text-xs text-gray-500 mt-1">{feedback.date}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm">{feedback.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}