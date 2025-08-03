import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken) {
        try {
          const response = await authAPI.getCurrentUser()
          if (response.success && response.data) {
            setUser(response.data.user)
            setToken(response.data.token)
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token')
            setToken(null)
            setUser(null)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          // Don't clear the token immediately on error, as it might be a network issue
          // Only clear if it's a specific authentication error
          if (error instanceof Error && error.message.includes('401')) {
            localStorage.removeItem('auth_token')
            setToken(null)
            setUser(null)
          }
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const signUp = async (email: string, password: string, username: string, fullName: string, phone: string) => {
    const signUpData: SignUpData = {
      email,
      password,
      username,
      role: 'user', // Default role
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
      setUser(null)
      setToken(null)
      localStorage.removeItem('auth_token')
    }
    return { error: null }
  }

  return {
    user,
    loading,
    token,
    signUp,
    signIn,
    signOut,
  }
}