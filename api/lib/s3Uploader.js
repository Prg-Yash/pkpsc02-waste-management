import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, bucketName, region } from "./s3.js";

/**
 * Upload a file buffer to S3
 * @param {Buffer} buffer - File buffer to upload
 * @param {string} key - S3 object key (path)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadToS3(buffer, key, contentType) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      //   ACL: 'public-read', // Make file publicly accessible
    });

    await s3Client.send(command);

    // Return public URL
    return getFileUrl(key);
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Get public URL for an S3 object
 * @param {string} key - S3 object key
 * @returns {string} Public URL
 */
export function getFileUrl(key) {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Generate S3 key for waste report image
 * @param {string} reportId - Waste report ID
 * @param {string} originalFileName - Original file name
 * @returns {string} S3 key
 */
export function generateWasteReportKey(reportId, originalFileName) {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(originalFileName);
  return `waste-reports/${reportId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Generate S3 key for waste collection image
 * @param {string} wasteId - Waste report ID
 * @param {string} originalFileName - Original file name
 * @returns {string} S3 key
 */
export function generateWasteCollectionKey(wasteId, originalFileName) {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(originalFileName);
  return `waste-collections/${wasteId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Generate S3 key for user file
 * @param {string} userId - User ID
 * @param {string} originalFileName - Original file name
 * @returns {string} S3 key
 */
export function generateUserFileKey(userId, originalFileName) {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(originalFileName);
  return `users/${userId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Generate S3 key for marketplace listing image
 * @param {string} userId - User ID (seller)
 * @param {string} originalFileName - Original file name
 * @returns {string} S3 key
 */
export function generateMarketplaceImageKey(userId, originalFileName) {
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(originalFileName);
  return `marketplace/${userId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Sanitize file name to prevent path traversal and special characters
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
function sanitizeFileName(fileName) {
  // Remove path separators and keep only the file name
  const baseName = fileName.replace(/^.*[\\\/]/, "");

  // Replace spaces and special characters with hyphens
  return baseName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
