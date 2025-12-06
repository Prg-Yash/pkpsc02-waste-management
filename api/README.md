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
- `PENDING` - Awaiting collection
- `COLLECTED` - Successfully collected

**WasteType**:
- `PLASTIC`, `METAL`, `ORGANIC`, `E_WASTE`, `PAPER`, `GLASS`, `MIXED`, `OTHER`

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
- Relations: reportedWastes, collectedWastes, notifications

**WasteReport**
- `id` (String, PK)
- `reporterId` (String, FK → User)
- `collectorId` (String, optional, FK → User)
- `imageUrl` (String) - S3 URL of waste image
- `collectorImageUrl` (String, optional) - S3 URL of collection proof
- `note` (String, optional)
- `wasteType` (WasteType enum)
- `estimatedAmountKg` (Float, optional)
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

## 📡 API Endpoints

### User Management

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

**Body**:
```json
{
  "name": "Jane Doe",
  "phone": "+1987654321",
  "enableCollector": true
}
```

**Response**:
```json
{
  "user": {
    "id": "user_xxxxx",
    "name": "Jane Doe",
    "enableCollector": true,
    ...
  }
}
```

**Note**: Enabling collector triggers `COLLECTOR_ENABLED` notification.

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
- `wasteType` (String, **required**) - One of: PLASTIC, METAL, ORGANIC, E_WASTE, PAPER, GLASS, MIXED, OTHER
- `isLocationLatLng` (Boolean, optional) - If true, location is coordinates
- `latitude` (Number, optional) - Latitude coordinate
- `longitude` (Number, optional) - Longitude coordinate
- `estimatedAmountKg` (Number, optional) - Estimated weight in kg
- `note` (String, optional) - Additional notes
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
  -F "wasteType=PLASTIC" \
  -F "estimatedAmountKg=5.5" \
  -F "city=Mumbai" \
  -F "state=Maharashtra" \
  -F "country=India" \
  -F "note=Large pile near entrance"
```

**Response**:
```json
{
  "waste": {
    "id": "clxxx123",
    "reporterId": "user_xxxxx",
    "imageUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/waste-reports/clxxx123/1733475600000-waste-photo.jpg",
    "wasteType": "PLASTIC",
    "status": "PENDING",
    "estimatedAmountKg": 5.5,
    "locationRaw": "123 Main St, Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "note": "Large pile near entrance",
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
│   ├── s3.js               # AWS S3 client configuration
│   └── s3Uploader.js       # S3 upload functions
├── routes/
│   ├── user.js             # User routes (/api/user/*)
│   ├── waste.js            # Waste routes with file upload (/api/waste/*)
│   ├── notifications.js    # Notification routes (/api/notifications/*)
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
