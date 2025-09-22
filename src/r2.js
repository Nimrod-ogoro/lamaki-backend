// r2.js
const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION || "auto",
  signatureVersion: "v4",
});

// Upload (old method, requires file.buffer) ❌ not good for Vercel
async function uploadToR2(file) {
  if (!file) return null;
  const key = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  await s3.upload(params).promise();
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

// Generate a signed URL for frontend to upload directly ✅
async function getSignedUploadURL(filename, mimetype) {
  const key = `${Date.now()}_${filename.replace(/\s+/g, "_")}`;
  const uploadURL = await s3.getSignedUrlPromise("putObject", {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimetype,
    Expires: 60, // 1 minute expiry
  });
  return {
    uploadURL,
    fileURL: `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`,
  };
}

module.exports = { uploadToR2, getSignedUploadURL };



