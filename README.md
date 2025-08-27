# 🚍 Bus Tracker - Premium Mobile Web App

A modern, responsive bus tracking system with real-time updates, seat booking, and user feedback features. Built with React, TypeScript, Tailwind CSS, and Supabase for a premium mobile-first experience.

## ✨ Features

- **Real-time Bus Tracking** - Live location and ETA updates
- **Seat Booking System** - Interactive seat selection and reservation
- **User Authentication** - Secure login/signup with Supabase
- **Feedback & Ratings** - Star ratings and comment system
- **Mobile-First Design** - Optimized for touch devices
- **Premium UI/UX** - Pinkish-white aesthetic with smooth animations

## 🎯 Core Features & How They Work

### 1. Authentication System
**Files**: `src/pages/AuthPage.tsx`, `src/hooks/useAuthAPI.ts`, `src/lib/api.ts`

**How it works**:
- **Client-only authentication** (no admin/driver roles)
- JWT token-based authentication with localStorage
- Automatic token expiration checking (validates JWT payload)
- Session refresh every 5 minutes to maintain active session
- Protected routes for authenticated features (booking, feedback, profile)
- Automatic redirect after successful authentication

**API Integration**:
- `POST /api/auth/signup` - Client registration with profile data
- `POST /api/auth/login` - Client login with email/password
- `GET /api/auth/me` - Validate current user session
- `POST /api/auth/logout` - Secure logout with token cleanup

**Security Features**:
- Password validation (uppercase, lowercase, numbers, 6+ characters)
- Token-based session management
- Automatic session timeout handling
- Protected route guards

### 2. Bus Tracking System
**Files**: `src/pages/TrackerPage.tsx`, `src/contexts/BusTrackingContext.tsx`, `src/components/tracker/`

**How it works**:
- **Real-time bus location tracking** using Google Maps API
- **ETA calculations** for bus arrivals with live updates
- **Route visualization** with start/end terminals and waypoints
- **User location integration** with browser geolocation API
- **Auto-refresh** every 30 seconds for live data updates
- **Mock data fallback** when API is unavailable

**Key Components**:
- `BusMap.tsx` - Google Maps integration with custom bus markers
- `BusSelector.tsx` - Dropdown to select specific buses with filtering
- `BusDetails.tsx` - Detailed bus information card with real-time data
- `RouteDetails.tsx` - Route information and terminal details
- `LoadingSpinner.tsx` - Loading states during data fetching

**Real-time Features**:
- Live bus position updates
- Estimated arrival times
- Seat availability tracking
- Route progress indicators

### 3. Notification System
**Files**: `src/contexts/NotificationContext.tsx`, `src/components/NotificationBell.tsx`

**How it works**:
- **Real-time notifications** with sound alerts and visual badges
- **Unread count badges** on navigation with animated indicators
- **Auto-refresh** every 30 seconds with throttling to prevent API spam
- **Smart caching** with local storage for offline viewing
- **Mark as read** functionality with optimistic UI updates

**Features**:
- Notification sound playback for new alerts
- Unread count display in bottom navigation
- Pull-to-refresh for manual updates
- Notification history with search/filter
- Batch operations (mark all as read)

### 4. Booking System
**Files**: `src/pages/BookingPage.tsx`, `src/lib/api.ts`

**How it works**:
- **Interactive seat selection** with real-time availability
- **Booking validation** to prevent double bookings
- **Booking confirmation** with email notifications (if implemented)
- **Booking history** with status tracking
- **Payment integration ready** structure

**Features**:
- Visual seat map with availability indicators
- Maximum seat selection limits
- Booking confirmation with QR codes
- Trip cancellation and modification
- Booking receipts and invoices

### 5. Feedback System
**Files**: `src/pages/FeedbackPage.tsx`

**How it works**:
- **5-star rating system** with descriptive labels
- **Comment submission** with character limits and validation
- **Feedback moderation** for inappropriate content
- **Analytics dashboard** for service improvement insights

**Rating Categories**:
- ⭐ Poor - Needs significant improvement
- ⭐⭐ Fair - Below expectations  
- ⭐⭐⭐ Good - Met expectations
- ⭐⭐⭐⭐ Very Good - Exceeded expectations
- ⭐⭐⭐⭐⭐ Excellent - Outstanding service

### 6. State Management Architecture
**Files**: `src/contexts/`, `src/hooks/`

**How it works**:
- **Context-based global state** for shared data
- **Custom hooks** for reusable logic and API calls
- **Optimistic UI updates** for better user experience
- **Error boundaries** for graceful error handling

**Context Providers**:
```typescript
<NotificationProvider>
  <BusTrackingProvider>
    <Router>
      <AppContent />
    </Router>
  </BusTrackingProvider>
</NotificationProvider>
```

## 🚀 Demo Flow - Step-by-Step Guide

### **Prerequisites Setup**
```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd clientSide
npm install

# 2. Set up environment variables
# Create .env file with:
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_BASE_URL=https://backendbus-sumt.onrender.com/api

# 3. Start development server
npm run dev
# Navigate to http://localhost:5173
```

### **Phase 1: Initial Experience (Unauthenticated User)**

#### **1. Homepage Landing** (`/`)
```
✅ Welcome message: "Welcome to Auro Ride"
✅ "Get Started" section prompting sign-in
✅ Quick action cards:
   - 🚍 Track Bus (available without auth)
   - 🎫 Book Trip (requires sign-in)
   - 💬 Send Feedback (requires sign-in)
   - 👤 View Profile (requires sign-in)
✅ Responsive design across all devices
```

#### **2. Bus Tracking Demo** (`/tracker`)
```
✅ Interactive Google Maps interface
✅ Mock bus locations (BUS001, BUS002) with live updates
✅ Real-time ETA updates every 30 seconds
✅ Bus selector dropdown with filtering
✅ User location integration (request permission)
✅ Route visualization between terminals
✅ Pull-to-refresh functionality
```

### **Phase 2: Authentication Process**

#### **3. Sign Up Process** (`/auth`)
```
✅ Click "Sign Up" or any protected feature
✅ Fill registration form:
   - 📧 Email: test0101yourdev@gmail.com
   - 🔒 Password: pPPassword123 (with validation)
   - 👤 Username: client user
   - 📝 Full Name: user client
   - 📱 Phone: 09171234567
✅ Password validation indicators:
   - ✓ At least 6 characters
   - ✓ One uppercase letter
   - ✓ One lowercase letter
   - ✓ One number
✅ Email confirmation message appears
✅ Automatic redirect to homepage after success
```

#### **4. Sign In Process**
```
✅ Use registered credentials
✅ Form validation and error handling
✅ Automatic redirect to homepage
✅ Token stored securely in localStorage
✅ User state updated throughout app
✅ Session persistence across browser refreshes
```

### **Phase 3: Authenticated Features**

#### **5. Enhanced Homepage** (After Login)
```
✅ Personalized welcome: "Hello, user client!"
✅ All quick actions now accessible
✅ Notification badge (shows unread count)
✅ User-specific content and recommendations
✅ Enhanced navigation with auth-protected routes
```

#### **6. Booking System** (`/booking`)
```
✅ Available buses list with real-time data
✅ Interactive seat selection interface
✅ Booking validation and confirmation
✅ Booking history with status tracking
✅ Trip details and management options
✅ Payment integration ready structure
```

#### **7. Feedback System** (`/feedback`)
```
✅ Rate previous trips (1-5 stars with descriptions)
✅ Text comment submission (500 char limit)
✅ Feedback history viewing
✅ Recent reviews from other users
✅ Feedback analytics and insights
```

#### **8. Notification Center** (`/notifications`)
```
✅ Real-time notification list with timestamps
✅ Mark individual notifications as read
✅ Mark all as read functionality
✅ Sound alerts for new notifications
✅ Notification preferences and settings
✅ Push notification support (if implemented)
```

#### **9. User Profile** (`/profile`)
```
✅ User information display and editing
✅ Trip statistics and analytics dashboard
✅ Recent booking history with details
✅ Account settings and preferences
✅ App information and version details
✅ Secure logout functionality
```

### **Phase 4: Advanced Features**

#### **10. Enhanced Bus Tracking** (After Login)
```
✅ Personalized tracking experience
✅ Favorite buses and routes
✅ Historical tracking data and analytics
✅ Custom notifications for specific buses
✅ Advanced filtering and search options
✅ Offline map support with cached data
```

#### **11. Logout Process**
```
✅ Click logout in bottom navigation
✅ Automatic cleanup of authentication state
✅ Clear local storage and session data
✅ Redirect to auth page
✅ All protected features become inaccessible
✅ Session timeout handling
```

### **Phase 5: Edge Cases & Error Handling**

#### **12. Network Failure Handling**
```
✅ Graceful error messages for API failures
✅ Offline mode with cached data
✅ Retry mechanisms for failed requests
✅ Loading states and skeleton screens
✅ Fallback to mock data when needed
```

#### **13. Browser Compatibility**
```
✅ Works on all modern browsers
✅ Mobile Safari and Chrome optimization
✅ Progressive Web App features
✅ Offline capability with service workers
✅ Touch-friendly interactions
```

## 🎨 Design System

### Color Palette
- **Primary Pink**: `#FADADD` - Soft pink for primary elements
- **Pure White**: `#FFFFFF` - Clean backgrounds and cards
- **Accent Gold**: `#FFD700` - Subtle highlights and ratings
- **Pink Gradients**: `from-pink-400 to-pink-300` - Hero sections and buttons

### Typography
- **Font Family**: Poppins (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Mobile Optimization
- Sticky bottom navigation for easy thumb access
- Touch-friendly buttons (minimum 44px height)
- Responsive breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)
- Fast loading with optimized images and animations

## 🔧 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📱 Pages and Features

### 1. Authentication System
**Route**: `/auth`

**Features**:
- Sign Up & Login UI with email/password
- Form validation and error handling
- Session persistence across browser refreshes
- Automatic redirect after successful authentication
- Toggle between login and signup modes

**Supabase Integration**:
- `auth.signUp(email, password)` - User registration
- `auth.signInWithPassword(email, password)` - User login
- `auth.signOut()` - User logout
- `auth.onAuthStateChange()` - Session monitoring

### 2. Home Page
**Route**: `/`

**Features**:
- Welcoming hero section with gradient background
- Quick action buttons for main features
- Available buses display with real-time data
- User greeting with personalized content
- Navigation cards to all major sections

**UI Components**:
- Hero banner with call-to-action
- Quick access grid (Track, Book, Review)
- Bus cards with ETA, capacity, and ratings
- Responsive layout for all screen sizes

### 3. Bus ETA Viewer & Tracker
**Route**: `/tracker` and `/tracker/:busId`

**API Endpoint**: `GET /api/client/bus-eta/:busId`

**Features**:
- Real-time bus location tracking
- Interactive route progress display
- Bus selection with route information
- Live ETA updates with refresh functionality
- Driver information and bus capacity
- Route stop status (completed, current, upcoming)

**Data Display**:
- Current location with map pin
- Next stop information
- Estimated arrival time
- Bus capacity and occupancy
- Route progress with visual indicators
- Interactive map placeholder for future enhancement

### 4. Booking System
**Route**: `/booking` (Protected Route)

**API Endpoint**: `POST /api/client/booking`

**Features**:
- Route selection with pricing
- Date picker for journey planning
- Interactive seat selection (max 4 seats)
- Real-time seat availability
- Booking summary with total cost
- Payment integration ready
- Booking confirmation with details

**Authentication Protection**:
- Redirects to `/auth` if user not logged in
- Requires valid Supabase session
- User-specific booking history

**Booking Flow**:
1. Select bus route
2. Choose travel date
3. Pick available seats
4. Review booking summary
5. Confirm and process payment
6. Display booking confirmation

### 5. Feedback & Ratings System
**Route**: `/feedback` (Protected Route)

**API Endpoint**: `POST /api/client/feedback`

**Features**:
- Bus route selection for feedback
- 5-star rating system with descriptions
- Optional comment field (500 character limit)
- Recent reviews display
- Feedback submission confirmation
- User feedback history

**Rating System**:
- 1 Star: Poor - Needs significant improvement
- 2 Stars: Fair - Below expectations
- 3 Stars: Good - Met expectations
- 4 Stars: Very Good - Exceeded expectations
- 5 Stars: Excellent - Outstanding service

### 6. User Profile
**Route**: `/profile` (Protected Route)

**Features**:
- User information display
- Trip statistics and analytics
- Recent booking history
- Account settings access
- Sign out functionality
- App information and version

**User Stats**:
- Total trips completed
- Total amount spent
- Average rating given
- Favorite bus route

## 🔐 Authentication & Security

### Supabase Configuration
```typescript
const supabaseUrl = 'https://ysxcngthzeajjrxwqgvq.supabase.co'
const supabaseAnonKey = 'your-anon-key-here'
```

### Protected Routes
- `/booking` - Requires authentication
- `/feedback` - Requires authentication  
- `/profile` - Requires authentication

### Session Management
- Automatic session restoration on app load
- Real-time auth state monitoring
- Secure token handling
- Automatic logout on token expiry

## 🌐 API Endpoints

### Authentication Endpoints (Supabase)
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout
- `GET /auth/user` - Get current user

### Bus Tracking Endpoints
- `GET /api/client/bus-eta/:busId` - Get real-time bus location and ETA
  - Headers: `Authorization: Bearer <supabase-token>`
  - Response: Bus location, next stop, ETA, capacity, driver info

### Booking Endpoints
- `POST /api/client/booking` - Create new seat reservation
  - Headers: `Authorization: Bearer <supabase-token>`
  - Body: `{ busId, seatNumbers, journeyDate, userId }`
  - Response: Booking confirmation with details

### Feedback Endpoints
- `POST /api/client/feedback` - Submit user feedback and rating
  - Headers: `Authorization: Bearer <supabase-token>`
  - Body: `{ busId, rating, comment, userId }`
  - Response: Feedback submission confirmation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bus-tracker-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://ysxcngthzeajjrxwqgvq.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to `http://localhost:5173`

### Build for Production
```bash
npm run build
npm run preview
```

## 📱 Mobile Features

### Bottom Navigation
- Sticky navigation bar at bottom of screen
- Touch-friendly icons and labels
- Active state indicators
- Smooth transitions between pages

### Touch Interactions
- Large tap targets (minimum 44px)
- Swipe gestures for seat selection
- Pull-to-refresh on tracker page
- Haptic feedback ready

### Performance Optimizations
- Lazy loading of components
- Image optimization
- Minimal bundle size
- Fast initial load times

## 🎯 User Experience

### Onboarding Flow
1. Landing on home page
2. Quick overview of features
3. Easy access to bus tracking
4. Seamless authentication when needed
5. Guided booking process

### Accessibility
- WCAG 2.1 AA compliant
- Screen reader friendly
- Keyboard navigation support
- High contrast mode ready
- Focus indicators on all interactive elements

## 🔮 Future Enhancements

- **Real-time Notifications** - Push notifications for bus arrivals
- **Interactive Maps** - Google Maps integration for live tracking
- **Payment Gateway** - Stripe/PayPal integration for bookings
- **Offline Support** - PWA capabilities for offline access
- **Multi-language** - Internationalization support
- **Dark Mode** - Theme switching capability

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ for better public transportation**