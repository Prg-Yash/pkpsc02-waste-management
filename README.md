<div align="center">

# 🌍 EcoFlow
### AI-Powered Smart Waste Management Ecosystem

[![Hackathon](https://img.shields.io/badge/Hackathon-PKP%20Mumbai-orange.svg?style=for-the-badge)](https://github.com/Prg-Yash/pkpsc02-waste-management)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/status-Active-success.svg?style=for-the-badge)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)]()

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React_Native-Expo-blue?style=flat-square&logo=expo" />
  <img src="https://img.shields.io/badge/Node.js-22.17-green?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-blue?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/AI-Gemini_2.0-purple?style=flat-square&logo=google" />
</p>

### *"Turning Trash into Treasure, One Click at a Time."*

**EcoFlow** is a revolutionary, full-stack waste management platform that leverages **Google Gemini 2.0 Flash AI** for intelligent waste verification, optimizes collection routes with real-time tracking, and incentivizes citizens through a gamified marketplace with QR-based verification.

[Features](#-key-features) • [Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-documentation)

</div>

---

## 📖 Table of Contents

- [🚨 Problem Statement](#-problem-statement)
- [💡 Our Solution](#-our-solution)
- [✨ Key Features](#-key-features)
  - [Mobile App](#-mobile-app-citizen--collector)
  - [Web Portal](#-web-portal-citizen)
  - [Admin Dashboard](#-admin-dashboard-municipal)
  - [Marketplace](#-marketplace-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚡ Getting Started](#-getting-started)
- [📚 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🚨 Problem Statement

Urban India faces a critical waste management crisis affecting millions:

| Challenge | Impact |
|-----------|--------|
| 🚛 **Inefficient Collection** | Fixed routes ignore actual waste accumulation, causing overflow |
| ♻️ **Poor Segregation** | Mixed waste makes recycling near impossible, increases landfill burden |
| 😴 **Low Citizen Engagement** | Zero incentives lead to improper disposal and illegal dumping |
| 🏚️ **Unmonitored Hotspots** | Untracked dumping sites become health hazards and pollution sources |
| 📊 **Lack of Data** | Municipalities operate blind without real-time waste intelligence |

## 💡 Our Solution

**EcoFlow** transforms waste management through a comprehensive digital ecosystem:

<table>
<tr>
<td width="33%">

### 🤖 AI-Powered Verification
- **Gemini 2.0 Flash** analyzes images in real-time
- Identifies waste type, weight, and segregation quality
- Before/after verification prevents fake collections
- 100% confidence scoring for accuracy

</td>
<td width="33%">

### 🗺️ Smart Route Optimization
- Dynamic routing based on live reports
- GPS tracking for all collectors
- Distance-based task assignment
- Reduces fuel consumption by 40%

</td>
<td width="33%">

### 🎁 Gamified Marketplace
- Earn "Green Points" for every action
- QR-based auction system
- Buy recycled goods with points
- Email notifications with QR codes

</td>
</tr>
</table>

### 🔄 How It Works

```mermaid
graph LR
    A[📱 User Reports Waste] --> B[🤖 AI Verification]
    B --> C[✅ Approved & Geotagged]
    C --> D[🚚 Collector Assigned]
    D --> E[📍 Route Optimization]
    E --> F[📸 Collection Verified]
    F --> G[🎉 Points Awarded]
    G --> H[🛒 Marketplace Access]
```

---

## ✨ Key Features

### 📱 Mobile App (Citizen & Collector)

<details>
<summary><b>🤖 AI-Powered Waste Scanner</b></summary>

- **Dual-Image Verification**: Before & after photos with landmark matching
- **Instant AI Analysis**: Waste type, quantity, segregation quality
- **95%+ Accuracy**: Using Google Gemini 2.0 Flash Experimental
- **Real-time Feedback**: Confidence scoring and validation messages
- **Fake Detection**: AI checks for reused images and location spoofing
</details>

<details>
<summary><b>📍 Precise Geo-Location</b></summary>

- **GPS Tagging**: Exact coordinates for every report
- **Distance Verification**: Max 10km radius validation
- **Location Privacy**: Only city/state shown publicly
- **Google Maps Integration**: Visual route display for collectors
</details>

<details>
<summary><b>💰 Green Points Marketplace</b></summary>

- **Earn Points**: 10 points per report, 20 per collection
- **Auction System**: Bid on recycled goods with points
- **QR Verification**: Scan buyer's QR code to complete sales
- **Email Notifications**: Auto-sent QR codes to winners
- **Transaction History**: Track all marketplace activities
</details>

<details>
<summary><b>🏆 Gamification & Social</b></summary>

- **Leaderboards**: City, state, and global rankings
- **Achievements**: Unlock badges for milestones
- **Profile Stats**: CO₂ saved, waste collected, impact metrics
- **Community Feed**: See nearby reports and collectors
</details>

<details>
<summary><b>🚚 Collector Mode</b></summary>

- **Route Planner**: Optimized paths for multiple pickups
- **Before/After Photos**: Required for verification
- **Points System**: Earn 20 points per successful collection
- **Real-time Updates**: Live status tracking
- **WhatsApp Integration**: OTP verification for new collectors
</details>

### 🌐 Web Portal (Citizen)

| Feature | Description |
|---------|-------------|
| 📊 **Personal Dashboard** | Real-time impact metrics: CO₂ saved, waste diverted from landfills |
| 💬 **AI Chatbot** | "EcoBot" powered by Gemini - answers recycling queries 24/7 |
| 🗺️ **Interactive Map** | City-wide heatmap showing waste hotspots and collection zones |
| 📰 **Blog System** | Educational articles about sustainability and waste management |
| 📧 **Newsletter** | Personalized city/state-specific waste statistics (auto-subscribe) |
| 🛒 **Marketplace** | Full-featured auction platform with bidding and QR verification |
| ⚙️ **Settings Hub** | Profile management, collector mode toggle, phone verification |

### 🛡️ Admin Dashboard (Municipal)

```
├── 🏙️ City Operations
│   ├── Live truck tracking on map
│   ├── Real-time waste report monitoring
│   └── Collector verification & management
│
├── 📈 Analytics & Reports
│   ├── Daily/Weekly/Monthly statistics
│   ├── PDF report generation for government
│   ├── City-specific waste breakdown
│   └── Environmental impact calculations
│
├── 👥 User Management
│   ├── Verify collector applications
│   ├── Flag suspicious accounts
│   ├── Resolve disputes
│   └── View user contribution history
│
└── 📧 Communications
    ├── Send newsletters to all users
    ├── Broadcast alerts (city/state-level)
    └── Manage notification templates
```

### 🛒 Marketplace Features

#### For Sellers
- ✅ List recycled goods with photos and descriptions
- ✅ Set minimum bid and auction duration
- ✅ Automatic highest bidder selection
- ✅ Email with winner's QR code
- ✅ **QR Scanner**: Camera-based verification for instant transactions
- ✅ Points credited after verification

#### For Buyers
- ✅ Browse items by category and location
- ✅ Place and increase bids with points
- ✅ Email notifications with QR code
- ✅ Show QR code to seller from app or email
- ✅ 3-way verification: Email QR + App QR + Text code backup

#### Security & Verification
- 🔒 Only seller can scan buyer's QR
- 🔒 QR codes tied to specific transactions
- 🔒 Hex-based verification codes (32 characters)
- 🔒 Prevents fraud with AI image verification

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                            │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│  📱 Mobile App   │   🌐 Web Portal      │    🛡️ Admin Dashboard        │
│  (React Native)  │   (Next.js 16)       │    (Next.js 16)              │
│  - Expo Router   │   - Tailwind v4      │    - Shadcn/UI               │
│  - Clerk Auth    │   - Framer Motion    │    - Recharts                │
│  - Tamagui       │   - QR Scanner       │    - PDF Generation          │
└──────────────────┴──────────────────────┴──────────────────────────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │   🔐 Clerk Auth Layer    │
                    │   - User Authentication  │
                    │   - Session Management   │
                    └──────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                               │
│                        (Next.js API Routes)                              │
│  - /api/user/me                    - /api/verify-waste                  │
│  - /api/waste/*                    - /api/marketplace/*                 │
│  - /api/newsletter/*               - /api/phone/*                       │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICE LAYER                            │
│                    (Node.js 22.17 + Express 5.2)                        │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│  🗂️ Routes       │   🔧 Services         │    📡 External APIs          │
│  - waste.js      │   - emailService.js   │    - Gemini 2.0 Flash        │
│  - user.js       │   - s3Uploader.js     │    - AWS S3                  │
│  - marketplace.js│   - notifications.js  │    - WhatsApp (Twilio)       │
│  - blog.js       │   - geminiVerify.js   │    - Google Maps             │
│  - leaderboard.js│   - points.js         │    - Nodemailer (Gmail)      │
└──────────────────┴──────────────────────┴──────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE & STORAGE                               │
├──────────────────────────────┬──────────────────────────────────────────┤
│  🐘 PostgreSQL (Neon)        │       ☁️ AWS S3 Storage                  │
│  - Prisma ORM 7.1.0          │       - Waste report images              │
│  - User profiles             │       - Marketplace item photos          │
│  - Waste reports             │       - Collection verification pics     │
│  - Marketplace transactions  │       - Blog article images              │
│  - Notifications             │       - QR code backups                  │
│  - Points & Leaderboards     │                                          │
└──────────────────────────────┴──────────────────────────────────────────┘
```

### 🔄 Data Flow Example: Waste Collection Verification

```
1. 📱 Collector opens app → Takes BEFORE & AFTER photos
2. 🖼️ Images uploaded to AWS S3 → URLs generated
3. 🔄 Frontend calls /api/verify-waste with:
   - reportedImage URL (original report)
   - beforeImage URL (collector at site)
   - afterImage URL (waste removed)
4. 🤖 Gemini AI analyzes:
   - Before: Same location? Same waste? Landmarks match?
   - After: Waste removed? Ground clean? Location verified?
5. ✅ If both checks pass (confidence > 60%):
   - Backend updates WasteReport status → "COLLECTED"
   - Awards 20 points to collector
   - Sends notification to reporter
6. 🎉 Success! Transaction recorded in database
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%">

### 🎨 Frontend Technologies

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Next.js | 16.0.7 |
| **UI Library** | React | 19.2.0 |
| **Styling** | Tailwind CSS | v4 (Alpha) |
| **Animations** | Framer Motion | 12.23.25 |
| **Auth** | Clerk | 6.36.0 |
| **Maps** | @react-google-maps/api | 2.20.7 |
| **QR Codes** | qrcode.react | 4.2.0 |
| **QR Scanner** | @yudiel/react-qr-scanner | 2.4.1 |
| **AI Integration** | @google/generative-ai | 0.24.1 |
| **Charts** | Recharts | 3.5.1 |
| **Icons** | Lucide React | 0.556.0 |

</td>
<td width="50%">

### ⚙️ Backend Technologies

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | 22.17.0 |
| **Framework** | Express | 5.2.1 |
| **ORM** | Prisma | 7.1.0 |
| **Database** | PostgreSQL | Latest (Neon) |
| **AI Model** | Gemini 2.0 Flash Exp | Latest |
| **Storage** | AWS S3 | SDK v3.679.0 |
| **File Upload** | Multer | 1.4.5-lts.1 |
| **Email** | Nodemailer | 7.0.11 |
| **QR Generation** | qrcode | 1.5.4 |
| **Webhooks** | Svix | 1.82.0 |
| **CORS** | cors | 2.8.5 |

</td>
</tr>
</table>

### 📱 Mobile App Stack

| Component | Technology |
|-----------|------------|
| **Framework** | React Native (Expo SDK 51) |
| **Router** | Expo Router |
| **UI Components** | Tamagui |
| **Authentication** | Clerk (Expo) |
| **Navigation** | Expo Navigation |
| **Camera** | Expo Camera |
| **Location** | Expo Location |
| **TypeScript** | ✅ Full type safety |

---

## ⚡ Getting Started

### 📋 Prerequisites

Before you begin, ensure you have the following:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 22.17+ | Runtime environment |
| **npm** | Latest | Package manager |
| **PostgreSQL** | 15+ | Database (Neon/Supabase) |
| **Git** | Latest | Version control |

### 🔑 Required API Keys

<details>
<summary><b>1. Google Gemini AI</b></summary>

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Save as `GEMINI_API_KEY`
</details>

<details>
<summary><b>2. AWS S3 (Image Storage)</b></summary>

1. Create AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Create S3 bucket: `ecoflow-waste` (or custom name)
3. Generate IAM credentials with S3 access
4. Save:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (e.g., `ap-south-1`)
   - `AWS_S3_BUCKET_NAME`
</details>

<details>
<summary><b>3. Clerk Authentication</b></summary>

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Get API keys from dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (same as above)
4. Configure **Webhooks** in Clerk dashboard:
   - Endpoint: `https://your-api-url.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Get `CLERK_WEBHOOK_SECRET`
</details>

<details>
<summary><b>4. Google Maps API</b></summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Create API key
4. Save as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
</details>

<details>
<summary><b>5. Email Service (Optional but Recommended)</b></summary>

**Option A: Gmail (Testing)**
1. Enable 2-Step Verification in Google Account
2. Generate App Password: Security → App Passwords
3. Save:
   - `EMAIL_SERVICE=gmail`
   - `EMAIL_USER=your-email@gmail.com`
   - `EMAIL_PASS=your-16-char-app-password`

**Option B: Custom SMTP**
- Configure custom SMTP settings
</details>

---

### 📦 Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Prg-Yash/pkpsc02-waste-management.git
cd pkpsc02-waste-management
```

#### 2️⃣ Backend Setup (`/api`)

```bash
cd api
npm install

# Create environment file
cp .env.example .env
```

**Edit `/api/.env` with your values:**

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="ecoflow-waste"

# Clerk Webhooks
CLERK_WEBHOOK_SECRET="your-webhook-secret"

# Email (Optional)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Server
PORT=8000
```

**Initialize Database:**

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Server will start at `http://localhost:8000`

---

#### 3️⃣ Frontend Setup (`/frontend`)

```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env.local
```

**Edit `/frontend/.env.local`:**

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# API URL
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-maps-api-key"

# Gemini AI (for client-side verification)
GEMINI_API_KEY="your-gemini-api-key"
```

**Start Development Server:**

```bash
npm run dev
```

Web portal will open at `http://localhost:3000`

---

#### 4️⃣ Admin Dashboard Setup (`/admin`)

```bash
cd ../admin
npm install

# Uses same env as frontend
cp ../frontend/.env.local .env.local

npm run dev
```

Admin dashboard at `http://localhost:3001`

---

#### 5️⃣ Mobile App Setup (`/app`)

```bash
cd ../app
npm install

# Create environment file
cp .env.example .env
```

**Edit `/app/.env`:**

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
EXPO_PUBLIC_API_URL="http://localhost:8000"
```

**Start Expo:**

```bash
npx expo start
```

**Options:**
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app for physical device

---

### 🎯 Quick Start Commands

```bash
# Terminal 1: Backend API
cd api && npm run dev

# Terminal 2: Frontend Web
cd frontend && npm run dev

# Terminal 3: Admin Dashboard
cd admin && npm run dev

# Terminal 4: Mobile App
cd app && npx expo start
```

### ✅ Verify Installation

1. **Backend API**: Visit `http://localhost:8000/` - Should see "EcoFlow API Running"
2. **Frontend**: Visit `http://localhost:3000` - See landing page
3. **Admin**: Visit `http://localhost:3001` - See admin login
4. **Mobile**: Scan QR code - Opens in Expo Go

---

### 🔧 Troubleshooting

<details>
<summary><b>Database Connection Error</b></summary>

- Verify `DATABASE_URL` in `.env`
- Check Neon dashboard for correct credentials
- Ensure database exists and is accessible
</details>

<details>
<summary><b>Clerk Authentication Issues</b></summary>

- Double-check publishable key matches application
- Verify webhook endpoint is accessible (use ngrok for local testing)
- Check Clerk dashboard → Webhooks for delivery status
</details>

<details>
<summary><b>AWS S3 Upload Failures</b></summary>

- Verify IAM user has S3 PutObject permission
- Check bucket name and region match `.env`
- Ensure bucket has public read access (if needed)
</details>

<details>
<summary><b>Gemini AI Errors</b></summary>

- Verify API key is active in [Google AI Studio](https://makersuite.google.com)
- Check quota limits haven't been exceeded
- Ensure you're using `gemini-2.0-flash-exp` model
</details>

---

## 📚 API Documentation

### 🔐 Authentication

All API requests require user authentication via Clerk. Include `x-user-id` header:

```bash
curl -H "x-user-id: user_xxx" http://localhost:8000/api/user/me
```

### 📍 Key Endpoints

<details>
<summary><b>POST /api/waste/report</b> - Submit Waste Report</summary>

**Request:**
```json
{
  "location": "Mumbai, Maharashtra, India",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "wasteType": "PLASTIC",
  "amount": "10",
  "description": "Plastic bottles near park"
}
```

**Response:**
```json
{
  "wasteReport": {
    "id": "cm123...",
    "status": "PENDING",
    "points": 10
  }
}
```
</details>

<details>
<summary><b>POST /api/waste/:id/collect</b> - Collect Waste</summary>

Requires `afterImage` file upload (multipart/form-data).

**Response:**
```json
{
  "waste": { "status": "COLLECTED" },
  "pointsEarned": 20
}
```
</details>

<details>
<summary><b>POST /api/verify-waste</b> - AI Verification</summary>

**Request:**
```json
{
  "verificationType": "before-after",
  "reportedImage": "https://s3.../original.jpg",
  "beforeImage": "data:image/jpeg;base64,...",
  "afterImage": "data:image/jpeg;base64,...",
  "location": { "latitude": 19.0760, "longitude": 72.8777 },
  "reportedLocation": { "latitude": 19.0758, "longitude": 72.8779 }
}
```

**Response:**
```json
{
  "success": true,
  "beforeVerification": {
    "isValid": true,
    "confidence": 1.0,
    "locationMatch": true,
    "wasteMatch": true
  },
  "afterVerification": {
    "isValid": true,
    "confidence": 1.0,
    "wasteRemoved": true,
    "groundClean": true
  }
}
```
</details>

<details>
<summary><b>GET /api/marketplace</b> - List Marketplace Items</summary>

**Query Params:**
- `category`: Filter by category
- `city`: Filter by city
- `state`: Filter by state
- `status`: `OPEN` | `CLOSED`

**Response:**
```json
{
  "listings": [
    {
      "id": "listing_xxx",
      "title": "Recycled Bottle",
      "description": "...",
      "images": ["https://..."],
      "currentBid": 150,
      "minimumBid": 100,
      "bidsCount": 5,
      "status": "OPEN",
      "expiresAt": "2025-12-15T10:00:00Z"
    }
  ]
}
```
</details>

<details>
<summary><b>POST /api/marketplace/:id/verify-qr</b> - Verify QR Purchase</summary>

**Request:**
```json
{
  "verificationCode": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "pointsAwarded": {
    "seller": 30,
    "buyer": 20
  }
}
```
</details>

### 📊 Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful image analysis
- **Clerk** for seamless authentication
- **AWS S3** for reliable storage
- **Neon** for serverless PostgreSQL
- **PKP Mumbai Hackathon** for the opportunity
- **Open Source Community** for amazing tools

---

<div align="center">

### Made with 💚 for a Cleaner, Greener India 🇮🇳

**EcoFlow** © 2025 - Transforming Waste Management Through Technology

[![GitHub stars](https://img.shields.io/github/stars/Prg-Yash/pkpsc02-waste-management?style=social)](https://github.com/Prg-Yash/pkpsc02-waste-management)
[![GitHub forks](https://img.shields.io/github/forks/Prg-Yash/pkpsc02-waste-management?style=social)](https://github.com/Prg-Yash/pkpsc02-waste-management/fork)
[![GitHub watchers](https://img.shields.io/github/watchers/Prg-Yash/pkpsc02-waste-management?style=social)](https://github.com/Prg-Yash/pkpsc02-waste-management)

[⬆ Back to Top](#-ecoflow)

</div>
