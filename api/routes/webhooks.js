import express from 'express';
import { Webhook } from 'svix';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * POST /api/webhooks/clerk
 * Clerk Webhook Handler
 * Handles user.created, user.updated, and user.deleted events
 * This is the ONLY place where Clerk auth is used
 */
router.post('/clerk', async (req, res) => {
    try {
        // Get webhook secret
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('CLERK_WEBHOOK_SECRET is not set');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        // Get headers for Svix verification
        const svixId = req.get('svix-id');
        const svixTimestamp = req.get('svix-timestamp');
        const svixSignature = req.get('svix-signature');

        if (!svixId || !svixTimestamp || !svixSignature) {
            return res.status(400).json({ error: 'Missing Svix headers' });
        }

        // Get raw body (already parsed as Buffer by express.raw in server.js)
        const payload = req.body.toString('utf8');

        // Verify webhook signature
        const wh = new Webhook(webhookSecret);
        let event;

        try {
            event = wh.verify(payload, {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
            });
        } catch (err) {
            console.error('Webhook verification failed:', err);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Handle different event types
        const { type, data } = event;

        switch (type) {
            case 'user.created':
            case 'user.updated':
                await handleUserUpsert(data);
                break;

            case 'user.deleted':
                await handleUserDelete(data);
                break;

            default:
                console.log('Unhandled webhook event type:', type);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Handle user.created and user.updated events
 */
async function handleUserUpsert(data) {
    try {
        // Extract user data
        const userId = data.id;

        // Get primary email
        const primaryEmailId = data.primary_email_address_id;
        const emailObj = data.email_addresses?.find(
            (e) => e.id === primaryEmailId
        );
        const email = emailObj?.email_address || '';

        // Get phone number
        const phone = data.phone_numbers?.[0]?.phone_number || null;

        // Get full name
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const name = `${firstName} ${lastName}`.trim() || null;

        // Upsert user in database
        await prisma.user.upsert({
            where: { id: userId },
            update: {
                email,
                name,
                phone,
            },
            create: {
                id: userId,
                email,
                name,
                phone,
                enableCollector: false,
            },
        });

        console.log(`User ${userId} upserted successfully`);
    } catch (error) {
        console.error('Error upserting user:', error);
        throw error;
    }
}

/**
 * Handle user.deleted events
 */
async function handleUserDelete(data) {
    try {
        const userId = data.id;

        // Delete user from database
        await prisma.user.delete({
            where: { id: userId },
        });

        console.log(`User ${userId} deleted successfully`);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

export default router;
