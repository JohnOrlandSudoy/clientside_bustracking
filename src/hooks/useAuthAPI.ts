import { useState, useEffect, useCallback } from 'react'
import { authAPI, SignUpData, LoginData, AuthResponse } from '../lib/api'
import { supabase } from '../lib/supabase'

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
      const isExpired = payload.exp < currentTime
      console.debug('Token check:', { 
        isExpired, 
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        currentTime: new Date(currentTime * 1000).toISOString()
      })
      return isExpired
    } catch (err) {
      console.error('Token parse error:', err)
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
        console.debug('Checking auth with token:', storedToken ? 'present' : 'none')
        
        if (!storedToken) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            localStorage.setItem('auth_token', session.access_token)
            setToken(session.access_token)
            try {
              const me = await authAPI.getCurrentUser()
              if (me.success && me.data) {
                setUser(me.data.user)
              } else {
                setUser(null)
              }
            } catch {
              setUser(null)
            }
          } else {
            setUser(null)
            setToken(null)
            return
          }
        }

        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.debug('Token is expired, clearing auth state')
          localStorage.removeItem('auth_token')
          setToken(null)
          setUser(null)
          return
        }

        // Try to validate the session
        const isValid = await validateSession(storedToken)
        console.debug('Session validation result:', isValid)
        
        if (!isValid) {
          console.debug('Session invalid, clearing auth state')
          localStorage.removeItem('auth_token')
          setToken(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Only clear on auth errors, not network errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          console.debug('Auth error detected, clearing state')
          localStorage.removeItem('auth_token')
          setToken(null)
          setUser(null)
        }
      } finally {
        setLoading(false)
        setIsInitialized(true)
        console.debug('Auth check completed:', { 
          hasUser: !!user,
          hasToken: !!token,
          loading: false, 
          isInitialized: true 
        })
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

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        localStorage.setItem('auth_token', session.access_token)
        setToken(session.access_token)
        try {
          const me = await authAPI.getCurrentUser()
          if (me.success && me.data) {
            setUser(me.data.user)
          }
        } catch {
          setUser(null)
        } finally {
          setIsInitialized(true)
          setLoading(false)
        }
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('auth_token')
        setUser(null)
        setToken(null)
      }
    })
    return () => { sub.subscription?.unsubscribe() }
  }, [])

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
        // Only log in if we have a valid token
        if (response.data.token) {
          setUser(response.data.user)
          setToken(response.data.token)
          localStorage.setItem('auth_token', response.data.token)
        }
        return { data: response.data, error: null }
      } else {
        return { data: null, error: response.error || 'Sign up failed' }
      }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Sign up failed' }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.debug('Starting sign in process for:', email)
    const loginData: LoginData = {
      email,
      password,
    }

    try {
      const response = await authAPI.login(loginData)
      console.debug('Login response:', { success: response.success, hasData: !!response.data })
      
      if (response.success && response.data) {
        // Set token first to ensure it's available for subsequent API calls
        localStorage.setItem('auth_token', response.data.token)
        setToken(response.data.token)
        
        // Set user and trigger state update
        setUser(response.data.user)
        console.debug('Auth state updated:', { 
          hasUser: !!response.data.user,
          hasToken: !!response.data.token 
        })
        
        return { data: response.data, error: null }
      } else {
        console.debug('Login failed:', response.error)
        return { data: null, error: response.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Login failed' }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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

  const googleSignIn = async () => {
    try {
      const redirectTo = window.location.origin
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      })
      if (error) {
        return { data: null, error: error.message }
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Google sign-in failed' }
    }
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
    googleSignIn,
  }
}
