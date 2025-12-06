# EcoFlow Waste Management API

Complete backend API for the EcoFlow waste management system built with Express.js, Prisma, PostgreSQL, Clerk authentication, and AWS S3 file storage.

## 🚀 Tech Stack

- **Framework**: Express.js with modular route handlers
- **Language**: JavaScript (ES Modules)
- **Database**: PostgreSQL
- **ORM**: Prisma with PostgreSQL adapter
- **Authentication**: Clerk (webhook-based user sync)
- **File Upload**: Multer (memory storage, 10MB limit)
- **Cloud Storage**: AWS S3 (@aws-sdk/client-s3)
- **API Style**: REST with Express Router pattern

## 📋 Features

- **Manual Authentication**: userId validation via header or body
- **Image Upload**: Multipart/form-data file uploads with AWS S3 storage
- **Waste Management**: Report creation and collection tracking with proof images
- **Collector System**: Role-based access with collector mode
- **Real-time Notifications**: Automated notifications for all actions
- **Location Tracking**: Supports both coordinates and text addresses
- **Waste Categorization**: 8 waste types (PLASTIC, METAL, ORGANIC, E_WASTE, etc.)
- **Status Management**: PENDING → COLLECTED workflow
- **Organized Storage**: S3 folder structure (waste-reports/, waste-collections/)
- **📧 Newsletter System**: Personalized email newsletters with city/state statistics, environmental impact, and AI insights
- **Email Integration**: SMTP support with Gmail (default) or custom server configuration

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account with webhook configured

### Installation

1. **Install dependencies**:

```bash
cd api
npm install
```

2. **Configure environment variables**:

Create `.env` file in the `api` folder:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecoflow"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxxx"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
S3_BUCKET_NAME="your-bucket-name"
S3_REGION="us-east-1"

# Email Configuration (Gmail by default)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
EMAIL_FROM="EcoFlow Newsletter <noreply@ecoflow.com>"

# Optional: Custom SMTP Server (leave empty to use Gmail)
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="your-smtp-username"
# SMTP_PASS="your-smtp-password"

# Environment
NODE_ENV="development"
```

> **📧 Email Setup Required**: To send newsletters, configure email settings. Use Gmail (recommended for testing) or custom SMTP server. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed instructions.

3. **Initialize database**:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Configure AWS S3**:

Create an S3 bucket and configure permissions:

```bash
# Create bucket
aws s3 mb s3://your-bucket-name --region us-east-1

# Set bucket policy for public read (objects only)
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket-name/*"
  }]
}'
```

**Create IAM User** with these permissions:

- `s3:PutObject` - Upload files
- `s3:GetObject` - Read files
- Attach to bucket: `your-bucket-name`

Add credentials to `.env` file.

5. **Start development server**:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Email Configuration (Newsletter System)

**Quick Setup with Gmail (Recommended for Testing):**

1. **Get Gmail App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Enable 2-Step Verification (if not already enabled)
   - Create App Password: Select "Mail" → "Other (Custom)" → "EcoFlow API"
   - Copy the 16-character password

2. **Update `.env` file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  # Your App Password
   EMAIL_FROM="EcoFlow Newsletter <noreply@ecoflow.com>"
   ```

3. **Verify Configuration**:
   ```bash
   curl http://localhost:3000/api/newsletter/verify-config
   ```

4. **Send Test Newsletter**:
   ```bash
   curl -X POST http://localhost:3000/api/newsletter/send-all
   ```

**Using Custom SMTP Server:**

For production or higher sending limits (SendGrid, AWS SES, Mailgun):

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

See [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed configuration options.

### Clerk Webhook Setup

1. Go to Clerk Dashboard → Webhooks
2. Create new webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

### Test Upload Interface

Open `test-upload.html` in your browser to test file uploads:

```bash
# Open in browser
start api/test-upload.html  # Windows
open api/test-upload.html   # Mac
xdg-open api/test-upload.html  # Linux
```

The test interface provides forms for:

- Reporting waste with image upload
- Collecting waste with collection proof image

## 📊 Database Schema

### Enums

**WasteStatus**:

- `PENDING` - Awaiting addition to a collector's route
- `IN_PROGRESS` - Added to a collector's route, ready for collection
- `COLLECTED` - Successfully collected

**NotificationType**:

- `WASTE_REPORTED` - New waste report created
- `WASTE_COLLECTED` - Waste has been collected
- `COLLECTOR_ENABLED` - User enabled collector mode

### Models

**User**

- `id` (String, PK) - Clerk user ID
- `email` (String, unique)
- `name` (String, optional)
- `phone` (String, optional)
- `enableCollector` (Boolean) - Collector mode flag
- `reporterPoints` (Int) - Points from reporting waste
- `collectorPoints` (Int) - Points from collecting waste
- `globalPoints` (Int) - Total points (reporterPoints + collectorPoints)
- Relations: reportedWastes, collectedWastes, notifications
- Index: [globalPoints, reporterPoints, collectorPoints] for leaderboard performance

**WasteReport**

- `id` (String, PK)
- `reporterId` (String, FK → User)
- `collectorId` (String, optional, FK → User) - Who actually collected the waste
- `routeCollectorId` (String, optional, FK → User) - Who added waste to their route (persists after collection)
- `imageUrl` (String) - S3 URL of waste image
- `collectorImageUrl` (String, optional) - S3 URL of collection proof
- `aiAnalysis` (JSON, optional) - AI-generated waste analysis containing:
  - `category`: "small" | "large"
  - `wasteType`: waste classification
  - `estimatedWeightKg`: estimated weight
  - `confidence`: AI confidence score
  - `notes`: AI-generated observations
  - Additional fields based on category (segregation, recyclability, overflow level, etc.)
- `locationRaw` (String) - Address or coordinates
- `isLocationLatLng` (Boolean)
- `latitude`, `longitude` (Float, optional)
- `city`, `state`, `country` (String, optional)
- `status` (WasteStatus enum)
- `reportedAt` (DateTime) - When waste was reported
- `collectedAt` (DateTime, optional) - When waste was collected
- `createdAt`, `updatedAt` (DateTime) - System timestamps

**Notification**

- `id` (String, PK)
- `userId` (String, FK → User)
- `type` (NotificationType enum)
- `title`, `body` (String)
- `data` (JSON, optional)
- `read` (Boolean)

## 🔐 Authentication

**IMPORTANT**: All API endpoints (except webhook) use manual authentication.

### How it works:

1. Frontend passes `userId` via:

   - Header: `x-user-id: user_xxxxx`
   - OR Body: `{ "userId": "user_xxxxx" }`

2. Backend validates:

   - User exists in Prisma database
   - Rejects with 401 if missing/invalid

3. **Never use** `getAuth()` from Clerk SDK in routes

### Webhook Only

The `/api/webhooks/clerk` endpoint is the ONLY place using Clerk authentication to sync users.

## � User Address Requirements

**IMPORTANT**: Users must set their address before performing location-based operations.

### Required Fields

Before users can:

- Report waste (`POST /api/waste/report`)
- Collect waste (`POST /api/waste/:id/collect`)
- Add waste to route planner (`POST /api/route-planner/add`)

They MUST have these fields set in their profile:

- `city` - User's city (e.g., "Pune")
- `state` - User's state/province (e.g., "Maharashtra")
- `country` - User's country (e.g., "India")

### Setting Address

Users update their address via:

```http
PATCH /api/user/me
Content-Type: application/json
x-user-id: user_xxxxx

{
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India"
}
```

### Validation Behavior

If any address field (`city`, `state`, or `country`) is missing or null when attempting restricted operations:

**Request**:

```bash
curl -X POST http://localhost:3000/api/waste/report \
  -H "x-user-id: user_without_address" \
  -F "image=@waste.jpg"
```

**Response** (400 Bad Request):

```json
{
  "error": "Please update your profile with city, state, and country before reporting or collecting waste."
}
```

**Note**: This validation applies to:

- `POST /api/waste/report` - Report new waste
- `POST /api/waste/:id/collect` - Collect waste
- `POST /api/route-planner/add` - Add waste to route planner

### Why Address is Required

1. **Location-Aware Operations**: Ensures all waste management activities are tied to specific geographic regions
2. **Route Optimization**: Helps collectors plan efficient routes within their operational area
3. **Data Analytics**: Enables regional waste management insights and reporting
4. **Accountability**: Links users to their home location for better service tracking

### Operations NOT Requiring Address

- ✅ `GET /api/user/me` - View profile
- ✅ `PATCH /api/user/me` - Update profile (including setting address)
- ✅ `GET /api/waste/report` - View waste reports
- ✅ `POST /api/route-planner/remove` - Remove waste from route
- ✅ `GET /api/route-planner` - View route
- ✅ All leaderboard endpoints
- ✅ All notification endpoints

## �📡 API Endpoints

### User Management

#### GET /api/user/all

Get all users with their statistics and details.

**Headers**:

```
x-user-id: user_xxxxx
```

**Response**:

```json
{
  "users": [
    {
      "id": "user_xxxxx",
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890",
      "phoneVerified": true,
      "reportCount": 15,
      "collectionCount": 8,
      "enableCollector": true,
      "address": {
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India"
      },
      "reporterPoints": 150,
      "collectorPoints": 160,
      "globalPoints": 310,
      "joinedAt": "2024-01-15T10:30:00.000Z",
      "status": "active"
    },
    {
      "id": "user_yyyyy",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1987654321",
      "phoneVerified": false,
      "reportCount": 5,
      "collectionCount": null,
      "enableCollector": false,
      "address": null,
      "reporterPoints": 50,
      "collectorPoints": null,
      "globalPoints": 50,
      "joinedAt": "2024-02-20T14:15:00.000Z",
      "status": "incomplete"
    }
  ],
  "total": 2
}
```

**Response Fields**:

- `reportCount` - Total number of waste reports created by user
- `collectionCount` - Total collections (null if enableCollector is false)
- `address` - User's address (null if enableCollector is false)
- `collectorPoints` - Points from collections (null if enableCollector is false)
- `status` - "active" if phone verified and address complete, otherwise "incomplete"

#### GET /api/user/me

Get current user profile with waste reports.

**Headers**:

```
x-user-id: user_xxxxx
```

**Response**:

```json
{
  "user": {
    "id": "user_xxxxx",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "enableCollector": false,
    "reportedWastes": [...],
    "collectedWastes": [...]
  }
}
```

#### PATCH /api/user/me

Update user profile.

**Headers**:

```
x-user-id: user_xxxxx
```

**Body** (all fields optional):

```json
{
  "name": "Jane Doe",
  "phone": "+1987654321",
  "enableCollector": true,
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India"
}
```

**Response**:

```json
{
  "user": {
    "id": "user_xxxxx",
    "name": "Jane Doe",
    "phone": "+1987654321",
    "enableCollector": true,
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    ...
  }
}
```

**Notes**:

- All fields are optional - update any combination
- Empty strings for address fields are treated as `null`
- Enabling collector triggers `COLLECTOR_ENABLED` notification
- **Address fields (city, state, country) are required before reporting/collecting waste**

---

### Waste Reports

#### POST /api/waste/report

Create new waste report with image upload.

**Content-Type**: `multipart/form-data`

**Headers**:

```
x-user-id: user_xxxxx
```

**Form Fields**:

- `image` (File, **required**) - Waste image file (max 10MB)
- `userId` (String, **required**) - Reporter user ID
- `location` (String, **required**) - Address or coordinates
- `aiAnalysis` (String, **required**) - JSON string containing AI analysis with required fields:
  - `category`: "small" | "large"
  - `wasteType`: waste classification (e.g., "plastic", "organic", "metal", "e-waste", "hazardous", "mixed")
  - `confidence`: number (0-1)
  - `estimatedWeightKg`: number
  - `notes`: string
  - Additional category-specific fields
- `isLocationLatLng` (Boolean, optional) - If true, location is coordinates
- `latitude` (Number, optional) - Latitude coordinate
- `longitude` (Number, optional) - Longitude coordinate
- `city` (String, optional) - City name
- `state` (String, optional) - State/province name
- `country` (String, optional) - Country name

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/waste/report \
  -H "x-user-id: user_xxxxx" \
  -F "image=@waste-photo.jpg" \
  -F "userId=user_xxxxx" \
  -F "location=123 Main St, Mumbai" \
  -F 'aiAnalysis={"category":"small","wasteType":"plastic","confidence":0.95,"estimatedWeightKg":5.5,"segregation":[{"label":"bottles","count":3}],"recyclabilityPercent":80,"contaminationLevel":"low","hazardous":false,"notes":"Clean plastic bottles, easy to recycle"}' \
  -F "city=Mumbai" \
  -F "state=Maharashtra" \
  -F "country=India"
```

**Response**:

```json
{
  "waste": {
    "id": "clxxx123",
    "reporterId": "user_xxxxx",
    "imageUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/waste-reports/clxxx123/1733475600000-waste-photo.jpg",
    "status": "PENDING",
    "aiAnalysis": {
      "category": "small",
      "wasteType": "plastic",
      "confidence": 0.95,
      "estimatedWeightKg": 5.5,
      "segregation": [{ "label": "bottles", "count": 3 }],
      "recyclabilityPercent": 80,
      "contaminationLevel": "low",
      "hazardous": false,
      "notes": "Clean plastic bottles, easy to recycle"
    },
    "locationRaw": "123 Main St, Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "reporter": {
      "id": "user_xxxxx",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reportedAt": "2025-12-06T10:30:00Z",
    "collectedAt": null,
    "createdAt": "2025-12-06T10:30:00Z",
    "updatedAt": "2025-12-06T10:30:00Z"
  }
}
```

**Storage Details**:

- Images are uploaded to S3: `waste-reports/{reportId}/{timestamp}-{filename}`
- File size limit: 10MB
- Supported formats: All image types (JPEG, PNG, HEIC, etc.)

#### GET /api/waste/report

List waste reports with filters.

**Query Parameters**:

- `status` (default: "PENDING") - Filter by status
- `city` - Filter by city
- `mine=true` - Only current user's reports (requires `x-user-id`)

**Examples**:

```
GET /api/waste/report?status=PENDING
GET /api/waste/report?city=Mumbai&status=PENDING
GET /api/waste/report?mine=true
```

**Response**:

```json
{
  "wastes": [
    {
      "id": "clxxx123",
      "reporter": { "id": "user_xxxxx", "name": "John" },
      "collector": null,
      "wasteType": "PLASTIC",
      "status": "PENDING",
      ...
    }
  ]
}
```

#### POST /api/waste/:id/collect

Collect a waste report with optional collection proof image (collector only).

**URL**: `/api/waste/clxxx123/collect`

**Content-Type**: `multipart/form-data`

**Headers**:

```
x-user-id: user_yyyyy
```

**Form Fields**:

- `userId` (String, **required**) - Collector user ID
- `collectorImage` (File, optional) - Collection proof image (max 10MB)
- `collectorLocation` (String, optional) - Collection location
- `isLocationLatLng` (Boolean, optional) - If true, location is coordinates
- `latitude` (Number, optional) - Latitude coordinate
- `longitude` (Number, optional) - Longitude coordinate

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/waste/clxxx123/collect \
  -H "x-user-id: user_yyyyy" \
  -F "userId=user_yyyyy" \
  -F "collectorImage=@collected-proof.jpg" \
  -F "collectorLocation=Collected from 123 Main St"
```

**Requirements**:

- User must have `enableCollector: true`
- Waste must be `PENDING`
- Collector cannot collect their own waste

**Response**:

```json
{
  "waste": {
    "id": "clxxx123",
    "status": "COLLECTED",
    "collectorId": "user_yyyyy",
    "collectorImageUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/waste-collections/clxxx123/1733475700000-collected-proof.jpg",
    "imageUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/waste-reports/clxxx123/1733475600000-waste-photo.jpg",
    "wasteType": "PLASTIC",
    "reporter": {
      "id": "user_xxxxx",
      "name": "John Doe"
    },
    "collector": {
      "id": "user_yyyyy",
      "name": "Jane Collector"
    },
    "reportedAt": "2025-12-06T10:30:00Z",
    "collectedAt": "2025-12-06T11:00:00Z",
    "createdAt": "2025-12-06T10:30:00Z",
    "updatedAt": "2025-12-06T11:00:00Z"
  }
}
```

**Storage Details**:

- Collection proof images stored at: `waste-collections/{wasteId}/{timestamp}-{filename}`
- Both reporter and collector receive notifications

**Error Responses**:

- `403` - Collector mode not enabled
- `404` - Waste not found
- `400` - Already collected

---

### Notifications

#### GET /api/notifications

Get user notifications.

**Headers**:

```
x-user-id: user_xxxxx
```

**Query Parameters**:

- `unreadOnly=true` - Only unread notifications

**Response**:

```json
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "WASTE_COLLECTED",
      "title": "Waste Collected",
      "body": "Your PLASTIC waste has been collected",
      "data": {
        "wasteReportId": "clxxx123",
        "collectorName": "Jane"
      },
      "read": false,
      "createdAt": "2025-12-06T11:00:00Z"
    }
  ]
}
```

#### PATCH /api/notifications/[id]/read

Mark notification as read.

**URL**: `/api/notifications/notif_123/read`

**Headers**:

```
x-user-id: user_xxxxx
```

**Response**:

```json
{
  "notification": {
    "id": "notif_123",
    "read": true,
    ...
  }
}
```

---

### Webhooks

#### POST /api/webhooks/clerk

Clerk webhook for user synchronization.

**This endpoint is managed by Clerk** - no manual calls needed.

**Events handled**:

- `user.created` - Creates user in database
- `user.updated` - Updates user info
- `user.deleted` - Removes user

**Headers** (set by Clerk):

```
svix-id: msg_xxxxx
svix-timestamp: 1234567890
svix-signature: v1,xxxxx
```

---

### Leaderboard

#### Overview

The leaderboard system tracks user contributions through a point-based reward system. Points are automatically awarded when users report or collect waste.

**Point System:**

- **Report Waste**: +10 points (added to `reporterPoints` and `globalPoints`)
- **Collect Waste**: +20 points (added to `collectorPoints` and `globalPoints`, only if `enableCollector === true`)

**Point Fields:**

- `reporterPoints` (Int) - Points earned from reporting waste
- `collectorPoints` (Int) - Points earned from collecting waste (shown as `null` when `enableCollector === false` AND `collectorPoints === 0`)
- `globalPoints` (Int) - Total points (`reporterPoints + collectorPoints`)

**Performance:**

- Database indexed on `[globalPoints, reporterPoints, collectorPoints]` for fast queries
- Supports millions of users with pagination
- Efficient rank calculation using Prisma aggregations

---

#### GET /api/leaderboard/reporters

Get reporters leaderboard ranked by reporter points.

**Headers/Query**:

```
x-user-id: user_xxxxx
OR
?userId=user_xxxxx
```

**Query Parameters**:

- `page` (default: 1) - Page number
- `pageSize` (default: 20, max: 50) - Items per page

**Ranking Logic**:

1. `reporterPoints` DESC
2. `globalPoints` DESC (tie-breaker)
3. `createdAt` ASC (final tie-breaker)

**Response**:

```json
{
  "leaderboard": [
    {
      "id": "user_abc",
      "name": "John Doe",
      "email": "john@example.com",
      "reporterPoints": 150,
      "rank": 1
    },
    {
      "id": "user_xyz",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "reporterPoints": 120,
      "rank": 2
    }
  ],
  "me": {
    "id": "user_current",
    "name": "Current User",
    "email": "current@example.com",
    "reporterPoints": 80,
    "rank": 15
  },
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalUsers": 100
  }
}
```

---

#### GET /api/leaderboard/collectors

Get collectors leaderboard ranked by collector points.

**Headers/Query**:

```
x-user-id: user_xxxxx
OR
?userId=user_xxxxx
```

**Query Parameters**:

- `page` (default: 1) - Page number
- `pageSize` (default: 20, max: 50) - Items per page

**Ranking Logic**:

1. `collectorPoints` DESC
2. `globalPoints` DESC (tie-breaker)
3. `createdAt` ASC (final tie-breaker)

**Special Handling**:

- `collectorPoints` is shown as `null` when user has `enableCollector === false` AND `collectorPoints === 0`
- This indicates the user has never enabled collector mode

**Response**:

```json
{
  "leaderboard": [
    {
      "id": "user_collector1",
      "name": "Top Collector",
      "email": "collector@example.com",
      "collectorPoints": 240,
      "rank": 1
    },
    {
      "id": "user_reporter_only",
      "name": "Reporter Only",
      "email": "reporter@example.com",
      "collectorPoints": null,
      "rank": 50
    }
  ],
  "me": {
    "id": "user_current",
    "name": "Current User",
    "email": "current@example.com",
    "collectorPoints": 160,
    "rank": 8
  },
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalUsers": 100
  }
}
```

---

#### GET /api/leaderboard/global

Get global leaderboard ranked by total points.

**Headers/Query**:

```
x-user-id: user_xxxxx
OR
?userId=user_xxxxx
```

**Query Parameters**:

- `page` (default: 1) - Page number
- `pageSize` (default: 20, max: 50) - Items per page

**Ranking Logic**:

1. `globalPoints` DESC
2. `reporterPoints` DESC (tie-breaker)
3. `collectorPoints` DESC (tie-breaker)
4. `createdAt` ASC (final tie-breaker)

**Response**:

```json
{
  "leaderboard": [
    {
      "id": "user_top",
      "name": "Top User",
      "email": "top@example.com",
      "globalPoints": 350,
      "reporterPoints": 150,
      "collectorPoints": 200,
      "rank": 1
    },
    {
      "id": "user_second",
      "name": "Second Place",
      "email": "second@example.com",
      "globalPoints": 280,
      "reporterPoints": 120,
      "collectorPoints": 160,
      "rank": 2
    }
  ],
  "me": {
    "id": "user_current",
    "name": "Current User",
    "email": "current@example.com",
    "globalPoints": 240,
    "reporterPoints": 80,
    "collectorPoints": 160,
    "rank": 5
  },
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalUsers": 100
  }
}
```

**cURL Examples**:

```bash
# Get reporters leaderboard
curl "http://localhost:3000/api/leaderboard/reporters?page=1&pageSize=20" \
  -H "x-user-id: user_xxxxx"

# Get collectors leaderboard
curl "http://localhost:3000/api/leaderboard/collectors?userId=user_xxxxx"

# Get global leaderboard
curl "http://localhost:3000/api/leaderboard/global" \
  -H "x-user-id: user_xxxxx"
```

---

### Route Planner System

#### Overview

The Route Planner allows collectors to organize their waste collection routes efficiently. Collectors can add pending waste reports to their route, turning them into "IN_PROGRESS" status, and then collect them sequentially.

**Status Workflow:**

```
PENDING → IN_PROGRESS → COLLECTED
```

**Key Concepts:**

- **PENDING**: Waste has been reported but not yet added to any collector's route
- **IN_PROGRESS**: Waste has been added to a collector's route and is ready for collection
- **COLLECTED**: Waste has been successfully collected
- **routeCollectorId**: Tracks which collector added the waste to their route (persists even after collection for analytics)

**Rules:**

1. Only collectors (`enableCollector === true`) can add waste to their route
2. Only PENDING waste can be added to a route
3. Adding waste to route: `PENDING → IN_PROGRESS` + sets `routeCollectorId`
4. Removing from route: `IN_PROGRESS → PENDING` + clears `routeCollectorId`
5. Collection requires waste to be IN_PROGRESS (must be in a route first)
6. After collection, `routeCollectorId` remains for historical tracking

---

#### POST /api/route-planner/add

Add a waste report to the collector's route.

**Headers**:

```
x-user-id: user_collector_xxxxx
```

**Body**:

```json
{
  "wasteId": "clxxx123"
}
```

**Requirements**:

- User must have `enableCollector === true`
- Waste must exist
- Waste status must be `PENDING`

**Response**:

```json
{
  "success": true,
  "message": "Waste added to route successfully",
  "waste": {
    "id": "clxxx123",
    "status": "IN_PROGRESS",
    "routeCollectorId": "user_collector_xxxxx",
    "routeCollector": {
      "id": "user_collector_xxxxx",
      "name": "John Collector",
      "email": "john@example.com"
    },
    "reporter": {
      "id": "user_reporter_xxxxx",
      "name": "Jane Reporter",
      "email": "jane@example.com"
    },
    "imageUrl": "https://bucket.s3.../waste-reports/clxxx123/image.jpg",
    "locationRaw": "123 Main St",
    "city": "Mumbai",
    "aiAnalysis": {
      "wasteType": "plastic",
      "category": "small"
    },
    "reportedAt": "2025-12-06T10:00:00Z"
  }
}
```

**Error Responses**:

- `400` - wasteId is required
- `403` - Collector mode not enabled
- `404` - Waste not found
- `400` - Waste is not PENDING (already in route or collected)

---

#### POST /api/route-planner/remove

Remove a waste report from the collector's route.

**Headers**:

```
x-user-id: user_collector_xxxxx
```

**Body**:

```json
{
  "wasteId": "clxxx123"
}
```

**Requirements**:

- Waste must exist
- Waste status must be `IN_PROGRESS`
- `routeCollectorId` must match current user (can only remove from own route)

**Response**:

```json
{
  "success": true,
  "message": "Waste removed from route successfully",
  "waste": {
    "id": "clxxx123",
    "status": "PENDING",
    "routeCollectorId": null,
    "routeCollector": null,
    "reporter": {
      "id": "user_reporter_xxxxx",
      "name": "Jane Reporter",
      "email": "jane@example.com"
    },
    "imageUrl": "https://bucket.s3.../waste-reports/clxxx123/image.jpg",
    "locationRaw": "123 Main St"
  }
}
```

**Error Responses**:

- `400` - wasteId is required
- `404` - Waste not found
- `400` - Waste is not IN_PROGRESS
- `403` - Can only remove from your own route

---

#### GET /api/route-planner

Get all waste reports in the collector's route.

**Headers/Query**:

```
x-user-id: user_collector_xxxxx
OR
?userId=user_collector_xxxxx
```

**Response**:

```json
{
  "success": true,
  "count": 5,
  "route": [
    {
      "id": "clxxx123",
      "status": "IN_PROGRESS",
      "routeCollectorId": "user_collector_xxxxx",
      "routeCollector": {
        "id": "user_collector_xxxxx",
        "name": "John Collector",
        "email": "john@example.com"
      },
      "reporter": {
        "id": "user_reporter_1",
        "name": "Alice",
        "email": "alice@example.com"
      },
      "imageUrl": "https://bucket.s3.../image1.jpg",
      "locationRaw": "123 Main St",
      "city": "Mumbai",
      "latitude": 19.076,
      "longitude": 72.8777,
      "aiAnalysis": {
        "wasteType": "plastic",
        "category": "small",
        "estimatedWeightKg": 2.5
      },
      "reportedAt": "2025-12-06T09:00:00Z",
      "createdAt": "2025-12-06T09:00:00Z"
    },
    {
      "id": "clxxx456",
      "status": "IN_PROGRESS",
      "routeCollectorId": "user_collector_xxxxx",
      "routeCollector": {
        "id": "user_collector_xxxxx",
        "name": "John Collector",
        "email": "john@example.com"
      },
      "reporter": {
        "id": "user_reporter_2",
        "name": "Bob",
        "email": "bob@example.com"
      },
      "imageUrl": "https://bucket.s3.../image2.jpg",
      "locationRaw": "456 Oak Ave",
      "city": "Mumbai",
      "aiAnalysis": {
        "wasteType": "metal",
        "category": "large"
      },
      "reportedAt": "2025-12-06T10:30:00Z",
      "createdAt": "2025-12-06T10:30:00Z"
    }
  ]
}
```

**Notes**:

- Results are sorted by `createdAt` ASC (first reported = first in route)
- Only returns waste with `routeCollectorId` matching the current user
- Empty route returns `count: 0, route: []`

---

#### Updated Collection Workflow

**POST /api/waste/:id/collect** now requires waste to be IN_PROGRESS:

**Before Route Planner**:

```
Report → PENDING → Collect (directly) → COLLECTED
```

**With Route Planner** (Required):

```
Report → PENDING → Add to Route → IN_PROGRESS → Collect → COLLECTED
```

**Key Changes**:

- Cannot collect PENDING waste anymore (must add to route first)
- `routeCollectorId` is preserved after collection for analytics
- Collection still awards +20 points to collector

**cURL Examples**:

```bash
# Add waste to route
curl -X POST http://localhost:3000/api/route-planner/add \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_collector_xxxxx" \
  -d '{"wasteId": "clxxx123"}'

# Get my route
curl http://localhost:3000/api/route-planner \
  -H "x-user-id: user_collector_xxxxx"

# Remove waste from route
curl -X POST http://localhost:3000/api/route-planner/remove \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_collector_xxxxx" \
  -d '{"wasteId": "clxxx123"}'

# Collect waste (must be IN_PROGRESS)
curl -X POST http://localhost:3000/api/waste/clxxx123/collect \
  -H "x-user-id: user_collector_xxxxx" \
  -F "userId=user_collector_xxxxx"
```

---

### Public Route Planner API (WhatsApp Integration)

#### Overview

Public endpoints for WhatsApp AI agent integration. These endpoints do not require authentication headers and use phone number-based validation instead.

**Use Cases:**

- WhatsApp bot commands ("Show Route Planner", "Remove {wasteId}")
- External integrations with phone verification
- Mobile apps with WhatsApp integration

**Security:**

- Requires `phoneVerified === true`
- Requires `whatsappMessagingEnabled === true`
- Validates user permissions before operations

---

#### GET /api/public/route-planner

Fetch route planner data by phone number.

**Query Parameters**:

```
phone: +91XXXXXXXXXX (or 918097296453)
```

**Example Request**:

```bash
curl "http://localhost:3000/api/public/route-planner?phone=918097296453"
```

**Response**:

```json
{
  "success": true,
  "user": {
    "id": "user_xxxxx",
    "name": "John Doe",
    "phone": "918097296453",
    "phoneVerified": true,
    "whatsappMessagingEnabled": true,
    "enableCollector": true,
    "address": "Pune, Maharashtra, India"
  },
  "routePlanner": [
    {
      "id": "clxxx123",
      "wasteType": "Plastic",
      "status": "IN_PROGRESS",
      "location": "123 Main Street, Pune",
      "latitude": 18.5204,
      "longitude": 73.8567,
      "imageUrl": "https://s3.../image.jpg",
      "reporter": {
        "id": "user_abc",
        "name": "Jane Smith"
      },
      "estimatedWeight": 5.2,
      "createdAt": "2025-12-07T10:00:00Z",
      "reportedAt": "2025-12-07T10:00:00Z"
    }
  ],
  "count": 1,
  "whatsappMessage": "*ROUTE PLANNER SUMMARY* (EcoFlow)\\n\\nHello John Doe!\\nYou currently have *1* waste location scheduled for pickup.\\n\\n========================================\\n\\n*#1* - Plastic Waste\\nWaste ID: clxxx123\\nStatus: IN_PROGRESS\\nReported By: Jane Smith\\nLocation: 123 Main Street, Pune\\nView on Map:\\nhttps://www.google.com/maps/dir/?api=1&destination=18.5204,73.8567\\n\\n========================================\\n*Need help?*\\n- Send 'Help' for all commands\\n- Send 'Remove {wasteId}' to remove from route\\nThank you for keeping our city clean!",
  "message": "Successfully retrieved 1 waste location from route planner"
}
```

**Error Responses**:

- `400` - Phone number is required
- `404` - User not found
- `403` - Phone not verified
- `403` - WhatsApp messaging not enabled
- `403` - Collector mode not enabled

**WhatsApp Message Format**:
The `whatsappMessage` field contains a pre-formatted message with:

- User greeting
- Waste count
- Individual waste details with **Waste ID** (for removal)
- Google Maps links
- Complete optimized route link
- Help instructions

---

#### POST /api/public/route-planner/remove

Remove waste from route planner using phone number + waste ID.

**Body**:

```json
{
  "phone": "+91XXXXXXXXXX",
  "wasteId": "clxxx123"
}
```

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/public/route-planner/remove \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "918097296453",
    "wasteId": "clxxx123"
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Waste removed from route planner successfully",
  "waste": {
    "id": "clxxx123",
    "wasteType": "Plastic",
    "status": "PENDING",
    "location": "123 Main Street, Pune",
    "reporter": {
      "id": "user_abc",
      "name": "Jane Smith"
    }
  }
}
```

**Requirements**:

- Phone number must be verified (`phoneVerified === true`)
- WhatsApp messaging must be enabled (`whatsappMessagingEnabled === true`)
- Waste must exist in database
- Waste must be in user's route (`routeCollectorId === user.id`)
- Waste status must be `IN_PROGRESS`

**Error Responses**:

- `400` - Phone number or waste ID is required
- `404` - User not found
- `403` - Phone not verified
- `403` - WhatsApp messaging not enabled
- `404` - Waste not found
- `403` - Waste not in your route
- `400` - Waste status is not IN_PROGRESS

**WhatsApp Command Flow**:

1. User sends: "Remove clxxx123"
2. WhatsApp AI extracts: phone (from sender) + wasteId (from message)
3. Calls: `POST /api/public/route-planner/remove`
4. Returns success/error message to user

**Operation Details**:

- Status: `IN_PROGRESS` → `PENDING`
- `routeCollectorId`: `user.id` → `null`
- Waste becomes available for other collectors
- No points deduction (removal is allowed)

---

## 🔧 Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message description"
}
```

**Status Codes**:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid userId)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📁 Project Structure

```
api/
├── lib/
│   ├── prisma.js           # Prisma client singleton
│   ├── authUser.js         # User authentication helper (deprecated)
│   ├── notifications.js    # Notification creation helper
│   ├── points.js           # Point system configuration
│   ├── s3.js               # AWS S3 client configuration
│   └── s3Uploader.js       # S3 upload functions
├── routes/
│   ├── user.js             # User routes (/api/user/*)
│   ├── waste.js            # Waste routes with file upload (/api/waste/*)
│   ├── notifications.js    # Notification routes (/api/notifications/*)
│   ├── leaderboard.js      # Leaderboard routes (/api/leaderboard/*)
│   ├── routePlanner.js     # Route planner routes (/api/route-planner/*)
│   └── webhooks.js         # Clerk webhook routes (/api/webhooks/*)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── generated/          # Generated Prisma client
├── .env                    # Environment variables (not committed)
├── .env.example            # Environment template
├── server.js               # Express server entry point
├── package.json            # Dependencies and scripts
├── test-upload.html        # HTML test interface for file uploads
├── README.md               # This file
├── S3_UPLOAD_DOCS.md       # Detailed S3 documentation
└── DEPLOYMENT.md           # Deployment instructions
```

---

## 🧪 Testing

### Test Upload Interface (Recommended)

Open `test-upload.html` in your browser for a visual testing interface:

```bash
# Windows
start api/test-upload.html

# Mac
open api/test-upload.html

# Linux
xdg-open api/test-upload.html
```

Features:

- ✅ Report waste with image upload
- ✅ Collect waste with proof image
- ✅ Real-time image preview
- ✅ Form validation
- ✅ API response display

### Manual Testing with cURL

**Create waste report with image**:

```bash
curl -X POST http://localhost:3000/api/waste/report \
  -H "x-user-id: user_xxxxx" \
  -F "userId=user_xxxxx" \
  -F "image=@waste-photo.jpg" \
  -F "location=123 Main St" \
  -F "wasteType=PLASTIC" \
  -F "city=Mumbai" \
  -F "estimatedAmountKg=5.5"
```

**Get user profile**:

```bash
curl http://localhost:3000/api/user/me \
  -H "x-user-id: user_xxxxx"
```

**List pending waste**:

```bash
curl "http://localhost:3000/api/waste/report?status=PENDING"
```

**List user's waste reports**:

```bash
curl "http://localhost:3000/api/waste/report?mine=true" \
  -H "x-user-id: user_xxxxx"
```

**Collect waste with proof image**:

```bash
curl -X POST http://localhost:3000/api/waste/clxxx123/collect \
  -H "x-user-id: user_yyyyy" \
  -F "userId=user_yyyyy" \
  -F "collectorImage=@proof.jpg"
```

**Get notifications**:

```bash
curl http://localhost:3000/api/notifications \
  -H "x-user-id: user_xxxxx"
```

**Mark notification as read**:

```bash
curl -X PATCH http://localhost:3000/api/notifications/notif_123/read \
  -H "x-user-id: user_xxxxx"
```

### Testing with Postman

1. Import collection from Postman
2. Set environment variables:
   - `baseUrl`: `http://localhost:3000`
   - `userId`: Your test user ID
3. Use "form-data" for file uploads with `image` or `collectorImage` keys

---

## 🚨 Common Issues

### Database Connection Error

**Issue**: Cannot connect to PostgreSQL  
**Solution**: Verify `DATABASE_URL` in `.env` and ensure PostgreSQL is running

### S3 Upload Fails

**Issue**: "S3 configuration missing" or upload errors  
**Solution**:

- Check all AWS credentials in `.env`
- Verify IAM user has `s3:PutObject` permission
- Ensure bucket exists and region matches
- Check bucket policy allows public read on objects

### Clerk Webhook Fails

**Issue**: 400 error or signature verification fails  
**Solution**:

- Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Ensure webhook route receives raw body (handled automatically)
- Verify svix headers are present

### User Not Found (401)

**Issue**: API returns 401 even with valid userId  
**Solution**: Ensure user was synced via Clerk webhook first

### File Upload Too Large

**Issue**: "File too large" error  
**Solution**:

- Max file size is 10MB
- Compress images before upload
- Adjust limit in `routes/waste.js` if needed

### Migration Errors

**Issue**: Prisma migration fails  
**Solution**: Reset database with `npx prisma migrate reset` (dev only!)

### CORS Errors

**Issue**: Browser blocks API requests  
**Solution**:

- Server already has CORS enabled for all origins
- Check if `x-user-id` header is allowed
- Verify API is running on correct port

---

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name description

# Reset database (dev only!)
npx prisma migrate reset

# Open Prisma Studio (DB GUI)
npx prisma studio

# Start dev server (with auto-reload)
npm run dev

# Start production server
npm start

# Test S3 configuration
node -e "import('./lib/s3.js').then(m => m.validateS3Config())"
```

---

## 🔒 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Validate** all user inputs and file uploads
3. **Check permissions** before sensitive operations (collector mode, ownership)
4. **Use HTTPS** in production
5. **Rate limit** API endpoints (especially file uploads)
6. **Sanitize** file names and user-generated content
7. **Keep dependencies** updated regularly
8. **Restrict S3 bucket** - Only allow public read on objects, not bucket listing
9. **Use IAM roles** in production instead of access keys
10. **Validate file types** - Only accept images
11. **Set file size limits** - Currently 10MB per file

---

### Newsletter System

#### Overview

The Newsletter System generates personalized waste management updates and sends them via email to subscribed users. Each newsletter includes city statistics, state overview, top collectors, environmental impact, personal stats, and AI-generated insights.

**Email Configuration:**
- **Default**: Gmail SMTP (requires App Password)
- **Custom**: Any SMTP server via environment variables
- **See**: [EMAIL_SETUP.md](EMAIL_SETUP.md) for detailed setup instructions

---

#### POST /api/newsletter/send-all

Send newsletters to all users who have enabled newsletter subscription.

**Authentication**: Not required (internal use or admin-triggered)

**Request**:
```bash
curl -X POST http://localhost:3000/api/newsletter/send-all
```

**Response**:
```json
{
  "message": "Newsletter sending completed",
  "sent": 150,
  "failed": 5,
  "total": 155,
  "details": [
    {
      "success": true,
      "email": "user@example.com",
      "messageId": "<abc123@gmail.com>"
    },
    {
      "success": false,
      "email": "invalid@example.com",
      "error": "Invalid recipient"
    }
  ]
}
```

**Requirements**:
- Email configuration must be set in `.env`
- Users must have `newsletterEnabled: true`
- Users must have valid `email`, `city`, and `state`

**Features**:
- Generates personalized newsletter for each user
- Includes 30-day city statistics
- Shows state-wide comparisons
- Lists top 5 collectors
- Calculates environmental impact
- Provides AI-generated insights
- Rate-limited (250ms delay between emails)
- HTML email with responsive design

---

#### GET /api/newsletter/verify-config

Verify email configuration is valid and ready to send.

**Request**:
```bash
curl http://localhost:3000/api/newsletter/verify-config
```

**Response** (Success):
```json
{
  "message": "Email configuration is valid",
  "status": "ready"
}
```

**Response** (Error):
```json
{
  "message": "Email configuration is invalid",
  "status": "error",
  "error": "Invalid login: 535-5.7.8 Username and Password not accepted"
}
```

---

#### GET /api/newsletter/generate/:userId

Generate newsletter data for a specific user without sending email.

**Headers**:
```
x-user-id: user_abc123
```

**Response**:
```json
{
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "cityReport": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "statistics": {
      "totalReports": 150,
      "collectionRate": 75,
      "totalWasteWeight": 450,
      "pendingReports": 38,
      "collectedReports": 112,
      "wasteByType": {
        "PLASTIC": 45,
        "ORGANIC": 30,
        "METAL": 15
      }
    },
    "topCollectors": [
      {
        "rank": 1,
        "id": "user_xyz",
        "name": "Jane Smith",
        "totalPoints": 1250,
        "collectionsLast30Days": 45
      }
    ],
    "environmentalImpact": {
      "totalWasteCollected": 2500,
      "co2EmissionsSaved": 1250,
      "treesEquivalent": 125,
      "landfillSpaceSaved": 2.5
    }
  },
  "stateReport": {
    "state": "Maharashtra",
    "statistics": {
      "totalCities": 12,
      "totalReports": 1800,
      "collectionRate": 68,
      "totalWasteWeight": 5400
    }
  },
  "personalStats": {
    "reportsSubmitted": 8,
    "collectionsCompleted": 15,
    "totalWeightCollected": 45
  },
  "insights": [
    {
      "type": "success",
      "message": "Great job! Your city has a collection rate above 70%."
    }
  ],
  "generatedAt": "2025-12-07T10:30:00.000Z"
}
```

**Requirements**:
- User must have `newsletterEnabled: true`
- User must have `city` and `state` in profile
- Returns 403 if newsletter disabled
- Returns 404 if user not found

---

#### GET /api/newsletter/preview/:userId

Quick preview of newsletter availability for a user.

**Headers**:
```
x-user-id: user_abc123
```

**Response**:
```json
{
  "available": true,
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "city": "Mumbai",
    "state": "Maharashtra",
    "newsletterEnabled": true
  },
  "reportCounts": {
    "city": 150,
    "state": 1800
  }
}
```

---

## 📚 Additional Documentation

- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Email configuration guide (Gmail & custom SMTP)
- **[NEWSLETTER_TEST.md](NEWSLETTER_TEST.md)** - Newsletter testing and usage guide
- **[S3_UPLOAD_DOCS.md](S3_UPLOAD_DOCS.md)** - Detailed AWS S3 setup and troubleshooting
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[test-upload.html](test-upload.html)** - Interactive testing interface

---

## 🌐 API Base URL

- **Development**: `http://localhost:3000`
- **Production**: Set via deployment platform

All endpoints are prefixed with `/api`

---

## 📄 License

MIT License - Feel free to use for personal and commercial projects.

---

## 🤝 Support

For issues or questions:

1. Check error logs in terminal console
2. Verify all environment variables are set correctly
3. Ensure database migrations are up to date
4. Test S3 credentials with AWS CLI
5. Use Prisma Studio to inspect database
6. Check [S3_UPLOAD_DOCS.md](S3_UPLOAD_DOCS.md) for S3-specific issues

---

## 📊 S3 Storage Structure

```
your-bucket-name/
├── waste-reports/
│   └── {reportId}/
│       └── {timestamp}-{filename}
├── waste-collections/
│   └── {wasteId}/
│       └── {timestamp}-{filename}
└── users/
    └── {userId}/
        └── {timestamp}-{filename}
```

---

### Recyclable Waste Marketplace

#### Overview

The Marketplace system enables users to buy and sell recyclable waste through an auction-based bidding platform. Sellers create listings with AI-analyzed waste, buyers place bids, and transactions are completed with QR code verification.

**Key Features:**

- Multi-image uploads (up to 5 images per listing)
- Auction-based bidding system with countdown timers
- Automatic auction finalization when time expires
- QR code verification for secure pickup
- Points rewards: 30 points (seller), 20 points (buyer)
- Real-time bid notifications
- Listing statuses: ACTIVE, ENDED, COMPLETED, CANCELLED

**Workflow:**

```
Create Listing → Bidding Period → Auction Ends → Winner Selected → QR Verification → Completed
```

---

#### POST /api/marketplace/create

Create a new marketplace listing for selling recyclable waste.

**Content-Type**: `multipart/form-data`

**Headers**:

```
x-user-id: user_xxxxx
```

**Form Fields**:

- `images` (Files, **required**) - 1-5 waste images (max 10MB each)
- `wasteType` (String, **required**) - Type of waste (Plastic, Metal, Glass, Organic, Electronic, Paper, Mixed)
- `weightKg` (Number, **required**) - Weight in kilograms
- `basePrice` (Number, **required**) - Starting price in rupees (minimum ₹10)
- `auctionDuration` (Number, **required**) - Duration in hours (0.5, 1, 6, 24, 72)
- `latitude` (Number, **required**) - Location latitude
- `longitude` (Number, **required**) - Location longitude
- `description` (String, optional) - Additional details about the waste
- `city` (String, optional) - City (defaults to user's city)
- `state` (String, optional) - State (defaults to user's state)

**Requirements**:

- User must have complete profile (city, state, country)
- At least 1 image required, maximum 5 images
- Base price must be ≥ ₹10
- Valid location coordinates required

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/marketplace/create \
  -H "x-user-id: user_xxxxx" \
  -F "images=@waste1.jpg" \
  -F "images=@waste2.jpg" \
  -F "wasteType=Plastic" \
  -F "weightKg=15.5" \
  -F "basePrice=150" \
  -F "auctionDuration=24" \
  -F "latitude=19.0760" \
  -F "longitude=72.8777" \
  -F "description=Clean plastic bottles and containers" \
  -F "city=Mumbai" \
  -F "state=Maharashtra"
```

**Response**:

```json
{
  "listing": {
    "id": "listing_abc123",
    "sellerId": "user_xxxxx",
    "wasteType": "Plastic",
    "weightKg": 15.5,
    "description": "Clean plastic bottles and containers",
    "basePrice": 150,
    "images": [
      "https://bucket.s3.../marketplace/user_xxxxx/1733475600000-waste1.jpg",
      "https://bucket.s3.../marketplace/user_xxxxx/1733475600001-waste2.jpg"
    ],
    "latitude": 19.076,
    "longitude": 72.8777,
    "city": "Mumbai",
    "state": "Maharashtra",
    "auctionDuration": 24,
    "auctionEndTime": "2025-12-08T10:00:00.000Z",
    "status": "ACTIVE",
    "highestBid": null,
    "verificationCode": null,
    "createdAt": "2025-12-07T10:00:00.000Z",
    "updatedAt": "2025-12-07T10:00:00.000Z"
  }
}
```

**Storage Details**:

- Images stored at: `marketplace/{userId}/{timestamp}-{filename}`
- All images are publicly accessible via S3 URLs

**Error Responses**:

- `400` - Missing required fields or validation errors
- `404` - User not found
- `400` - Incomplete user profile (missing city/state/country)

---

#### GET /api/marketplace/listings

Browse active marketplace listings with sorting and filtering.

**Headers/Query**:

```
x-user-id: user_xxxxx (optional)
```

**Query Parameters**:

- `status` (default: "ACTIVE") - Filter by status (ACTIVE, ENDED, COMPLETED, CANCELLED)
- `sortBy` (default: "endTime") - Sort order:
  - `endTime` - Ending soon first
  - `price` - Highest price first
  - `newest` - Most recent first

**Examples**:

```bash
# Get active listings ending soon
curl "http://localhost:3000/api/marketplace/listings?status=ACTIVE&sortBy=endTime" \
  -H "x-user-id: user_xxxxx"

# Get highest priced listings
curl "http://localhost:3000/api/marketplace/listings?sortBy=price"

# Get newest listings
curl "http://localhost:3000/api/marketplace/listings?sortBy=newest"
```

**Response**:

```json
{
  "listings": [
    {
      "id": "listing_abc123",
      "seller": {
        "id": "user_xxxxx",
        "name": "John Doe",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "wasteType": "Plastic",
      "weightKg": 15.5,
      "basePrice": 150,
      "highestBid": 200,
      "images": ["https://..."],
      "city": "Mumbai",
      "state": "Maharashtra",
      "auctionEndTime": "2025-12-08T10:00:00.000Z",
      "status": "ACTIVE",
      "timeRemaining": 1380,
      "isExpired": false,
      "isUserListing": false,
      "userHasBid": false,
      "_count": {
        "bids": 5
      },
      "createdAt": "2025-12-07T10:00:00.000Z"
    }
  ]
}
```

**Response Fields**:

- `timeRemaining` - Minutes until auction ends
- `isExpired` - Boolean indicating if auction has ended
- `isUserListing` - True if current user is the seller
- `userHasBid` - True if current user has placed a bid
- `_count.bids` - Total number of bids placed

---

#### GET /api/marketplace/my-listings

Get current user's listings (as seller and as winner).

**Headers**:

```
x-user-id: user_xxxxx
```

**Response**:

```json
{
  "sellerListings": [
    {
      "id": "listing_abc123",
      "wasteType": "Plastic",
      "status": "ACTIVE",
      "basePrice": 150,
      "highestBid": 200,
      "winner": null,
      "_count": {
        "bids": 5
      },
      "createdAt": "2025-12-07T10:00:00.000Z"
    },
    {
      "id": "listing_xyz789",
      "wasteType": "Metal",
      "status": "ENDED",
      "basePrice": 300,
      "highestBid": 450,
      "winner": {
        "id": "user_yyyyy",
        "name": "Jane Smith",
        "phone": "+919876543210"
      },
      "_count": {
        "bids": 12
      },
      "verificationCode": "A1B2C3",
      "createdAt": "2025-12-06T10:00:00.000Z"
    }
  ],
  "wonListings": [
    {
      "id": "listing_def456",
      "seller": {
        "id": "user_zzzzz",
        "name": "Bob Seller",
        "phone": "+918765432109",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "wasteType": "Glass",
      "status": "ENDED",
      "highestBid": 180,
      "verificationCode": "X9Y8Z7",
      "createdAt": "2025-12-05T10:00:00.000Z"
    }
  ]
}
```

**Notes**:

- `sellerListings` - All listings created by the user (any status)
- `wonListings` - Listings where user is the winner (ENDED or COMPLETED)
- `verificationCode` - Only visible to seller and winner after auction ends

---

#### GET /api/marketplace/:id

Get detailed information about a specific listing including bids.

**Headers**:

```
x-user-id: user_xxxxx (optional)
```

**Response**:

```json
{
  "listing": {
    "id": "listing_abc123",
    "seller": {
      "id": "user_xxxxx",
      "name": "John Doe",
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "winner": {
      "id": "user_yyyyy",
      "name": "Jane Smith"
    },
    "wasteType": "Plastic",
    "weightKg": 15.5,
    "description": "Clean plastic bottles",
    "basePrice": 150,
    "highestBid": 200,
    "images": ["https://..."],
    "latitude": 19.076,
    "longitude": 72.8777,
    "city": "Mumbai",
    "state": "Maharashtra",
    "auctionDuration": 24,
    "auctionEndTime": "2025-12-08T10:00:00.000Z",
    "status": "ACTIVE",
    "verificationCode": null,
    "completedAt": null,
    "verifiedAt": null,
    "bids": [
      {
        "id": "bid_123",
        "bidder": {
          "id": "user_yyyyy",
          "name": "Jane Smith"
        },
        "amount": 200,
        "createdAt": "2025-12-07T12:00:00.000Z"
      },
      {
        "id": "bid_124",
        "bidder": {
          "id": "user_zzzzz",
          "name": "Bob Buyer"
        },
        "amount": 180,
        "createdAt": "2025-12-07T11:30:00.000Z"
      }
    ],
    "timeRemaining": 1200,
    "isExpired": false,
    "isUserListing": false,
    "userHasBid": true,
    "createdAt": "2025-12-07T10:00:00.000Z",
    "updatedAt": "2025-12-07T12:00:00.000Z"
  }
}
```

**Auto-Finalization**:

- If auction time has expired and status is ACTIVE, automatically calls `finalizeAuction()`
- Finds winner (highest bidder), generates QR code, sends notifications
- Updates status to ENDED

**Response includes**:

- Full listing details with seller and winner info
- Top 10 bids sorted by amount (highest first)
- Time remaining in minutes
- User-specific flags (isUserListing, userHasBid)

---

#### POST /api/marketplace/:id/bid

Place a bid on an active listing.

**Headers**:

```
x-user-id: user_xxxxx
```

**Body**:

```json
{
  "amount": 250
}
```

**Requirements**:

- Listing must be ACTIVE
- Auction must not be expired
- Bidder cannot be the seller
- Bid amount must be ≥ basePrice
- Bid amount must be ≥ highestBid + ₹5 (minimum increment)

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/marketplace/listing_abc123/bid \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_xxxxx" \
  -d '{"amount": 250}'
```

**Response**:

```json
{
  "bid": {
    "id": "bid_125",
    "listingId": "listing_abc123",
    "bidderId": "user_xxxxx",
    "amount": 250,
    "createdAt": "2025-12-07T13:00:00.000Z"
  },
  "listing": {
    "id": "listing_abc123",
    "highestBid": 250,
    "status": "ACTIVE",
    "_count": {
      "bids": 6
    }
  }
}
```

**Notifications**:

- Seller receives: "New bid of ₹{amount} placed on your {wasteType} listing"
- Previous highest bidder receives: "You've been outbid on {wasteType} listing"
- All notifications sent with listing ID in data

**Error Responses**:

- `404` - Listing not found
- `400` - Auction has ended
- `403` - Cannot bid on own listing
- `400` - Bid amount too low

---

#### POST /api/marketplace/:id/verify-qr

Seller verifies QR code shown by winner to complete transaction.

**Headers**:

```
x-user-id: user_seller_xxxxx
```

**Body**:

```json
{
  "verificationCode": "A1B2C3"
}
```

**Requirements**:

- Only seller can verify
- Listing status must be ENDED
- Winner must exist
- Verification code must match

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/marketplace/listing_abc123/verify-qr \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_seller_xxxxx" \
  -d '{"verificationCode": "A1B2C3"}'
```

**Response**:

```json
{
  "success": true,
  "message": "Transaction completed successfully",
  "listing": {
    "id": "listing_abc123",
    "status": "COMPLETED",
    "completedAt": "2025-12-08T14:00:00.000Z",
    "verifiedAt": "2025-12-08T14:00:00.000Z"
  },
  "pointsAwarded": {
    "seller": 30,
    "buyer": 20
  }
}
```

**Actions Performed**:

1. Update listing status to COMPLETED
2. Set completedAt and verifiedAt timestamps
3. Award points:
   - Seller: +30 points (added to globalPoints)
   - Winner: +20 points (added to globalPoints)
4. Send notifications to both parties

**Notifications**:

- Seller: "Transaction completed! You earned 30 points"
- Buyer: "Pickup verified! You earned 20 points"

**Error Responses**:

- `404` - Listing not found
- `403` - Only seller can verify
- `400` - Listing not in ENDED status
- `400` - No winner for this listing
- `400` - Invalid verification code

---

#### POST /api/marketplace/:id/cancel

Cancel an active listing (seller only).

**Headers**:

```
x-user-id: user_seller_xxxxx
```

**Requirements**:

- Only seller can cancel
- Listing must be ACTIVE
- No bids must have been placed

**cURL Example**:

```bash
curl -X POST http://localhost:3000/api/marketplace/listing_abc123/cancel \
  -H "x-user-id: user_seller_xxxxx"
```

**Response**:

```json
{
  "success": true,
  "message": "Listing cancelled successfully",
  "listing": {
    "id": "listing_abc123",
    "status": "CANCELLED",
    "updatedAt": "2025-12-07T15:00:00.000Z"
  }
}
```

**Error Responses**:

- `404` - Listing not found
- `403` - Only seller can cancel
- `400` - Listing not in ACTIVE status
- `400` - Cannot cancel listing with bids

---

#### Database Schema

**MarketplaceListing Model**:

```prisma
model MarketplaceListing {
  id                String        @id @default(cuid())
  sellerId          String
  seller            User          @relation("UserListings", fields: [sellerId], references: [id])
  winnerId          String?
  winner            User?         @relation("WinnerListings", fields: [winnerId], references: [id])
  wasteType         String
  weightKg          Float
  description       String?
  basePrice         Float
  images            Json          // Array of S3 URLs
  latitude          Float
  longitude         Float
  city              String?
  state             String?
  auctionDuration   Int           // in hours
  auctionEndTime    DateTime
  status            ListingStatus @default(ACTIVE)
  highestBid        Float?
  verificationCode  String?       @unique
  completedAt       DateTime?
  verifiedAt        DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  bids              Bid[]

  @@index([status, auctionEndTime])
  @@index([sellerId])
  @@index([winnerId])
}

model Bid {
  id          String             @id @default(cuid())
  listingId   String
  listing     MarketplaceListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  bidderId    String
  bidder      User               @relation("UserBids", fields: [bidderId], references: [id])
  amount      Float
  createdAt   DateTime           @default(now())

  @@index([listingId, amount])
  @@index([bidderId])
}

enum ListingStatus {
  ACTIVE      // Auction is ongoing
  ENDED       // Auction ended, awaiting pickup
  COMPLETED   // Transaction completed and verified
  CANCELLED   // Cancelled by seller (no bids)
}
```

**User Model Updates**:

```prisma
model User {
  // ... existing fields ...
  listings     MarketplaceListing[] @relation("UserListings")
  bids         Bid[]                @relation("UserBids")
  wonListings  MarketplaceListing[] @relation("WinnerListings")
}
```

**NotificationType Updates**:

```prisma
enum NotificationType {
  // ... existing types ...
  BID_PLACED       // New bid on seller's listing
  AUCTION_WON      // User won an auction
  AUCTION_ENDED    // Auction ended notification
}
```

---

#### Points System

**Marketplace Rewards**:

- **Seller Completion**: +30 points (when QR verified)
- **Buyer Completion**: +20 points (when QR verified)
- Points added to user's `globalPoints` field

**Total Point Sources**:

- Report Waste: +10 points → `reporterPoints`
- Collect Waste: +20 points → `collectorPoints`
- Sell Waste: +30 points → `globalPoints`
- Buy Waste: +20 points → `globalPoints`

---

#### S3 Storage Structure

```
your-bucket-name/
├── marketplace/
│   └── {userId}/
│       └── {timestamp}-{filename}
```

All marketplace images are stored with public read access for easy display in the app.

---

**Built with ❤️ for sustainable waste management**
