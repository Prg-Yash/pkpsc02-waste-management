import { S3Client } from '@aws-sdk/client-s3';

/**
 * AWS S3 Client Configuration
 * Reads credentials and bucket info from environment variables
 */

// Validate required environment variables
const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME',
    'S3_REGION'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.warn(`⚠️  Missing S3 environment variables: ${missingVars.join(', ')}`);
    console.warn('S3 upload functionality will not work without these variables.');
}

// Create S3 client
export const s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

// Export configuration
export const bucketName = process.env.S3_BUCKET_NAME || '';
export const region = process.env.S3_REGION || 'us-east-1';

// Validate configuration
export function validateS3Config() {
    if (!bucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('S3 configuration incomplete. Check environment variables.');
    }
    return true;
}
