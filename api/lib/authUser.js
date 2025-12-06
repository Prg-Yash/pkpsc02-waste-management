import { prisma } from './prisma.js';

/**
 * Get authenticated user from request
 * Reads userId from header "x-user-id" or body.userId
 * Validates that user exists in database
 * 
 * @param {Request} req - Next.js request object
 * @returns {Promise<{user: Object} | {error: string, status: number}>}
 */
export async function getUserFromRequest(req) {
    try {
        // Try to get userId from header first
        let userId = req.headers.get('x-user-id');

        // If not in header, try to get from body
        if (!userId) {
            const body = await req.json().catch(() => ({}));
            userId = body.userId;

            // Re-create request with parsed body for later use
            if (userId) {
                req.bodyData = body;
            }
        }

        // Validate userId is present
        if (!userId) {
            return {
                error: 'Unauthorized: userId is required in header "x-user-id" or body',
                status: 401
            };
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // Validate user exists
        if (!user) {
            return {
                error: 'Unauthorized: User not found',
                status: 401
            };
        }

        return { user };
    } catch (error) {
        console.error('Error in getUserFromRequest:', error);
        return {
            error: 'Internal server error during authentication',
            status: 500
        };
    }
}

/**
 * Helper to get body data (handles case where body was already parsed)
 * @param {Request} req 
 * @returns {Promise<Object>}
 */
export async function getRequestBody(req) {
    if (req.bodyData) {
        return req.bodyData;
    }
    try {
        return await req.json();
    } catch {
        return {};
    }
}
