import { useState, useEffect, useCallback } from 'react'
import { authAPI, SignUpData, LoginData, AuthResponse } from '../lib/api'

export interface User {
  id: string
  email: string
  username: string
  role: string
  profile: {
    fullName: string
    phone: string
  }
}

export function useAuthAPI() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [isInitialized, setIsInitialized] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Check if token is expired
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch {
      return true
    }
  }, [])

  // Validate and refresh user session
  const validateSession = useCallback(async (storedToken: string) => {
    try {
      const response = await authAPI.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data.user)
        setToken(response.data.token)
        // Update token if a new one was returned
        if (response.data.token !== storedToken) {
          localStorage.setItem('auth_token', response.data.token)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Session validation failed:', error)
      return false
    }
  }, [])

  // Refresh user session (useful for keeping user logged in)
  const refreshSession = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken && !isTokenExpired(storedToken)) {
      await validateSession(storedToken)
    }
  }, [isTokenExpired, validateSession])

  // Force reset authentication state (useful for debugging or manual reset)
  const forceReset = useCallback(() => {
    console.log('Force resetting authentication state')
    setUser(null)
    setToken(null)
    setLoading(false)
    setIsInitialized(true)
    localStorage.removeItem('auth_token')
  }, [])

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        
        if (storedToken) {
          // Check if token is expired
          if (isTokenExpired(storedToken)) {
            console.log('Token expired, clearing authentication')
            localStorage.removeItem('auth_token')
            setToken(null)
            setUser(null)
            setLoading(false)
            setIsInitialized(true)
            return
          }

          // Try to validate the session
          const isValid = await validateSession(storedToken)
          if (!isValid) {
            console.log('Session validation failed, clearing authentication')
            localStorage.removeItem('auth_token')
            setToken(null)
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Don't clear authentication on network errors, only on auth errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          localStorage.removeItem('auth_token')
          setToken(null)
          setUser(null)
        }
      } finally {
        setLoading(false)
        setIsInitialized(true)
        console.log('Auth check completed:', { user: user ? 'Authenticated' : 'Not authenticated', loading: false, isInitialized: true })
      }
    }

    checkAuth()

    // Add page visibility change listener to refresh session when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && user && token) {
        // Refresh session when user returns to the tab
        refreshSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTokenExpired, validateSession, user, token, refreshSession])

  const signUp = async (email: string, password: string, username: string, fullName: string, phone: string) => {
    const signUpData: SignUpData = {
      email,
      password,
      username,
      role: 'client', // Force role to be 'client' for client authentication
      profile: {
        fullName,
        phone,
      },
    }

    try {
      const response = await authAPI.signUp(signUpData)
      if (response.success && response.data) {
        setUser(response.data.user)
        setToken(response.data.token)
        localStorage.setItem('auth_token', response.data.token)
        return { data: response.data, error: null }
      } else {
        return { data: null, error: response.error || 'Sign up failed' }
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Sign up failed' }
    }
  }

  const signIn = async (email: string, password: string) => {
    const loginData: LoginData = {
      email,
      password,
    }

    try {
      const response = await authAPI.login(loginData)
      if (response.success && response.data) {
        setUser(response.data.user)
        setToken(response.data.token)
        localStorage.setItem('auth_token', response.data.token)
        return { data: response.data, error: null }
      } else {
        return { data: null, error: response.error || 'Login failed' }
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Login failed' }
    }
  }

  const signOut = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all authentication state immediately
      setUser(null)
      setToken(null)
      setLoading(false)
      setIsInitialized(true)
      localStorage.removeItem('auth_token')
      // Set redirect flag to indicate sign out occurred
      setShouldRedirect(true)
    }
    return { error: null }
  }

  // Reset redirect flag (useful for components to clear the flag after handling navigation)
  const clearRedirectFlag = useCallback(() => {
    setShouldRedirect(false)
  }, [])

  return {
    user,
    loading,
    token,
    isInitialized,
    shouldRedirect,
    signUp,
    signIn,
    signOut,
    refreshSession,
    forceReset,
    clearRedirectFlag,
  }
}