import { randomUUID } from 'node:crypto';
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
  'application/pdf',
]);

let client: S3Client | null = null;

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
  }

  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  return client;
}

function getBucketName() {
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) throw new Error('Cloudflare R2 is not configured. Set R2_BUCKET_NAME.');
  return bucketName;
}

function sanitizeFilename(name: string) {
  return name.trim().replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'media';
}

export async function createMediaUpload(userId: string, name: string, contentType: string, size: number) {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error('Unsupported media type. Upload an image, MP3/MP4 audio, MP4 video, or PDF.');
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_MEDIA_BYTES) {
    throw new Error('Media files must be between 1 byte and 50 MB.');
  }

  const bucket = getBucketName();
  const objectKey = `church-media/${userId}/${randomUUID()}-${sanitizeFilename(name)}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: size,
  });
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 300 });
  return { objectKey, uploadUrl, expiresIn: 300 };
}

export async function verifyMediaUpload(objectKey: string) {
  const bucket = getBucketName();
  const head = await getR2Client().send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (!head.ContentLength || head.ContentLength > MAX_MEDIA_BYTES) {
    throw new Error('Uploaded media is empty or exceeds the 50 MB limit.');
  }
  if (!head.ContentType || !ALLOWED_CONTENT_TYPES.has(head.ContentType)) {
    throw new Error('Uploaded media has an unsupported content type.');
  }
  return { size: head.ContentLength, contentType: head.ContentType };
}

export async function createMediaDownloadUrl(objectKey: string) {
  const command = new GetObjectCommand({ Bucket: getBucketName(), Key: objectKey });
  return getSignedUrl(getR2Client(), command, { expiresIn: 300 });
}
