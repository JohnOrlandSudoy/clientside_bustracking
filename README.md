# 🚍 Bus Tracker - Premium Mobile Web App

A modern, responsive bus tracking system with real-time updates, seat booking, and user feedback features. Built with React, TypeScript, Tailwind CSS, and Supabase for a premium mobile-first experience.

## ✨ Features

- **Real-time Bus Tracking** - Live location and ETA updates
- **Seat Booking System** - Interactive seat selection and reservation
- **User Authentication** - Secure login/signup with Supabase
- **Feedback & Ratings** - Star ratings and comment system
- **Mobile-First Design** - Optimized for touch devices
- **Premium UI/UX** - Pinkish-white aesthetic with smooth animations

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