import express from "express";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

// Email transporter
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * POST /api/test/email-qr
 * Test endpoint to verify email and QR code functionality
 */
router.post("/email-qr", async (req, res) => {
  try {
    const { recipientEmail } = req.body;
    const testEmail = recipientEmail || process.env.EMAIL_USER;

    console.log("\n🧪 TEST ENDPOINT CALLED - Email & QR Code Test");
    console.log("================================================");

    // Step 1: Generate verification code
    const verificationCode = crypto.randomBytes(16).toString("hex");
    console.log("✅ Step 1: Verification code generated:", verificationCode);

    // Step 2: Generate QR code
    let qrCodeBuffer = null;
    try {
      qrCodeBuffer = await QRCode.toBuffer(verificationCode, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        type: "png",
      });
      console.log(
        `✅ Step 2: QR code generated (${qrCodeBuffer.length} bytes)`
      );
    } catch (qrError) {
      console.error("❌ Step 2 FAILED:", qrError);
      return res.status(500).json({
        success: false,
        step: "QR Generation",
        error: qrError.message,
      });
    }

    // Step 3: Check email config
    console.log("\n📧 Email Configuration:");
    console.log("   SERVICE:", process.env.EMAIL_SERVICE);
    console.log("   USER:", process.env.EMAIL_USER);
    console.log(
      "   PASS:",
      process.env.EMAIL_PASS
        ? "***" + process.env.EMAIL_PASS.slice(-4)
        : "NOT SET"
    );

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Step 3 FAILED: Email credentials not configured");
      return res.status(500).json({
        success: false,
        step: "Email Configuration",
        error: "EMAIL_USER or EMAIL_PASS not set in .env",
      });
    }
    console.log("✅ Step 3: Email credentials configured");

    // Step 4: Send test email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a; text-align: center;">🧪 TEST EMAIL - Marketplace QR System</h1>
        
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #15803d;">Test Auction Details</h2>
          <p><strong>Item:</strong> Test Plastic Waste</p>
          <p><strong>Winning Bid:</strong> ₹500</p>
          <p><strong>Quantity:</strong> 10 kg</p>
          <p><strong>Location:</strong> Test Location, Mumbai</p>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #1e40af;">Test Seller Information</h2>
          <p><strong>Name:</strong> Test Seller</p>
          <p><strong>Phone:</strong> +91 98765 43210</p>
          <p><strong>Email:</strong> seller@example.com</p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #d97706;">📱 Your QR Code for Pickup</h2>
          <p>This is a <strong>TEST QR CODE</strong>. In production, this will be scanned by the seller.</p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="cid:qrcode" alt="Verification QR Code" style="max-width: 300px; border: 2px solid #d97706; border-radius: 8px;" />
          </div>
          <p style="font-size: 12px; color: #92400e; text-align: center;">Verification Code: ${verificationCode}</p>
        </div>

        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #991b1b;">✅ Test Results</h3>
          <ul>
            <li>✅ QR Code Generation: Working</li>
            <li>✅ Email Template: Rendering Correctly</li>
            <li>✅ Image Embedding: Successful</li>
            <li>✅ Email Delivery: If you're reading this, it worked!</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">Test Email from Marketplace System</p>
          <p style="color: #6b7280; font-size: 12px;">Generated at: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    console.log(`\n📤 Sending test email to: ${testEmail}`);

    try {
      const info = await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: testEmail,
        subject: "🧪 TEST - Marketplace QR Code System Working!",
        html: emailHtml,
        attachments: [
          {
            filename: "qr-code.png",
            content: qrCodeBuffer,
            contentType: "image/png",
            cid: "qrcode",
          },
        ],
      });

      console.log("✅ Step 4: Email sent successfully!");
      console.log("   Message ID:", info.messageId);
      console.log("   Response:", info.response);
      console.log("\n✅ ALL TESTS PASSED!");
      console.log("================================================\n");

      res.json({
        success: true,
        message: "Test email sent successfully!",
        details: {
          verificationCode,
          recipientEmail: testEmail,
          messageId: info.messageId,
          qrCodeSize: qrCodeBuffer.length + " bytes",
        },
      });
    } catch (emailError) {
      console.error("❌ Step 4 FAILED:", emailError.message);
      console.error("   Full error:", emailError);
      console.log("================================================\n");

      res.status(500).json({
        success: false,
        step: "Email Sending",
        error: emailError.message,
        details: {
          code: emailError.code,
          command: emailError.command,
        },
      });
    }
  } catch (error) {
    console.error("❌ UNEXPECTED ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/test/email-config
 * Check email configuration status
 */
router.get("/email-config", (req, res) => {
  const config = {
    emailServiceConfigured: !!process.env.EMAIL_SERVICE,
    emailUserConfigured: !!process.env.EMAIL_USER,
    emailPassConfigured: !!process.env.EMAIL_PASS,
    emailService: process.env.EMAIL_SERVICE,
    emailUser: process.env.EMAIL_USER,
    emailPassHint: process.env.EMAIL_PASS
      ? "***" + process.env.EMAIL_PASS.slice(-4)
      : "NOT SET",
  };

  console.log("\n📧 Email Configuration Check:");
  console.log("   Service:", config.emailService || "NOT SET");
  console.log("   User:", config.emailUser || "NOT SET");
  console.log("   Pass:", config.emailPassHint);
  console.log(
    "   Status:",
    config.emailServiceConfigured &&
      config.emailUserConfigured &&
      config.emailPassConfigured
      ? "✅ READY"
      : "❌ INCOMPLETE"
  );

  res.json(config);
});

export default router;
