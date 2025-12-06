# Newsletter Email Testing Guide

## ✅ Server Status

The API server is running on `http://localhost:3000` with the newsletter endpoints ready.

## 🔧 Setup Instructions

### Step 1: Configure Email Settings

Open `api/.env` and update the email configuration:

**Option A: Gmail (Recommended for testing)**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="EcoFlow Newsletter <noreply@ecoflow.com>"
```

**Option B: Custom SMTP Server**
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM="EcoFlow Newsletter <noreply@example.com>"
```

### Step 2: Get Gmail App Password

1. Visit: https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification if not already enabled
3. Create new app password:
   - App: Mail
   - Device: Other (Custom name) → "EcoFlow API"
4. Copy the 16-character password (format: `abcd efgh ijkl mnop`)
5. Paste it as `EMAIL_PASS` in `.env`

## 🧪 Testing Endpoints

### 1. Verify Email Configuration

Test if your email settings are correct:

```bash
curl http://localhost:3000/api/newsletter/verify-config
```

**Expected Success Response:**
```json
{
  "message": "Email configuration is valid",
  "status": "ready"
}
```

**Expected Error Response:**
```json
{
  "message": "Email configuration is invalid",
  "status": "error",
  "error": "Invalid login: 535-5.7.8 Username and Password not accepted"
}
```

### 2. Send Test Newsletter to All Subscribed Users

```bash
curl -X POST http://localhost:3000/api/newsletter/send-all
```

**Expected Response:**
```json
{
  "message": "Newsletter sending completed",
  "sent": 5,
  "failed": 0,
  "total": 5,
  "details": [
    {
      "success": true,
      "messageId": "<abc123@gmail.com>",
      "email": "user1@example.com"
    },
    {
      "success": true,
      "messageId": "<def456@gmail.com>",
      "email": "user2@example.com"
    }
  ]
}
```

### 3. Test Newsletter Generation (Single User)

Replace `:userId` with an actual user ID from your database:

```bash
curl http://localhost:3000/api/newsletter/generate/user_abc123
```

### 4. Test Newsletter Preview

```bash
curl http://localhost:3000/api/newsletter/preview/user_abc123
```

## 🎯 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/newsletter/send-all` | Send newsletters to all subscribed users |
| GET | `/api/newsletter/verify-config` | Verify email configuration |
| GET | `/api/newsletter/generate/:userId` | Generate newsletter for specific user |
| GET | `/api/newsletter/preview/:userId` | Preview newsletter availability |

## 📊 What Gets Sent?

Each newsletter includes:

1. **City Statistics** (Last 30 Days)
   - Total reports submitted
   - Collection rate percentage
   - Total waste weight collected
   - Pending reports

2. **Environmental Impact**
   - CO₂ emissions saved
   - Trees equivalent
   - Landfill space saved

3. **Top Collectors**
   - Top 5 collectors in the city
   - Their collection counts and points

4. **State Overview**
   - All cities in the state
   - State-wide statistics

5. **Personal Stats**
   - User's reports submitted
   - User's collections completed
   - User's total waste collected

6. **AI-Generated Insights**
   - Performance comparisons
   - Achievement notifications
   - Improvement suggestions

## 🚀 Using from Frontend

Add a button to trigger newsletter sending (admin only):

```javascript
// In admin dashboard
const handleSendNewsletters = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/newsletter/send-all', {
      method: 'POST',
    });
    
    const result = await response.json();
    
    alert(`Newsletters sent!\n- Sent: ${result.sent}\n- Failed: ${result.failed}\n- Total: ${result.total}`);
  } catch (error) {
    console.error('Error sending newsletters:', error);
    alert('Failed to send newsletters');
  }
};

// Button
<button onClick={handleSendNewsletters}>
  📧 Send Newsletters to All Subscribers
</button>
```

## 🔒 User Subscription Control

Users can control their newsletter subscription from the profile page:

- **Enable/Disable**: Toggle in Settings → Newsletter Preferences
- **Status Badge**: Shows SUBSCRIBED or UNSUBSCRIBED
- **Benefits Listed**: City stats, state metrics, top collectors, insights

The API only sends newsletters to users with:
- `newsletterEnabled: true`
- Valid `email` address
- Valid `city` and `state` data

## 📈 Rate Limiting

The system includes automatic rate limiting:
- **250ms delay** between each email
- Prevents SMTP server throttling
- Respects provider limits

**Gmail Limits:**
- Free accounts: 500 emails/day
- Google Workspace: 2,000 emails/day

For high-volume sending (1000+ users), consider:
- SendGrid (40,000-100,000 emails/day)
- AWS SES (pay per email, no daily limit)
- Mailgun (similar to SendGrid)

## ⚠️ Troubleshooting

### "Invalid login credentials"
- ✅ Use App Password, not regular password
- ✅ Enable 2-Step Verification on Gmail
- ✅ Generate new App Password if needed

### "Connection timeout"
- ✅ Check firewall/antivirus settings
- ✅ Try port 587 instead of 465
- ✅ Verify SMTP_HOST is correct

### "No subscribed users found"
- ✅ Check users have `newsletterEnabled: true`
- ✅ Verify users have email addresses
- ✅ Ensure users have city/state data

### "Failed to generate newsletter data"
- ✅ Check database connectivity
- ✅ Verify user has city/state in profile
- ✅ Check API logs for detailed errors

## 📝 Console Logs

When running `/send-all`, you'll see detailed logs:

```
📧 Starting bulk newsletter send...
📋 Found 15 subscribed users
✅ Newsletter sent to user1@example.com: <abc123@gmail.com>
✅ Newsletter sent to user2@example.com: <def456@gmail.com>
❌ Failed to send newsletter to user3@example.com: Invalid recipient
✅ Bulk send complete: 14 sent, 1 failed
```

## 🎨 Email Preview

The newsletter is a beautifully designed HTML email with:
- Responsive design (mobile-friendly)
- Green gradient header
- Stat boxes with grid layout
- Tables for top collectors
- Insight cards with blue theme
- Footer with unsubscribe link

## 📅 Scheduling (Optional)

To send newsletters automatically:

```javascript
// Install: npm install node-cron
import cron from 'node-cron';

// Send every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  console.log('📧 Sending weekly newsletters...');
  // Call /api/newsletter/send-all
});
```

---

**Ready to test?**
1. Configure `.env` with email settings
2. Run: `curl http://localhost:3000/api/newsletter/verify-config`
3. If verified, run: `curl -X POST http://localhost:3000/api/newsletter/send-all`
4. Check your inbox! 📬
