# Email Configuration Guide

This guide explains how to configure email functionality for the EcoFlow newsletter system.

## 🚀 Quick Start (Gmail - Recommended)

### 1. Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**: https://myaccount.google.com/apppasswords
4. Create a new app password:
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → Enter "EcoFlow API"
   - Click **Generate**
   - Copy the 16-character password

### 2. Update .env File

Open `api/.env` and update these values:

```env
# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Your 16-character App Password
EMAIL_FROM="EcoFlow Newsletter <noreply@ecoflow.com>"
```

### 3. Test Email Configuration

```bash
# Start the API server
cd api
npm run dev

# Test email configuration
curl http://localhost:3000/api/newsletter/verify-config
```

If successful, you'll see:
```json
{
  "message": "Email configuration is valid",
  "status": "ready"
}
```

## 📧 Using Custom SMTP Server

If you want to use a different email provider (e.g., SendGrid, AWS SES, Mailgun), configure these environment variables:

### Option 1: SendGrid

```env
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM="EcoFlow Newsletter <noreply@yourdomain.com>"
```

### Option 2: AWS SES

```env
# AWS SES Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
EMAIL_FROM="EcoFlow Newsletter <noreply@yourdomain.com>"
```

### Option 3: Mailgun

```env
# Mailgun Configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASS=your-mailgun-password
EMAIL_FROM="EcoFlow Newsletter <noreply@yourdomain.com>"
```

### Option 4: Custom SMTP Server

```env
# Custom SMTP Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # true for 465, false for other ports
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM="EcoFlow Newsletter <noreply@yourdomain.com>"
```

## 📨 Newsletter API Endpoints

### 1. Send Bulk Newsletters

Send newsletters to all users who have enabled newsletter subscription:

```bash
POST http://localhost:3000/api/newsletter/send-all
```

**Response:**
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

### 2. Verify Email Configuration

Check if email settings are correctly configured:

```bash
GET http://localhost:3000/api/newsletter/verify-config
```

### 3. Generate Newsletter (Single User)

Generate newsletter data for a specific user:

```bash
GET http://localhost:3000/api/newsletter/generate/:userId
```

### 4. Preview Newsletter

Quick preview of newsletter availability:

```bash
GET http://localhost:3000/api/newsletter/preview/:userId
```

## 🔧 Configuration Priority

The system checks email configuration in this order:

1. **Custom SMTP Server** (if `SMTP_HOST` is set)
   - Uses: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

2. **Gmail (Default)** (if custom SMTP not configured)
   - Uses: `EMAIL_USER` or `GMAIL_USER`, `EMAIL_PASS` or `GMAIL_APP_PASSWORD`

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_USER` | Yes* | - | Gmail address or SMTP username |
| `EMAIL_PASS` | Yes* | - | Gmail App Password or SMTP password |
| `EMAIL_FROM` | No | `EMAIL_USER` | From address shown in emails |
| `SMTP_HOST` | No | - | Custom SMTP server hostname |
| `SMTP_PORT` | No | - | SMTP port (587, 465, or 25) |
| `SMTP_SECURE` | No | `false` | Use SSL/TLS (true for 465) |
| `SMTP_USER` | No | - | SMTP authentication username |
| `SMTP_PASS` | No | - | SMTP authentication password |

\* Required unless using custom SMTP server

## 🎯 Newsletter Features

The newsletter includes:

- **City Statistics**: 30-day waste reports, collection rates, waste by type
- **State Overview**: All cities in the state with comparisons
- **Top Collectors**: Leaderboard of top 5 collectors in the city
- **Environmental Impact**: CO₂ saved, trees equivalent, landfill space
- **Personal Stats**: User's reports and collections
- **AI Insights**: Performance analysis and achievements

## 🔒 Rate Limiting

The system includes built-in rate limiting:
- **250ms delay** between each email
- Prevents SMTP throttling
- Respects Gmail's sending limits (500 emails/day for free accounts)

For high-volume sending (1000+ users), consider:
- Using a professional email service (SendGrid, AWS SES)
- Implementing a queue system (Bull + Redis)
- Breaking into batches across multiple days

## 🚨 Troubleshooting

### Error: "Invalid login credentials"

**Gmail:**
- Verify you're using an App Password, not your regular password
- Ensure 2-Step Verification is enabled
- Check if the email and password are correct

**Custom SMTP:**
- Verify SMTP credentials are correct
- Check if SMTP_HOST and SMTP_PORT are correct
- Try SMTP_SECURE=true for port 465

### Error: "Connection timeout"

- Check your firewall/antivirus settings
- Verify SMTP port is not blocked
- Try using port 587 instead of 465

### Error: "Email not sent"

- Run `/api/newsletter/verify-config` to check configuration
- Check server logs for detailed error messages
- Verify recipient email addresses are valid

### Gmail Daily Limit Reached

Gmail free accounts have a 500 emails/day limit:
- Upgrade to Google Workspace (2000 emails/day)
- Use a professional email service
- Implement batch sending across multiple days

## 📚 Additional Resources

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Nodemailer Documentation](https://nodemailer.com/about/)

## 🔐 Security Best Practices

1. **Never commit .env files** to version control
2. Use **App Passwords** instead of regular passwords
3. Rotate email credentials regularly
4. Monitor for suspicious activity
5. Use **environment-specific** email accounts (dev/staging/prod)
6. Enable **2FA** on email accounts
7. Use **read-only** API keys when possible

## 📝 Example: Scheduling Weekly Newsletters

You can schedule newsletters using cron jobs:

```javascript
// Add to server.js or separate cron file
import cron from 'node-cron';

// Send newsletters every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  console.log('📧 Sending weekly newsletters...');
  
  try {
    const response = await fetch('http://localhost:3000/api/newsletter/send-all', {
      method: 'POST',
    });
    const result = await response.json();
    console.log('Newsletter results:', result);
  } catch (error) {
    console.error('Newsletter cron error:', error);
  }
});
```

Install node-cron: `npm install node-cron`

---

**Need help?** Check the API logs or contact the development team.
