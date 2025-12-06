# Waste Management App - Setup Guide

## Features Implemented

### Authentication (Clerk)

- ✅ Sign Up with email verification
- ✅ Sign In with proper error handling
- ✅ Auto-redirect to tabs after login/signup
- ✅ Sign Out functionality
- ✅ Protected routes (tabs only accessible when authenticated)

### Tab Navigation

The app includes 4 main tabs with icons:

1. **Home** (🏠) - Dashboard with stats and recent activity
2. **Report Waste** (➕) - Form to report waste locations
3. **Collect Waste** (📦) - View and collect reported waste
4. **Leaderboard** (🏆) - Rankings, achievements, and competition

## Setup Instructions

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Configure Clerk Authentication

1. Create a Clerk account at [https://clerk.com](https://clerk.com)
2. Create a new application in the Clerk Dashboard
3. Get your Publishable Key from the API Keys section
4. Create a `.env` file in the `app` folder:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

### 3. Configure Clerk Settings

In your Clerk Dashboard:

- Go to **Email, Phone, Username** settings
- Enable **Email** as an authentication method
- Enable **Email verification code** under Email settings
- (Optional) Customize email templates under **Emails**

### 4. Run the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## App Structure

```
app/
├── (auth)/              # Authentication screens
│   ├── sign-in.tsx     # Sign in page
│   ├── sign-up.tsx     # Sign up page with email verification
│   └── _layout.tsx     # Auth layout with redirect logic
├── (tabs)/             # Main app tabs (protected)
│   ├── index.tsx       # Home/Dashboard
│   ├── report-waste.tsx # Report waste form
│   ├── collect-waste.tsx # Collect waste list
│   ├── leaderboard.tsx  # Leaderboard & achievements
│   └── _layout.tsx     # Tab navigation setup
├── components/
│   └── SignOutButton.tsx # Styled sign out button
└── _layout.tsx         # Root layout with Clerk provider
```

## How It Works

1. **Unauthenticated Users**: Redirected to sign-in/sign-up screens
2. **Sign Up Flow**: Email → Password → Verification Code → Auto-login to tabs
3. **Sign In Flow**: Email → Password → Auto-redirect to tabs
4. **Authenticated Users**: Access to all 4 tabs with demo data
5. **Sign Out**: Returns user to sign-in screen

## UI Design

- **Color Scheme**:
  - Primary (Green): `#22c55e` - Used for authentication and home
  - Blue: `#3b82f6` - Collect Waste
  - Amber: `#f59e0b` - Leaderboard
- **Components**:
  - Rounded cards with shadows
  - Consistent spacing and typography
  - Interactive elements with proper feedback
  - Tab bar with icons and labels

## Demo Data Included

All pages include realistic demo data:

- Home: Stats, quick actions, recent activity
- Report Waste: Waste type selection, location input, photo upload placeholder
- Collect Waste: Nearby waste reports with points and distances
- Leaderboard: User rankings, points, and achievements

## Next Steps

To make this production-ready:

1. Integrate real location services (expo-location)
2. Connect to a backend API for waste reports
3. Add real-time updates with websockets
4. Implement actual photo upload (expo-image-picker)
5. Add push notifications for new reports
6. Integrate maps for waste locations
7. Add user profile customization
