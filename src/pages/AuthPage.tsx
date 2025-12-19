import React, { useState, useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, UserCheck } from 'lucide-react'
import { useAuthAPI } from '../hooks/useAuthAPI'
import { supabase, getAuthRedirectUrl } from '../lib/supabase'

export default function AuthPage() {
  const { user, signUp, signIn, loading, isInitialized, forceReset, shouldRedirect, clearRedirectFlag, googleSignIn } = useAuthAPI()
  const [searchParams] = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [emailConfirmation, setEmailConfirmation] = useState(false)
  type ResetDebug = {
    redirectTo: string
    supabaseUrlPresent: boolean
    anonKeyPresent: boolean
    errorStatus?: number
    errorName?: string
    errorMessage?: string
  }
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState('')
  const [recoveryActive, setRecoveryActive] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [resetDebug, setResetDebug] = useState<ResetDebug | null>(null)

  // Reset form when user signs out (when user changes from authenticated to null)
  useEffect(() => {
    if (!user && isInitialized) {
      // User is not authenticated, ensure form is accessible
      setError('')
      setIsSubmitting(false)
      setEmailConfirmation(false)
      console.log('AuthPage: User not authenticated, form should be accessible')
    }
  }, [user, isInitialized])

  // Handle redirect flag from sign out
  useEffect(() => {
    if (shouldRedirect) {
      // Clear the redirect flag since we're already on the auth page
      clearRedirectFlag()
    }
  }, [shouldRedirect, clearRedirectFlag])

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'signup') {
      setIsLogin(false)
    } else if (mode === 'signin') {
      setIsLogin(true)
    }
  }, [searchParams])
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryActive(true)
        setIsLogin(true)
        setIsResetMode(false)
        setError('')
        setResetEmailSent('')
      }
    })
    return () => { sub.subscription?.unsubscribe() }
  }, [])

  // Debug logging to understand state
  useEffect(() => {
    console.log('AuthPage State:', {
      user: user ? 'Authenticated' : 'Not authenticated',
      loading,
      isInitialized,
      isSubmitting,
      error: error || 'None'
    })
  }, [user, loading, isInitialized, isSubmitting, error])

  // Show loading spinner only during initial authentication check
  // Don't show loading if user is not authenticated and we're initialized
  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Only redirect if user is authenticated and initialization is complete
  if (user && isInitialized) {
    return <Navigate to="/" replace />
  }

  // If not initialized yet, show a minimal loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    console.debug('Starting auth submission:', isLogin ? 'login' : 'signup')

    try {
      if (isResetMode) {
        try {
          const redirectTo = getAuthRedirectUrl()
          const baseDebug: ResetDebug = {
            redirectTo,
            supabaseUrlPresent: Boolean(import.meta.env.VITE_SUPABASE_URL),
            anonKeyPresent: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
          }
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(formData.email, { redirectTo })
          if (resetErr) {
            const errObj = resetErr as unknown as { status?: number; name?: string; message?: string }
            setError(errObj.message || 'Error sending recovery email')
            setResetDebug({
              ...baseDebug,
              errorStatus: errObj.status,
              errorName: errObj.name,
              errorMessage: errObj.message,
            })
          } else {
            setResetEmailSent('Password reset email sent')
            setResetDebug(baseDebug)
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to send reset email'
          setError(msg)
          setResetDebug({
            redirectTo: getAuthRedirectUrl(),
            supabaseUrlPresent: Boolean(import.meta.env.VITE_SUPABASE_URL),
            anonKeyPresent: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
            errorMessage: msg,
          })
        } finally {
          setIsSubmitting(false)
        }
        return
      }

      let result
      if (isLogin) {
        result = await signIn(formData.email, formData.password)
      } else {
        // Validate required fields for signup
        if (!formData.username || !formData.fullName || !formData.phone) {
          setError('Please fill in all required fields')
          setIsSubmitting(false)
          return
        }

        // Enhanced password validation
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long')
          setIsSubmitting(false)
          return
        }

        if (!/[A-Z]/.test(formData.password)) {
          setError('Password must contain at least one uppercase letter')
          setIsSubmitting(false)
          return
        }

        if (!/[a-z]/.test(formData.password)) {
          setError('Password must contain at least one lowercase letter')
          setIsSubmitting(false)
          return
        }

        if (!/[0-9]/.test(formData.password)) {
          setError('Password must contain at least one number')
          setIsSubmitting(false)
          return
        }
        result = await signUp(
          formData.email,
          formData.password,
          formData.username,
          formData.fullName,
          formData.phone
        )
      }

      if (result.error) {
        setError(result.error)
      } else if (!isLogin && result.data) {
        // Show email confirmation for successful signup
        setEmailConfirmation(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    setUpdatingPassword(true)
    setError('')
    try {
      const { data, error: updErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updErr) {
        setError(updErr.message)
      } else if (data) {
        setRecoveryActive(false)
        setNewPassword('')
        setIsLogin(true)
        setResetEmailSent('Password updated, please sign in')
      }
    } finally {
      setUpdatingPassword(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      fullName: '',
      phone: '',
    })
    setError('')
    setEmailConfirmation(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Reset form when switching between login/signup modes
  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setEmailConfirmation(false)
    resetForm()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-white px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-pink-400 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <User className="text-white" size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Client Account'}
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 px-1 sm:px-2">
            {isLogin ? 'Sign in to track your buses' : 'Join us as a client for better commuting'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-1 sm:p-1.5 lg:p-2 shadow-lg border border-pink-100 mb-3 sm:mb-4">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setEmailConfirmation(false); resetForm() }}
              className={`py-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${isLogin ? 'bg-pink-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setEmailConfirmation(false); resetForm() }}
              className={`py-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${!isLogin ? 'bg-pink-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={recoveryActive ? handleUpdatePassword : handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="bg-white rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-pink-100">
            {/* Email Field */}
            <div className="mb-3 sm:mb-4">
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 lg:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base touch-target"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting || recoveryActive}
                />
              </div>
            </div>

            {/* Username Field (Signup only) */}
            {!isLogin && !recoveryActive && (
              <div className="mb-3 sm:mb-4">
                <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Username
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 lg:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base touch-target"
                    placeholder="Choose a username"
                    required={!isLogin}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Full Name Field (Signup only) */}
            {!isLogin && !recoveryActive && (
              <div className="mb-3 sm:mb-4">
                <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 lg:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base touch-target"
                    placeholder="Enter your full name"
                    required={!isLogin}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Phone Field (Signup only) */}
            {!isLogin && !recoveryActive && (
              <div className="mb-3 sm:mb-4">
                <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 lg:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base touch-target"
                    placeholder="+63 912 345 6789"
                    required={!isLogin}
                    pattern="^(\+63|0)?[9]\d{9}$"
                    title="Please enter a valid Philippine mobile number (e.g., +639123456789 or 09123456789)"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            {!isResetMode && (
            <div className="mb-4 sm:mb-6">
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                {recoveryActive ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={recoveryActive ? newPassword : formData.password}
                  onChange={recoveryActive ? (e) => setNewPassword(e.target.value) : handleInputChange}
                  className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 lg:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base touch-target"
                  placeholder={recoveryActive ? 'Enter new password' : 'Enter your password'}
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50 p-1 touch-target"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Requirements */}
              {!isLogin && !recoveryActive && (
                <div className="mt-2 sm:mt-3 text-xs text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 6 characters
                  </div>
                  <div className="flex items-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    One uppercase letter
                  </div>
                  <div className="flex items-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    One lowercase letter
                  </div>
                  <div className="flex items-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1.5 sm:mr-2 ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    One number
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            {resetEmailSent && !recoveryActive && (
              <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-700 text-xs sm:text-sm">{resetEmailSent}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || updatingPassword}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 sm:mr-2"></div>
                  {recoveryActive ? 'Updating Password...' : isLogin ? 'Signing In...' : 'Creating Client Account...'}
                </div>
              ) : (
                recoveryActive ? 'Update Password' : isResetMode ? 'Send Reset Email' : isLogin ? 'Sign In' : 'Create Client Account'
              )}
            </button>
            {!recoveryActive && (
              <div className="mt-3">
                <button
                  type="button"
                  disabled={isSubmitting || updatingPassword}
                  onClick={async () => {
                    setError('')
                    setIsSubmitting(true)
                    const res = await googleSignIn()
                    if (res?.error) {
                      setError(res.error)
                    }
                    setIsSubmitting(false)
                  }}
                  className="w-full bg-white text-gray-800 py-2.5 sm:py-3 lg:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target border border-gray-200"
                >
                  <span className="inline-flex items-center justify-center">
                    <img src="/Google__G__logo.svg.png" alt="Google" className="w-5 h-5 mr-2" />
                    Continue with Google
                  </span>
                </button>
              </div>
            )}
          </div>

          {isResetMode && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
              <p className="text-gray-800 text-xs sm:text-sm font-semibold mb-2">Reset Diagnostics</p>
              <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                <div>Redirect URL: <span className="text-gray-900 font-mono">{resetDebug?.redirectTo || getAuthRedirectUrl()}</span></div>
                <div>Supabase URL present: <span className="font-semibold">{Boolean(import.meta.env.VITE_SUPABASE_URL) ? 'Yes' : 'No'}</span></div>
                <div>Anon key present: <span className="font-semibold">{Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) ? 'Yes' : 'No'}</span></div>
                {resetDebug?.errorStatus !== undefined && (
                  <div>Error Status: <span className="font-semibold">{resetDebug.errorStatus}</span></div>
                )}
                {resetDebug?.errorName && (
                  <div>Error Name: <span className="font-semibold">{resetDebug.errorName}</span></div>
                )}
                {resetDebug?.errorMessage && (
                  <div>Error Message: <span className="font-semibold text-red-600">{resetDebug.errorMessage}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Toggle Auth Mode */}
          <div className="text-center">
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-pink-600 font-semibold hover:text-pink-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                disabled={isSubmitting}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
            {!recoveryActive && (
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-2">
                <button
                  type="button"
                  onClick={() => { setIsResetMode(true); setIsLogin(true); setEmailConfirmation(false); setError(''); setResetEmailSent('') }}
                  className="text-pink-600 font-semibold hover:text-pink-700"
                >
                  Forgot password?
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Email Confirmation Section */}
        {emailConfirmation && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-green-100 mt-4 sm:mt-6">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-400 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="text-white" size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                Please Confirm Your Email
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                We've sent a confirmation email to <span className="text-green-600 font-semibold">{formData.email}</span>
              </p>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-green-700 text-sm">
                  📧 Check your inbox and click the confirmation link to activate your account.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmailConfirmation(false)
                    setIsLogin(true)
                    resetForm()
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-base"
                >
                  Continue to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setEmailConfirmation(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 text-base"
                >
                  Back to Sign Up
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-2xl p-4 mt-4 sm:mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🔧 Debug Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>User: {user ? 'Authenticated' : 'Not authenticated'}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
              <div>Form State: {isSubmitting ? 'Submitting' : 'Ready'}</div>
              <div>Mode: {isLogin ? 'Sign In' : 'Sign Up'}</div>
              <div>Should Redirect: {shouldRedirect ? 'Yes' : 'No'}</div>
            </div>
            <div className="mt-3 space-y-2">
              <button
                onClick={forceReset}
                className="w-full bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Force Reset Auth State
              </button>
              <button
                onClick={() => {
                  console.log('Current Auth State:', { user, loading, isInitialized, token: localStorage.getItem('auth_token'), shouldRedirect })
                }}
                className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Log Auth State to Console
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
