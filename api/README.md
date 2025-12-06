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

# Environment
NODE_ENV="development"
```

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
      "latitude": 19.0760,
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

## 📚 Additional Documentation

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

**Built with ❤️ for sustainable waste management**
