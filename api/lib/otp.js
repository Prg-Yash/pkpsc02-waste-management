import crypto from 'crypto';

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP string
 */
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP using SHA256
 * @param {string} otp - Plain OTP text
 * @returns {string} Hashed OTP
 */
export function hashOTP(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify OTP against hash
 * @param {string} otp - Plain OTP text
 * @param {string} hash - Hashed OTP
 * @returns {boolean} True if OTP matches hash
 */
export function verifyOTP(otp, hash) {
    const otpHash = hashOTP(otp);
    return otpHash === hash;
}

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired
 */
export function isExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}

/**
 * Send OTP via WhatsApp using template message
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function sendWhatsAppOTP(phoneNumber, otp) {
    try {
        const {
            WHATSAPP_API_TOKEN,
            WHATSAPP_PHONE_NUMBER_ID,
            WHATSAPP_TEMPLATE_NAME,
            WHATSAPP_TEMPLATE_LANGUAGE,
            WHATSAPP_BASE_URL
        } = process.env;

        // Validate environment variables
        if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TEMPLATE_NAME) {
            throw new Error('WhatsApp API credentials not configured');
        }

        const url = `${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const requestBody = {
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
                name: WHATSAPP_TEMPLATE_NAME,
                language: {
                    code: WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
                },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            {
                                type: 'text',
                                text: otp
                            }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: '0',
                        parameters: [
                            {
                                type: 'text',
                                text: otp
                            }
                        ]
                    }
                ]
            }
        };

        console.log('📱 Sending WhatsApp OTP to:', phoneNumber);
        console.log('🔧 Using template:', WHATSAPP_TEMPLATE_NAME);

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

        console.log('✅ WhatsApp OTP sent successfully:', responseData.messages?.[0]?.id);

        return {
            success: true,
            message: 'OTP sent successfully via WhatsApp'
        };

    } catch (error) {
        console.error('❌ Error sending WhatsApp OTP:', error);
        return {
            success: false,
            error: error.message || 'Internal error sending OTP'
        };
    }
}
