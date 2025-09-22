// r2.js
const AWS = require("aws-sdk");
const path = require("path");

// Configure S3-compatible client (Cloudflare R2)
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION || "auto", // R2 ignores region, but AWS SDK requires it
  signatureVersion: "v4",
});

// Upload file buffer to R2
async function uploadToR2(file) {
  if (!file) return null;

  const key = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ⚠️ Note: R2 doesn’t actually support ACLs — all access is controlled by bucket policy
    // Leaving this here won’t break, but consider managing access in the dashboard
    ACL: "public-read",
  };

  await s3.upload(params).promise();

  // If you’ve enabled the public R2.dev domain for this bucket
  if (process.env.R2_PUBLIC_BASE) {
    return `${process.env.R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  }

  // fallback to hardcoded (your example one)
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

module.exports = uploadToR2;


