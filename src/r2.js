// r2.js
// r2.js
const AWS = require("aws-sdk");

// Configure S3 for Cloudflare R2
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
  s3ForcePathStyle: true,      // ← NEW (fixes signature)
  signatureCache: false        // ← NEW (avoid stale sigs)
});
// rest of file stays identical …

// Helper: generate safe object key
function generateKey(filename) {
  return `${Date.now()}_${filename.replace(/\s+/g, "_")}`;
}

// ✅ Backend upload (not ideal for Vercel, but works for APIs / product feeds)
async function uploadToR2(file) {
  if (!file) return null;

  const key = generateKey(file.originalname);

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.upload(params).promise();

  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

// ✅ Generate signed URL for frontend direct upload
async function getSignedUploadURL(filename, mimetype) {
  const key = generateKey(filename);

  const uploadURL = await s3.getSignedUrlPromise("putObject", {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimetype,
    Expires: 60, // upload link valid for 1 min
  });

  // Public URL (works if bucket is public)
  const fileURL = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;

  return { uploadURL, fileURL, key };
}

// ✅ Optional: generate signed GET URL (works even if bucket is private)
async function getSignedDownloadURL(key) {
  return await s3.getSignedUrlPromise("getObject", {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Expires: 300, // 5 minutes expiry
  });
}

module.exports = {
  uploadToR2,
  getSignedUploadURL,
  getSignedDownloadURL, // only use if bucket is private
};



