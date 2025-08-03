# API Authentication Setup

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Supabase Configuration (if you still want to use Supabase for other features)
VITE_SUPABASE_URL=https://ysxcngthzeajjrxwqgvq.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## API Endpoints

The application now uses custom API endpoints for authentication:

### POST /api/auth/signup
Register a new user with the following JSON structure:
```json
{
  "email": "johnorlandsudoy70@gmail.com",
  "password": "pPPassword123",
  "username": "adminuser",
  "role": "admin",
  "profile": {
    "fullName": "Test admin",
    "phone": "09171234567"
  }
}
```

### POST /api/auth/login
Log in a user with the following JSON structure:
```json
{
  "email": "johnorlandsudoy70@gmail.com",
  "password": "pPPassword123"
}
```

### POST /api/auth/logout
Log out the current user (requires authentication token)

### GET /api/auth/me
Get current user information (requires authentication token)

## Response Format

All API endpoints return responses in this format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "profile": {
        "fullName": "Full Name",
        "phone": "1234567890"
      }
    },
    "token": "jwt-token-here"
  }
}
```

## Features Implemented

### Authentication Flow
- ✅ Sign up with email, password, username, full name, and phone
- ✅ Sign in with email and password
- ✅ Automatic token storage in localStorage
- ✅ Token-based authentication for protected routes
- ✅ Automatic token validation on app startup
- ✅ Sign out functionality

### UI Updates
- ✅ Enhanced signup form with additional fields
- ✅ Form validation for required fields
- ✅ Error handling and user feedback
- ✅ Loading states during API calls
- ✅ Updated profile page to display new user information

### Security
- ✅ JWT token management
- ✅ Protected routes
- ✅ Automatic token refresh/validation
- ✅ Secure logout with token cleanup

## Backend Requirements

Your backend API should implement these endpoints and handle:

1. **User Registration** - Create new user accounts with profile information
2. **User Authentication** - Validate credentials and return JWT tokens
3. **Token Validation** - Verify JWT tokens for protected routes
4. **User Profile** - Return current user information
5. **Logout** - Invalidate tokens and clear sessions

## Testing

You can test the authentication flow with these sample credentials:

**Signup:**
- Email: johnorlandsudoy70@gmail.com
- Password: pPPassword123
- Username: adminuser
- Full Name: Test admin
- Phone: 09171234567

**Login:**
- Email: johnorlandsudoy70@gmail.com
- Password: pPPassword123

## Next Steps

1. Set up your backend API server
2. Configure the `VITE_API_BASE_URL` in your `.env` file
3. Test the authentication flow
4. Implement additional API endpoints for bus tracking, booking, and feedback features 