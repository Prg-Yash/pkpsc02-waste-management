# 🎯 Marketplace Production Features Setup Guide

## Overview

The marketplace now includes **production-ready** features for QR verification:

- 📧 **Email notifications** with QR code images sent to auction winners
- 📱 **Camera-based QR scanner** for sellers to verify pickups
- 🔒 **Security validation** ensuring only the correct seller can verify

---

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd api
npm install qrcode nodemailer
```

### 2. Configure Email Service

#### Option A: Gmail (Recommended for Testing)

1. Go to your Google Account settings
2. Navigate to **Security** → **2-Step Verification**
3. Scroll to **App passwords** → Click **Create**
4. Select **Mail** as the app and **Windows Computer** (or your platform)
5. Google will generate a 16-character password - **copy this**

#### Option B: Other Email Services

- **Outlook/Hotmail**: Use your regular password with `service: "outlook"`
- **Custom SMTP**: Configure custom SMTP settings

### 3. Update Environment Variables

Add to your `api/.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here

# Example for Gmail:
# EMAIL_SERVICE=gmail
# EMAIL_USER=yourname@gmail.com
# EMAIL_PASS=abcd efgh ijkl mnop  # 16-character App Password

# Example for Custom SMTP:
# EMAIL_SERVICE=smtp
# EMAIL_HOST=smtp.yourprovider.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@example.com
# EMAIL_PASS=your-password
```

### 4. Restart Backend Server

```bash
cd api
npm start
```

---

## 📱 Frontend Setup

### 1. Install Dependencies

```bash
cd app
npx expo install expo-camera expo-barcode-scanner
```

### 2. Update App Configuration (Already Done)

The `app.json` already includes the barcode scanner plugin:

```json
{
  "plugins": ["expo-barcode-scanner"]
}
```

### 3. Rebuild Expo App (Required for Native Modules)

```bash
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

**Note**: The camera features require a **development build** or physical device. Expo Go may have limitations.

---

## 🎯 How It Works

### For Auction Winners (Buyers):

1. **Place Bid** on an active auction
2. **Win the Auction** (highest bid when time expires or seller closes early)
3. **Receive Email** with:
   - Auction details (item, price, quantity)
   - Seller contact information (name, phone, email)
   - **QR Code image** (can be screenshot or shown on phone)
   - Pickup instructions
4. **Show QR Code** to seller during pickup

### For Sellers:

1. **Close Auction** (wait for timer or click "Close Auction Early")
2. **View Winner Contact** (phone, email shown in listing details)
3. **Arrange Pickup** with winner
4. **Scan QR Code** during pickup:
   - Click "Verify Winner's QR Code" button
   - Grant camera permission
   - Point camera at winner's QR code
   - Automatic verification on successful scan
5. **Earn Points** (+30 for seller, +20 for winner)

---

## 🔒 Security Features

### Seller ID Validation

- Only the **original listing seller** can verify the QR code
- Attempting to verify with wrong seller returns `403 Forbidden`
- Prevents fraud and unauthorized verifications

### Verification Code

- 32-character cryptographically secure random code
- Generated using `crypto.randomBytes(16).toString("hex")`
- Unique per auction, cannot be guessed

### Status Transitions

```
ACTIVE → (bid placed, time expires/manual close)
  ↓
ENDED → (QR code generated, email sent to winner)
  ↓
COMPLETED → (seller scans QR, points awarded)
```

---

## 📧 Email Template

Winners receive a professionally formatted email with:

### Header Section

- 🎉 Congratulations message
- Winning auction confirmation

### Auction Details

- Item type (wasteType)
- Winning bid amount
- Quantity and unit
- Pickup location

### Seller Contact

- Seller name
- Phone number (if available)
- Email address (if available)

### QR Code Section

- Large QR code image (400x400px)
- Verification code (as text backup)
- Pickup instructions

### Points Information

- Buyer reward: +20 EcoPoints
- Seller reward: +30 EcoPoints

---

## 📱 Camera Scanner UI

### Features:

- **Real-time camera preview** with barcode detection
- **Framed overlay** (250x250px) for QR positioning
- **Auto-verification** when QR code is detected
- **Visual feedback**:
  - White frame during scanning
  - Green frame + checkmark when scanned
  - "Verifying..." message
- **Permission handling**:
  - Automatic permission request
  - Friendly error messages
  - "Grant Permission" button
- **Controls**:
  - Cancel button (close scanner)
  - Scan Again button (retry after error)

---

## 🧪 Testing Guide

### Test Scenario: Complete Auction Flow

#### 1. Create Listing (Seller)

```
- Navigate to Marketplace tab
- Tap "Create Listing" (+ icon)
- Fill in details, upload images
- Set auction duration (e.g., 0.1 hours = 6 minutes for testing)
- Submit listing
```

#### 2. Place Bid (Buyer)

```
- Browse marketplace
- Tap on listing
- Click "Place Bid"
- Enter amount higher than minimum
- Submit bid
```

#### 3. Close Auction (Seller)

```
Option A: Wait for timer to expire (auto-closes)
Option B: Click "Close Auction Early" button
```

#### 4. Check Email (Winner)

```
- Open winner's email inbox
- Look for: "🎉 You Won! [Item] Auction - Pickup QR Code Inside"
- Verify email contains:
  ✓ QR code image
  ✓ Seller contact info
  ✓ Auction details
  ✓ Verification code (as text)
```

#### 5. Scan QR Code (Seller)

```
- Tap "Verify Winner's QR Code" button
- Grant camera permission (first time only)
- Point camera at winner's QR code (from email)
- Wait for auto-verification
- Check success message: "Transaction Complete! 🎉"
```

#### 6. Verify Points Awarded

```
Seller: Check profile - should show +30 points
Winner: Check profile - should show +20 points
Listing status: Should show "COMPLETED" with 🎉 badge
```

---

## ⚠️ Troubleshooting

### Email Not Received

**Problem**: Winner doesn't get email after auction ends

**Solutions**:

1. Check spam/junk folder
2. Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
3. For Gmail: Ensure you're using **App Password**, not regular password
4. Check backend console for email errors:
   ```
   📧 Email sent to winner: winner@example.com  ← Success
   Error sending email to winner: [error details] ← Failure
   ```

### Camera Not Working

**Problem**: Black screen or "Camera Permission Required"

**Solutions**:

1. **Expo Go**: Camera may not work - use development build:
   ```bash
   npx expo run:android  # or run:ios
   ```
2. **Permission Denied**: Go to device Settings → Apps → Your App → Permissions → Enable Camera
3. **iOS Simulator**: Camera doesn't work on simulator - use physical device
4. **Android Emulator**: Camera may not work - use physical device

### QR Code Not Scanning

**Problem**: Scanner doesn't detect QR code

**Solutions**:

1. Ensure good lighting
2. Hold phone steady, 6-12 inches from QR code
3. Make sure QR code is within the white frame
4. Try increasing screen brightness on device showing QR
5. If using printed QR: Ensure high quality print

### Wrong Seller Error

**Problem**: "Only the seller can verify the pickup" error

**Explanation**: This is **working as intended** - security feature

**Solution**: Ensure the person scanning is logged in as the listing's original seller

### Verification Already Complete

**Problem**: "This listing has already been verified" error

**Explanation**: Cannot verify same auction twice (prevents double points)

**Solution**: This is expected behavior - transaction already completed

---

## 🎨 Customization

### Modify Email Template

Edit `api/routes/marketplace.js`, function `finalizeAuction()`:

```javascript
const emailHtml = `
  <!-- Your custom HTML template here -->
  <h1>${listing.wasteType} Auction Won!</h1>
  <img src="${qrCodeDataUrl}" alt="QR Code" />
`;
```

### Adjust QR Code Size

In `finalizeAuction()`:

```javascript
qrCodeDataUrl = await QRCode.toDataURL(verificationCode, {
  width: 600, // Increase for larger QR code
  margin: 3, // Add more white space
});
```

### Change Scanner Frame Size

In `[id].tsx`, Camera overlay:

```javascript
<View style={{
  width: 300,  // Increase frame size
  height: 300,
  borderWidth: 4,  // Thicker border
  borderColor: "#3b82f6",  // Blue color
}}>
```

---

## 📊 Points System

| Event           | Seller Points | Winner Points |
| --------------- | ------------- | ------------- |
| Auction Created | 0             | -             |
| Auction Ended   | 0             | 0             |
| QR Verified     | **+30**       | **+20**       |

**Total Reward**: 50 points per completed transaction

---

## 🔗 API Endpoints

### POST `/api/marketplace/:id/close-bid`

Manually close auction before timer expires (seller only)

**Response**:

```json
{
  "message": "Auction closed successfully",
  "listing": {...},
  "winner": {
    "id": "user_123",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com"
  }
}
```

### POST `/api/marketplace/:id/verify-qr`

Verify QR code and complete transaction (seller only)

**Body**:

```json
{
  "verificationCode": "a1b2c3d4e5f6..."
}
```

**Response**:

```json
{
  "message": "Transaction verified successfully",
  "listing": {...},
  "pointsAwarded": {
    "seller": 30,
    "buyer": 20
  }
}
```

---

## 📝 Environment Variables Summary

### Required for Email Features:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Optional SMTP Configuration:

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
EMAIL_SECURE=false  # true for port 465, false for other ports
```

---

## ✅ Production Readiness Checklist

- [x] QR code generation (cryptographically secure)
- [x] Email delivery with embedded QR image
- [x] Camera-based QR scanner
- [x] Permission handling (camera)
- [x] Auto-verification on scan
- [x] Seller ID validation
- [x] Error handling (email failures, camera errors)
- [x] User feedback (loading states, success/error messages)
- [x] Professional email template
- [x] Points system integration
- [x] Contact information exchange
- [x] Status transition management

---

## 🚀 Deployment Notes

### Backend

1. Set `EMAIL_USER` and `EMAIL_PASS` in production environment
2. Consider using dedicated transactional email service:
   - **SendGrid** (99% deliverability)
   - **Mailgun** (developer-friendly)
   - **Amazon SES** (cost-effective)
3. Monitor email send failures with logging service

### Frontend

1. Build production APK/IPA with camera permissions
2. Test on multiple devices (different camera hardware)
3. Include camera permission rationale in App Store description
4. Consider adding QR code manual entry as fallback

---

## 🎉 Success Metrics

After implementation, you should see:

- ✅ **100% email delivery** to auction winners
- ✅ **<3 second scan time** for QR verification
- ✅ **0% unauthorized verifications** (security validation working)
- ✅ **Positive user feedback** on ease of pickup coordination

---

**Production Ready!** 🚀

Your marketplace now has professional-grade QR verification with email delivery and camera scanning!
