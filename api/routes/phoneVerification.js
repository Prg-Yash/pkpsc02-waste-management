import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateOTP, hashOTP, verifyOTP, isExpired, sendWhatsAppOTP } from '../lib/otp.js';

const router = express.Router();

/**
 * Middleware to authenticate user
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Try to get userId from header first
        let userId = req.get('x-user-id');

        // If not in header, try to get from body
        if (!userId && req.body) {
            userId = req.body.userId;
        }

        // Validate userId is present
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized: userId is required in header "x-user-id" or body'
            });
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // Validate user exists
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized: User not found'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in authentication:', error);
        return res.status(500).json({
            error: 'Internal server error during authentication'
        });
    }
};

/**
 * POST /api/phone/send-otp
 * Send OTP to user's phone via WhatsApp template
 */
router.post('/send-otp', authenticateUser, async (req, res) => {
    try {
        // Ensure user has phone number
        if (!req.user.phone) {
            return res.status(400).json({
                error: 'Please add a phone number to your profile first'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        console.log('🔐 Generated OTP for user:', req.user.id, '- OTP:', otp);

        // Hash OTP
        const otpHash = hashOTP(otp);

        // Calculate expiry time
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Delete any existing OTP for this user
        await prisma.phoneOTP.deleteMany({
            where: { userId: req.user.id }
        });

        // Create new OTP record
        await prisma.phoneOTP.create({
            data: {
                userId: req.user.id,
                otpHash,
                expiresAt
            }
        });

        console.log('💾 Stored OTP hash for user:', req.user.id, 'expires at:', expiresAt);

        // Send OTP via WhatsApp
        const result = await sendWhatsAppOTP(req.user.phone, otp);

        if (!result.success) {
            return res.status(500).json({
                error: result.error || 'Failed to send OTP via WhatsApp'
            });
        }

        res.json({
            success: true,
            message: 'OTP sent to WhatsApp template',
            expiresIn: `${expiryMinutes} minutes`
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/phone/verify-otp
 * Verify OTP and mark phone as verified
 */
router.post('/verify-otp', authenticateUser, async (req, res) => {
    try {
        const { otp } = req.body;

        // Validate OTP provided
        if (!otp) {
            return res.status(400).json({
                error: 'OTP is required'
            });
        }

        // Fetch OTP record
        const otpRecord = await prisma.phoneOTP.findFirst({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Validate OTP exists
        if (!otpRecord) {
            return res.status(400).json({
                error: 'No OTP found. Please request a new OTP.'
            });
        }

        // Check if expired
        if (isExpired(otpRecord.expiresAt)) {
            // Delete expired OTP
            await prisma.phoneOTP.delete({
                where: { id: otpRecord.id }
            });

            return res.status(400).json({
                error: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Verify OTP
        const isValid = verifyOTP(otp, otpRecord.otpHash);

        if (!isValid) {
            return res.status(400).json({
                error: 'Invalid OTP. Please check and try again.'
            });
        }

        // OTP is valid - update user and delete OTP
        await prisma.$transaction([
            prisma.user.update({
                where: { id: req.user.id },
                data: { phoneVerified: true }
            }),
            prisma.phoneOTP.delete({
                where: { id: otpRecord.id }
            })
        ]);

        console.log('✅ Phone verified for user:', req.user.id);

        res.json({
            success: true,
            message: 'Phone verified successfully'
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
