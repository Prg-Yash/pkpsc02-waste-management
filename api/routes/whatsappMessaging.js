import express from 'express';
import { prisma } from '../lib/prisma.js';

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
 * Send WhatsApp template message
 * @param {string} phoneNumber - Phone number (will be formatted with +)
 * @param {string} templateName - WhatsApp template name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendWhatsAppTemplate(phoneNumber, templateName) {
    try {
        const {
            WHATSAPP_API_TOKEN,
            WHATSAPP_PHONE_NUMBER_ID,
            WHATSAPP_TEMPLATE_LANGUAGE,
            WHATSAPP_BASE_URL
        } = process.env;

        // Validate environment variables
        if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
            throw new Error('WhatsApp API credentials not configured');
        }

        // Ensure phone number has + prefix
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        const url = `${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const requestBody = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
                }
            }
        };

        console.log('📱 Sending WhatsApp template to:', formattedPhone);
        console.log('📋 Template:', templateName);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('❌ WhatsApp API Error:', responseData);
            return {
                success: false,
                error: responseData.error?.message || 'Failed to send WhatsApp message'
            };
        }

        console.log('✅ WhatsApp message sent successfully:', responseData.messages?.[0]?.id);

        return { success: true };

    } catch (error) {
        console.error('❌ Error sending WhatsApp template:', error);
        return {
            success: false,
            error: error.message || 'Internal error sending WhatsApp message'
        };
    }
}

/**
 * POST /api/whatsapp/enable
 * Enable WhatsApp messaging for user and send confirmation
 */
router.post('/enable', authenticateUser, async (req, res) => {
    try {
        // Validate user has phone number
        if (!req.user.phone) {
            return res.status(400).json({
                error: 'Please add a phone number to your profile first'
            });
        }

        // Validate phone is verified
        if (!req.user.phoneVerified) {
            return res.status(400).json({
                error: 'Please verify your phone number before enabling WhatsApp messaging'
            });
        }

        // Validate address fields are set (same requirement as waste operations)
        if (!req.user.city || !req.user.state || !req.user.country) {
            return res.status(400).json({
                error: 'Please update your profile with city, state, and country before enabling WhatsApp messaging'
            });
        }

        // Check if already enabled
        if (req.user.whatsappMessagingEnabled) {
            return res.json({
                success: true,
                message: 'WhatsApp messaging is already enabled'
            });
        }

        // Update user to enable WhatsApp messaging
        await prisma.user.update({
            where: { id: req.user.id },
            data: { whatsappMessagingEnabled: true }
        });

        // Send WhatsApp confirmation template
        const templateName = process.env.WHATSAPP_TEMPLATE_ENABLE_MSG || 'enable_whatsapp_messaging_ecoflow';

        const result = await sendWhatsAppTemplate(req.user.phone, templateName);

        if (!result.success) {
            // Log error but don't fail the request since opt-in was successful
            console.error('⚠️ Failed to send WhatsApp confirmation, but opt-in was successful:', result.error);
        }

        console.log('✅ WhatsApp messaging enabled for user:', req.user.id);

        res.json({
            success: true,
            message: 'WhatsApp messaging enabled and confirmation sent'
        });

    } catch (error) {
        console.error('Error enabling WhatsApp messaging:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/whatsapp/disable
 * Disable WhatsApp messaging for user
 */
router.post('/disable', authenticateUser, async (req, res) => {
    try {
        // Update user to disable WhatsApp messaging
        await prisma.user.update({
            where: { id: req.user.id },
            data: { whatsappMessagingEnabled: false }
        });

        console.log('🔕 WhatsApp messaging disabled for user:', req.user.id);

        res.json({
            success: true,
            message: 'WhatsApp messaging disabled'
        });

    } catch (error) {
        console.error('Error disabling WhatsApp messaging:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/whatsapp/status
 * Check WhatsApp messaging status by phone number
 */
router.get('/status', async (req, res) => {
    try {
        const { phone } = req.query;

        // Validate phone parameter
        if (!phone) {
            return res.status(400).json({
                error: 'Phone number is required as query parameter'
            });
        }

        // Find user by phone number
        const user = await prisma.user.findFirst({
            where: { phone: phone.trim() },
            select: {
                id: true,
                phone: true,
                whatsappMessagingEnabled: true,
                phoneVerified: true
            }
        });

        // If user not found
        if (!user) {
            return res.status(404).json({
                error: 'User not found with this phone number'
            });
        }

        res.json({
            phone: user.phone,
            whatsappMessagingEnabled: user.whatsappMessagingEnabled,
            phoneVerified: user.phoneVerified
        });

    } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
