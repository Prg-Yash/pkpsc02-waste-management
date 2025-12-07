import nodemailer from "nodemailer";
import "dotenv/config";

/**
 * Email Service for sending newsletters and notifications
 * Supports Gmail by default or custom SMTP server via environment variables
 */

// Create reusable transporter
let transporter = null;

function createTransporter() {
  if (transporter) {
    return transporter;
  }

  // Check if custom SMTP settings are provided
  const useCustomSMTP = process.env.SMTP_HOST && process.env.SMTP_PORT;

  if (useCustomSMTP) {
    // Use custom SMTP server
    console.log("📧 Using custom SMTP server:", process.env.SMTP_HOST);

    // Validate credentials
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        "❌ Missing SMTP credentials. Please set SMTP_USER and SMTP_PASS in .env file"
      );
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use Gmail by default
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    // Validate credentials
    if (!emailUser || !emailPass) {
      throw new Error(
        "❌ Missing email credentials. Please set EMAIL_USER and EMAIL_PASS in .env file.\n" +
        "For Gmail, create an App Password at: https://myaccount.google.com/apppasswords"
      );
    }

    console.log("📧 Using Gmail SMTP server with user:", emailUser);
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  return transporter;
}

/**
 * Send newsletter email to a user
 */
export async function sendNewsletterEmail(userEmail, userName, newsletterData) {
  try {
    const transporter = createTransporter();

    // Generate HTML email content
    const htmlContent = generateNewsletterHTML(userName, newsletterData);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER || "EcoFlow <noreply@ecoflow.com>",
      to: userEmail,
      subject: `🌍 EcoFlow Newsletter - Waste Management Update for ${newsletterData.cityReport.city}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Newsletter sent to ${userEmail}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      email: userEmail,
    };
  } catch (error) {
    console.error(`❌ Failed to send newsletter to ${userEmail}:`, error);
    return {
      success: false,
      error: error.message,
      email: userEmail,
    };
  }
}

/**
 * Send newsletters to multiple users
 */
export async function sendBulkNewsletters(users, generateNewsletterForUser) {
  const results = {
    total: users.length,
    sent: 0,
    failed: 0,
    details: [],
  };

  for (const user of users) {
    try {
      // Generate newsletter data for this user
      const newsletterData = await generateNewsletterForUser(user.id);

      if (!newsletterData) {
        results.failed++;
        results.details.push({
          email: user.email,
          success: false,
          error: "Failed to generate newsletter data",
        });
        continue;
      }

      // Send email
      const result = await sendNewsletterEmail(user.email, user.name, newsletterData);

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }

      results.details.push(result);

      // Add delay to avoid rate limiting (250ms between emails)
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      results.failed++;
      results.details.push({
        email: user.email,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");
    return { success: true, message: "Email configuration verified" };
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML content for newsletter
 */
function generateNewsletterHTML(userName, newsletter) {
  const { cityReport, stateReport, personalStats, insights } = newsletter;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EcoFlow Newsletter</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .section { margin-bottom: 30px; }
    .section-title { color: #059669; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #10b981; padding-bottom: 5px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
    .stat-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
    .insight { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .table th { background: #f0fdf4; color: #059669; padding: 10px; text-align: left; font-size: 14px; }
    .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    @media only screen and (max-width: 600px) {
      .stat-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌍 EcoFlow Newsletter</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Waste Management Update for ${cityReport.city}</p>
    </div>

    <div class="content">
      <p>Hello <strong>${userName || "EcoFlow User"}</strong>,</p>
      <p>Here's your personalized waste management update for ${cityReport.city}, ${cityReport.state}.</p>

      <!-- City Statistics -->
      <div class="section">
        <div class="section-title">📊 ${cityReport.city} Statistics (Last 30 Days)</div>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-label">Total Reports</div>
            <div class="stat-value">${cityReport.statistics.totalReports}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Collection Rate</div>
            <div class="stat-value">${cityReport.statistics.collectionRate}%</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Waste Collected</div>
            <div class="stat-value">${cityReport.statistics.totalWasteWeight} kg</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Pending Reports</div>
            <div class="stat-value">${cityReport.statistics.pendingReports}</div>
          </div>
        </div>
      </div>

      <!-- Environmental Impact -->
      ${cityReport.environmentalImpact ? `
      <div class="section">
        <div class="section-title">🌱 Environmental Impact</div>
        <p>Your city has made a significant environmental difference:</p>
        <ul style="color: #059669;">
          <li><strong>${cityReport.environmentalImpact.totalWasteCollected} kg</strong> of waste collected (all-time)</li>
          <li><strong>${cityReport.environmentalImpact.co2EmissionsSaved} kg</strong> of CO₂ emissions saved</li>
          <li>Equivalent to <strong>${cityReport.environmentalImpact.treesEquivalent} trees</strong> planted</li>
          <li><strong>${cityReport.environmentalImpact.landfillSpaceSaved} m³</strong> of landfill space saved</li>
        </ul>
      </div>
      ` : ''}

      <!-- Top Collectors -->
      ${cityReport.topCollectors && cityReport.topCollectors.length > 0 ? `
      <div class="section">
        <div class="section-title">🏆 Top Collectors in ${cityReport.city}</div>
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Collector</th>
              <th>Collections</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            ${cityReport.topCollectors.map(collector => `
              <tr>
                <td><strong>#${collector.rank}</strong></td>
                <td>${collector.name}</td>
                <td>${collector.collectionsLast30Days}</td>
                <td><span class="badge badge-success">${collector.totalPoints}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- State Overview -->
      <div class="section">
        <div class="section-title">🗺️ ${stateReport.state} State Overview</div>
        <p><strong>${stateReport.statistics.totalCities} cities</strong> are actively managing waste in your state.</p>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-label">State Reports</div>
            <div class="stat-value">${stateReport.statistics.totalReports}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">State Collection Rate</div>
            <div class="stat-value">${stateReport.statistics.collectionRate}%</div>
          </div>
        </div>
      </div>

      <!-- Personal Stats -->
      ${personalStats ? `
      <div class="section">
        <div class="section-title">👤 Your Contribution (Last 30 Days)</div>
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-label">Reports Submitted</div>
            <div class="stat-value">${personalStats.reportsSubmitted}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Collections Completed</div>
            <div class="stat-value">${personalStats.collectionsCompleted}</div>
          </div>
        </div>
        ${personalStats.totalWeightCollected > 0 ? `
          <p style="color: #059669; font-weight: bold; margin-top: 15px;">
            🎉 You've collected <strong>${personalStats.totalWeightCollected} kg</strong> of waste!
          </p>
        ` : ''}
      </div>
      ` : ''}

      <!-- Insights -->
      ${insights && insights.length > 0 ? `
      <div class="section">
        <div class="section-title">💡 Insights & Achievements</div>
        ${insights.map(insight => `
          <div class="insight">
            ${insight.message}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 10px;">
        <p style="margin: 0; color: #059669; font-weight: bold;">Keep up the great work! 🌟</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Together, we're making our environment cleaner and greener.</p>
      </div>
    </div>

    <div class="footer">
      <p>This newsletter was generated on ${new Date(newsletter.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</p>
      <p>You're receiving this because you've subscribed to EcoFlow newsletters.</p>
      <p style="margin-top: 15px;">
        <a href="#" style="color: #059669; text-decoration: none;">Manage Preferences</a> | 
        <a href="#" style="color: #059669; text-decoration: none;">Unsubscribe</a>
      </p>
      <p style="margin-top: 15px; color: #999;">© 2025 EcoFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export default {
  sendNewsletterEmail,
  sendBulkNewsletters,
  verifyEmailConfig,
};
