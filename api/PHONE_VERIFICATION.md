# Phone Verification (WhatsApp Template OTP)

**IMPORTANT**: Users must verify their phone number before performing critical operations.

## Overview

EcoFlow uses WhatsApp Cloud API with pre-approved message templates to send OTP verification codes. This ensures secure, reliable phone number verification without spam concerns.

## System Architecture

- **OTP Generation**: 6-digit numeric codes
- **OTP Storage**: SHA256-hashed in database with expiry timestamp
- **Delivery**: WhatsApp Business API template messages
- **Expiry**: Configurable (default 5 minutes)
- **Security**: One OTP per user at a time, auto-deletion on verification

## Database Schema

**User Model Enhancement**:
```prisma
model User {
  phoneVerified Boolean @default(false)
  phoneOTPs     PhoneOTP[]
}
```

**PhoneOTP Model**:
```prisma
model PhoneOTP {
  id        String   @id @default(cuid())
  userId    String
  otpHash   String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

## WhatsApp Template Configuration

### Required Environment Variables

Add to `.env`:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_API_TOKEN="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_TEMPLATE_NAME="ecoflow_otp"
WHATSAPP_TEMPLATE_LANGUAGE="en_US"
WHATSAPP_BASE_URL="https://graph.facebook.com/v21.0"
OTP_EXPIRY_MINUTES=5
```

### Template Structure

Your approved WhatsApp template must have:

- **Name**: Matches `WHATSAPP_TEMPLATE_NAME` (e.g., "ecoflow_otp")
- **Language**: Matches `WHATSAPP_TEMPLATE_LANGUAGE` (e.g., "en_US")
- **Body**: Contains one variable placeholder for the OTP code

**Example Template Body**:
```
Your EcoFlow verification code is {{1}}. This code expires in 5 minutes. Do not share this code with anyone.
```

**API Request Format**:
```json
{
  "messaging_product": "whatsapp",
  "to": "+919876543210",
  "type": "template",
  "template": {
    "name": "ecoflow_otp",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "123456" }
        ]
      }
    ]
  }
}
```

## Phone Verification Workflow

### Step 1: User Updates Phone Number

When phone number changes via `PATCH /api/user/me`:
- `phoneVerified` automatically resets to `false`
- User must verify the new number before restricted operations

### Step 2: Request OTP

**Endpoint**: `POST /api/phone/send-otp`

**Headers**:
```
x-user-id: user_xxxxx
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP sent to WhatsApp template",
  "expiresIn": "5 minutes"
}
```

**Response** (Error - No Phone):
```json
{
  "error": "Please add a phone number to your profile first"
}
```

**Backend Process**:
1. Validate user has phone number
2. Generate 6-digit OTP
3. Hash OTP with SHA256
4. Delete any existing OTP for user
5. Store new OTP with expiry timestamp
6. Send OTP via WhatsApp template
7. Return success/failure

### Step 3: Verify OTP

**Endpoint**: `POST /api/phone/verify-otp`

**Headers**:
```
x-user-id: user_xxxxx
```

**Body**:
```json
{
  "otp": "123456"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Phone verified successfully"
}
```

**Response** (Error - Invalid OTP):
```json
{
  "error": "Invalid OTP. Please check and try again."
}
```

**Response** (Error - Expired):
```json
{
  "error": "OTP has expired. Please request a new OTP."
}
```

**Response** (Error - No OTP):
```json
{
  "error": "No OTP found. Please request a new OTP."
}
```

**Backend Process**:
1. Fetch OTP record for user
2. Check if OTP exists
3. Check if OTP is expired (auto-delete if expired)
4. Verify OTP hash matches
5. Update `user.phoneVerified = true`
6. Delete OTP record
7. Return success

## Restricted Operations

The following operations **require both** address AND phone verification:

### POST /api/waste/report
- Report new waste
- Requires: `city`, `state`, `country`, `phoneVerified = true`

### POST /api/waste/:id/collect
- Collect existing waste
- Requires: `city`, `state`, `country`, `phoneVerified = true`, `enableCollector = true`

### POST /api/route-planner/add
- Add waste to route planner
- Requires: `city`, `state`, `country`, `phoneVerified = true`, `enableCollector = true`

**Validation Response** (400 Bad Request):
```json
{
  "error": "Please verify your phone number through WhatsApp before performing this action."
}
```

## Security Features

1. **OTP Hashing**: OTPs are SHA256-hashed before storage (never stored in plain text)
2. **Single OTP**: Only one active OTP per user (previous OTPs deleted on new request)
3. **Expiry**: OTPs expire after configurable time (default 5 minutes)
4. **Auto-Deletion**: Expired OTPs deleted on verification attempt
5. **Template-Based**: Uses pre-approved WhatsApp templates (no spam flags)
6. **Phone Reset**: Changing phone number resets verification status

## Error Handling

**WhatsApp API Errors**:
- Invalid phone number format
- Template not approved
- Insufficient WhatsApp API credits
- Network failures

All errors are logged server-side and returned as generic "Failed to send OTP" messages to prevent information disclosure.

## Development Notes

**Testing OTP Flow**:
```bash
# 1. Update phone number
curl -X PATCH http://localhost:3000/api/user/me \
  -H "x-user-id: user_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# 2. Send OTP
curl -X POST http://localhost:3000/api/phone/send-otp \
  -H "x-user-id: user_xxxxx"

# 3. Check server logs for OTP (development only)
# Server logs: "🔐 Generated OTP for user: user_xxxxx - OTP: 123456"

# 4. Verify OTP
curl -X POST http://localhost:3000/api/phone/verify-otp \
  -H "x-user-id: user_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'
```

**Production Considerations**:
- Remove OTP logging in production
- Monitor WhatsApp API quota and costs
- Set up alerting for failed OTP deliveries
- Consider rate limiting (max 3 OTP requests per hour per user)
- Implement CAPTCHA for OTP request endpoint

## API Endpoints Summary

### POST /api/phone/send-otp
Send OTP to user's WhatsApp

**Authentication**: Required (x-user-id header)  
**Body**: None  
**Returns**: Success message with expiry time

### POST /api/phone/verify-otp
Verify OTP and mark phone as verified

**Authentication**: Required (x-user-id header)  
**Body**: `{ "otp": "123456" }`  
**Returns**: Success message

### PATCH /api/user/me
Update user profile (with phone reset logic)

**Authentication**: Required (x-user-id header)  
**Body**: `{ "phone": "+919876543210", ... }`  
**Side Effect**: If phone changes, `phoneVerified` resets to `false`
