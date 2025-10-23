import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client (uses AWS credentials from environment or ~/.aws/credentials)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
});

/**
 * Generate a pre-signed URL for an S3 object
 * @param {string} s3Url - Full S3 URL (https://bucket.s3.region.amazonaws.com/key)
 * @param {number} expiresIn - Expiration time in seconds (default: 7 days)
 * @returns {Promise<string>} - Pre-signed URL
 */
export async function generatePresignedUrl(s3Url, expiresIn = 604800) {
  if (!s3Url) return null;

  try {
    // Parse S3 URL to extract bucket and key
    // Format: https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf
    const url = new URL(s3Url);
    const bucketName = url.hostname.split('.')[0]; // Extract bucket from hostname
    const key = decodeURIComponent(url.pathname.substring(1)); // Remove leading '/' and decode

    console.log(`Generating pre-signed URL for: ${bucketName}/${key}`);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // Generate pre-signed URL (max 7 days for SigV4)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: Math.min(expiresIn, 604800), // Cap at 7 days
    });

    return presignedUrl;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return s3Url; // Fallback to original URL if signing fails
  }
}

/**
 * Convert S3 URL in resume_file field to pre-signed URL
 * @param {string} resumeFile - Resume file path or S3 URL
 * @returns {Promise<string>} - Pre-signed URL
 */
export async function getResumePresignedUrl(resumeFile) {
  if (!resumeFile) return null;

  // Check if it's already an S3 URL
  if (resumeFile.startsWith('https://') && resumeFile.includes('.s3.')) {
    return generatePresignedUrl(resumeFile);
  }

  // If it's just a filename, construct S3 URL
  const bucketName = process.env.S3_BUCKET_NAME || 'resume-storage-tamu-law';
  const region = process.env.AWS_REGION || 'us-east-2';
  const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${resumeFile}`;

  return generatePresignedUrl(s3Url);
}
