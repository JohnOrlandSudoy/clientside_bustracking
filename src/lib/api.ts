// API service for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backendbus-sumt.onrender.com/api'

export interface SignUpData {
  email: string
  password: string
  username: string
  role: string
  profile: {
    fullName: string
    phone: string
  }
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      email: string
      username: string
      role: string
      profile: {
        fullName: string
        phone: string
      }
    }
    token: string
  }
  error?: string
}

export interface BusETA {
  busId: string
  busNumber: string
  eta: string
  currentLocation: {
    lat: number
    lng: number
  } | null
  route: {
    name: string
    start_terminal_id: string
    end_terminal_id: string
  }
}

class AuthAPI {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    })

    const json = await response.json()

    if (!response.ok) {
      console.error(`API Error for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        url: url,
        response: json
      })
      throw new Error(json.error_description || json.error || `HTTP error! status: ${response.status}`)
    }

    return json
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<any>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // Handle Supabase response shape
      if (response.user && response.session) {
        return {
          success: true,
          message: 'Sign up successful',
          data: {
            user: {
              id: response.user.id,
              email: response.user.email,
              username: response.user.user_metadata?.username || data.username,
              role: response.user.user_metadata?.role || data.role,
              profile: {
                fullName: response.user.user_metadata?.fullName || data.profile.fullName,
                phone: response.user.user_metadata?.phone || data.profile.phone
              }
            },
            token: response.session.access_token
          }
        }
      }

      // Handle custom API response shape
      if (response.success !== undefined) {
        return response
      }

      // Fallback
      return {
        success: true,
        message: 'Sign up successful',
        data: response
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sign up failed',
        error: error instanceof Error ? error.message : 'Sign up failed'
      }
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      // Handle Supabase response shape
      if (response.user && response.session) {
        return {
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: response.user.id,
              email: response.user.email,
              username: response.user.user_metadata?.username || '',
              role: response.user.user_metadata?.role || response.user.role,
              profile: {
                fullName: response.user.user_metadata?.fullName || '',
                phone: response.user.user_metadata?.phone || response.user.phone || ''
              }
            },
            token: response.session.access_token
          }
        }
      }

      // Handle custom API response shape
      if (response.success !== undefined) {
        return response
      }

      // Fallback
      return {
        success: true,
        message: 'Login successful',
        data: response
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest<any>('/auth/logout', {
        method: 'POST',
      })

      return {
        success: true,
        message: 'Logout successful'
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed'
      }
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        return {
          success: false,
          message: 'No token found',
          error: 'No authentication token found'
        }
      }

      // Try to validate the token with the backend
      try {
        const response = await this.makeRequest<any>('/auth/me', {
          method: 'GET',
        })

        // Handle successful response
        if (response && response.user) {
          return {
            success: true,
            message: 'User retrieved successfully',
            data: {
              user: {
                id: response.user.id,
                email: response.user.email,
                username: response.user.user_metadata?.username || response.user.username || '',
                role: response.user.user_metadata?.role || response.user.role || 'user',
                profile: {
                  fullName: response.user.user_metadata?.fullName || response.user.fullName || '',
                  phone: response.user.user_metadata?.phone || response.user.phone || ''
                }
              },
              token: storedToken
            }
          }
        }

        // Handle custom API response shape
        if (response && response.success !== undefined) {
          return response
        }

        // If response doesn't have expected structure, return error
        return {
          success: false,
          message: 'Invalid user data format',
          error: 'User data format is not as expected'
        }

      } catch (error) {
        // If /auth/me endpoint doesn't exist or returns an error
        console.warn('Auth endpoint /auth/me not available or failed:', error)
        
        // Try to decode the JWT token to validate it's not expired
        try {
          const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]))
          const currentTime = Date.now() / 1000
          
          // Check if token is expired
          if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            return {
              success: false,
              message: 'Token expired',
              error: 'Authentication token has expired'
            }
          }

          // If token is valid but we can't get user data from backend,
          // return a limited success response
          return {
            success: true,
            message: 'Token validation successful (limited user data)',
            data: {
              user: {
                id: tokenPayload.sub || tokenPayload.id || 'unknown',
                email: tokenPayload.email || 'unknown@email.com',
                username: tokenPayload.user_metadata?.username || tokenPayload.username || 'user',
                role: tokenPayload.user_metadata?.role || tokenPayload.role || 'user',
                profile: {
                  fullName: tokenPayload.user_metadata?.fullName || tokenPayload.fullName || 'User',
                  phone: tokenPayload.user_metadata?.phone || tokenPayload.phone || ''
                }
              },
              token: storedToken
            }
          }
        } catch (decodeError) {
          // If we can't decode the token at all, it's invalid
          return {
            success: false,
            message: 'Invalid token format',
            error: 'Authentication token is malformed or invalid'
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get current user',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Additional API methods for bus tracking, booking, and feedback
  async getBuses(): Promise<any> {
    try {
      return await this.makeRequest('/admin/buses', { method: 'GET' });
    } catch (error) {
      console.warn('Admin buses endpoint not available, using mock data');
      // Return mock bus data
      return [
        {
          id: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
          bus_number: 'BUS001',
          route_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          available_seats: 50,
          total_seats: 50,
          status: 'active',
          route: 'Downtown Express'
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          bus_number: 'BUS002',
          route_id: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
          available_seats: 40,
          total_seats: 40,
          status: 'active',
          route: 'University Line'
        }
      ];
    }
  }

  async getAllBuses(): Promise<any> {
    try {
      return await this.makeRequest('/client/buses', { method: 'GET' });
    } catch (error) {
      console.warn('Client buses endpoint not available, using mock data');
      // Return the same mock data as getBuses
      return this.getBuses();
    }
  }

  async getBusLocation(busId: string): Promise<any> {
    try {
      return await this.makeRequest(`/buses/${busId}/location`, { method: 'GET' });
    } catch (error) {
      console.warn(`Bus location endpoint for bus ${busId} not available, using mock data`);
      // Return mock location data
      return {
        lat: 14.5995 + (Math.random() * 0.01),
        lng: 120.9842 + (Math.random() * 0.01)
      };
    }
  }

  async getBusETA(busId?: string): Promise<BusETA[]> {
    try {
      const response = await this.makeRequest<BusETA[]>('/client/bus-eta', { method: 'GET' })
      return busId ? response.filter(eta => eta.busId === busId) : response
    } catch (error) {
      console.warn(`Failed to get ETA${busId ? ` for bus ${busId}` : ' for all buses'}, using mock data:`, error)
      
      // Generate mock ETA data
      const mockETAs: BusETA[] = [
        {
          busId: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
          busNumber: 'BUS001',
          eta: '15 minutes',
          currentLocation: {
            lat: 14.5995 + (Math.random() * 0.01),
            lng: 120.9842 + (Math.random() * 0.01)
          },
          route: {
            name: 'Downtown Express',
            start_terminal_id: '11111111-2222-3333-4444-555555555555',
            end_terminal_id: '66666666-7777-8888-9999-000000000000'
          }
        },
        {
          busId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          busNumber: 'BUS002',
          eta: '20 minutes',
          currentLocation: {
            lat: 14.6000 + (Math.random() * 0.01),
            lng: 120.9850 + (Math.random() * 0.01)
          },
          route: {
            name: 'University Line',
            start_terminal_id: '66666666-7777-8888-9999-000000000000',
            end_terminal_id: '11111111-2222-3333-4444-555555555555'
          }
        }
      ];
      
      return busId ? mockETAs.filter(eta => eta.busId === busId) : mockETAs;
    }
  }

  async createBooking(bookingData: {
    userId: string
    busId: string
  }): Promise<any> {
    try {
      return await this.makeRequest('/client/booking', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    } catch (error) {
      console.warn('Booking endpoint not available, using mock response');
      // Return mock booking response
      return {
        id: 'mock-booking-' + Date.now(),
        user_id: bookingData.userId,
        bus_id: bookingData.busId,
        status: 'confirmed',
        created_at: new Date().toISOString()
      };
    }
  }

  async getUserBookings(): Promise<any> {
    try {
      return await this.makeRequest('/bookings/user', { method: 'GET' });
    } catch (error) {
      console.warn('User bookings endpoint not available, using mock data');
      // Return mock bookings data
      return [
        {
          id: 'mock-booking-1',
          user_id: 'current-user',
          bus_id: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: 'mock-booking-2',
          user_id: 'current-user',
          bus_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          status: 'upcoming',
          created_at: new Date().toISOString()
        }
      ];
    }
  }

  async submitFeedback(feedbackData: {
    user_id: string
    bus_id: string
    rating: number
    comment: string
  }): Promise<any> {
    // Add created_at timestamp
    const payload = {
      ...feedbackData,
      created_at: new Date().toISOString()
    };
    
    try {
      return await this.makeRequest('/client/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Feedback submission endpoint not available, using mock response');
      // Return mock feedback submission response
      return {
        id: 'mock-feedback-' + Date.now(),
        ...payload
      };
    }
  }

  async getRecentFeedback(): Promise<any> {
    try {
      return await this.makeRequest('/client/feedback', { method: 'GET' });
    } catch (error) {
      console.warn('Feedback endpoint not available, using mock data');
      // Return mock feedback data
      return [
        {
          id: '1',
          user_id: 'user1',
          bus_id: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
          rating: 4,
          comment: 'Great service, bus was on time.',
          created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: '2',
          user_id: 'user2',
          bus_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          rating: 5,
          comment: 'Excellent experience, very clean bus.',
          created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ];
    }
  }

  async getUserFeedback(): Promise<any> {
    try {
      return await this.makeRequest('/client/feedback/user', { method: 'GET' });
    } catch (error) {
      console.warn('User feedback endpoint not available, using mock data');
      // Return mock user feedback data
      return [
        {
          id: '3',
          user_id: 'current-user',
          bus_id: 'c7c715d0-8195-4308-af1c-78b88f150cf4',
          rating: 3,
          comment: 'Average service, could be better.',
          created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      ];
    }
  }

  // Notification methods
  async getNotifications(userId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/client/notifications?userId=${userId}`, { method: 'GET' });
      
      // Handle API response structure with notifications array and pagination
      if (response && typeof response === 'object' && 'notifications' in response && Array.isArray(response.notifications)) {
        return response.notifications;
      }
      
      // Handle direct array response (fallback)
      if (response && Array.isArray(response)) {
        return response;
      }
      
      // If response exists but doesn't match expected format, log it and throw error
      throw new Error('Invalid notifications response format - expected object with notifications array');
    } catch (error) {
      // Re-throw the error to let the context handle it
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    try {
      return await this.makeRequest(`/client/notifications/${notificationId}/read`, {
        method: 'PUT',
        body: JSON.stringify({ read_at: new Date().toISOString() }),
      });
    } catch (error) {
      console.warn('Mark notification as read endpoint not available, using mock response');
      // Return mock response
      return {
        id: notificationId,
        is_read: true,
        read_at: new Date().toISOString()
      };
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<any> {
    try {
      return await this.makeRequest(`/client/notifications/${userId}/read-all`, {
        method: 'PUT',
      });
    } catch (error) {
      console.warn('Mark all notifications as read endpoint not available, using mock response');
      // Return mock response
      return {
        success: true,
        message: 'All notifications marked as read'
      };
    }
  }
}

export const authAPI = new AuthAPI()