// r2Upload.js
const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION || "us-east-1",
  signatureVersion: "v4",
});

async function uploadToR2(file) {
  if (!file) return null;

  const key = `${Date.now()}${path.extname(file.originalname)}`;

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read", // optional if you want the file public
  };

  await s3.upload(params).promise();

  // Public URL
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

module.exports = uploadToR2;
