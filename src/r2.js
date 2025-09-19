// r2.js
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

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: Date.now() + path.extname(file.originalname),
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read", // optional, just in case
  };

  await s3.upload(params).promise();

  // ✅ Use your public R2 base URL
  return `https://pub-06a2a441a00c4ef597b4f4f0cac7cddf.r2.dev/${params.Key}`;
}

module.exports = uploadToR2;

