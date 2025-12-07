# 🌍 WasteMan: AI-Powered Smart Waste Management Ecosystem

[![Hackathon](https://img.shields.io/badge/Hackathon-PKP%20Mumbai-orange.svg)](https://github.com/Prg-Yash/pkpsc02-waste-management)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Active-success.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

> **"Turning Trash into Treasure, One Click at a Time."**

**WasteMan** is a revolutionary, full-stack waste management platform built for the **PKP Mumbai Hackathon**. It leverages **Google Gemini AI** to verify waste reports, optimizes collection routes for efficiency, and incentivizes citizens through a gamified marketplace.

---

## 📖 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Screenshots](#-screenshots)
- [Contributors](#-contributors)

---

## 🚨 Problem Statement

Urban areas face a massive waste management crisis:

- **Inefficient Collection:** Trucks follow fixed routes regardless of fill levels.
- **Lack of Segregation:** Mixed waste is hard to recycle.
- **Low Citizen Engagement:** No incentive for people to report or segregate waste.
- **Illegal Dumping:** Unmonitored spots turn into health hazards.

## 💡 Solution

**WasteMan** addresses these issues with a three-pronged approach:

1.  **AI Verification:** Users snap a photo; Gemini AI verifies if it's waste and categorizes it (Plastic, Organic, etc.).
2.  **Smart Logistics:** Collectors get optimized routes based on real-time reports.
3.  **Circular Economy:** Users earn points for reporting, which can be redeemed or used to trade recycled goods in the Marketplace.

---

## 🌟 Key Features

### 📱 Mobile App (Citizen & Collector)

- **🤖 AI Waste Scanner:** Instant identification and weight estimation using Gemini Vision Pro.
- **📍 Geo-Tagging:** Precise location tracking for every report.
- **💰 Marketplace:** Buy/Sell recycled products using earned "Green Points".
- **🏆 Leaderboard:** Compete with neighbors to be the "Greenest Citizen".
- **🚚 Collector Mode:** Special interface for drivers with route optimization.

### 🌐 Web Portal (Citizen)

- **📊 Personal Dashboard:** View your impact (CO2 saved, waste collected).
- **💬 AI Chatbot:** "EcoBot" answers questions about recycling rules.
- **🗺️ City Heatmap:** View high-waste zones in real-time.

### 🛡️ Admin Dashboard (Municipal)

- **🏙️ City-Wide Ops:** Monitor all trucks and reports live.
- **📈 Analytics:** Generate PDF reports for government compliance.
- **👥 User Management:** Verify collectors and handle disputes.

---

## 🏗️ System Architecture

1.  **User** takes a photo via **Expo Mobile App**.
2.  Image is uploaded to **AWS S3**.
3.  **Node.js API** sends image URL to **Google Gemini AI**.
4.  **Gemini** analyzes image and returns JSON (Type, Weight, Confidence).
5.  Data is stored in **PostgreSQL** via **Prisma**.
6.  **Webhooks** trigger notifications via **WhatsApp/Email**.
7.  **Admin Dashboard** updates in real-time.

---

## 🛠️ Tech Stack

| Component      | Technology                              |
| :------------- | :-------------------------------------- |
| **Mobile App** | React Native, Expo, Tamagui, Clerk Auth |
| **Frontend**   | Next.js 15, Tailwind CSS, Framer Motion |
| **Admin**      | Next.js, Shadcn/UI, Recharts            |
| **Backend**    | Node.js, Express, Prisma ORM            |
| **Database**   | PostgreSQL (Supabase/Neon)              |
| **AI Model**   | Google Gemini 1.5 Flash                 |
| **Storage**    | AWS S3                                  |
| **Maps**       | Google Maps API                         |

---

## ⚡ Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL Database
- Google Cloud Console Account (for Gemini & Maps)
- AWS Account (for S3)
- Clerk Account (for Auth)

### 📦 Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Prg-Yash/pkpsc02-waste-management.git
cd pkpsc02-waste-management
```

#### 2. Backend Setup (`/api`)

```bash
cd api
npm install
cp .env.example .env
# Fill in DATABASE_URL, GEMINI_API_KEY, AWS_KEYS
npx prisma migrate dev --name init
npm run dev
```

#### 3. Mobile App Setup (`/app`)

```bash
cd ../app
npm install
cp .env.example .env
# Fill in EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_API_URL
npx expo start
```

#### 4. Frontend Setup (`/frontend`)

```bash
cd ../frontend
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
npm run dev
```

#### 5. Admin Setup (`/admin`)

```bash
cd ../admin
npm install
npm run dev
```

---

## 📸 Screenshots

<div style="display: flex; justify-content: space-between;">
  <img src="https://via.placeholder.com/200x400?text=AI+Scanner" alt="Scanner" width="30%" />
  <img src="https://via.placeholder.com/200x400?text=Marketplace" alt="Marketplace" width="30%" />
  <img src="https://via.placeholder.com/200x400?text=Route+Map" alt="Map" width="30%" />
</div>

---

## 🏆 Achievements

- **Best UI/UX** (Nominated)
- **Most Innovative Use of AI** (Nominated)

---

## 🤝 Contributors

- **Yash** - Full Stack Developer

---

Made with ❤️ for a cleaner India. 🇮🇳
