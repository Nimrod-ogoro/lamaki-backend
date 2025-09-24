// r2.js
const AWS = require("aws-sdk");

// Configure S3 for Cloudflare R2
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
  s3ForcePathStyle: true,
  signatureCache: false
});

/* ---------- helpers ---------- */
function generateKey(filename) {
  return `${Date.now()}_${filename.replace(/\s+/g, "_")}`;
}

/* ---------- backend upload (admin API) ---------- */
async function uploadToR2(file) {
  if (!file) return null;
  const key = generateKey(file.originalname);
  await s3.upload({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read"
  }).promise();
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;
}

/* ---------- signed URL for front-end direct upload ---------- */
async function getSignedUploadURL(filename, mimetype) {
  const key = generateKey(filename);

  // 1.  parameters that include ACL (must be signed)
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimetype,
    Expires: 60,
    ACL: "public-read"
  };

  // 2.  create signed URL with ACL
  const uploadURL = await s3.getSignedUrlPromise("putObject", params);

  // 3.  tell front-end which headers must be sent
  return {
    uploadURL,
    fileURL: `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`,
    key,
    headers: { "x-amz-acl": "public-read" } // ← browser must add this
  };
}

/* ---------- optional private download ---------- */
async function getSignedDownloadURL(key) {
  return await s3.getSignedUrlPromise("getObject", {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Expires: 300
  });
}

module.exports = {
  uploadToR2,
  getSignedUploadURL,
  getSignedDownloadURL
};


