// r2.js  –  Cloudflare R2 helper  (no hand-built URLs)
const AWS = require("aws-sdk");

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
const generateKey = (filename) => `${Date.now()}_${filename.replace(/\s+/g, "_")}`;

/* ---------- 1.  backend upload (multer)  ---------- */
async function uploadToR2(file) {
  if (!file) return null;
  const key = generateKey(file.originalname);

  // upload with ACL → public
  const uploaded = await s3.upload({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read"
  }).promise();

  // Cloudflare returns the **public** URL – use it
  return uploaded.Location; // ✅ https://pub-<hash>.r2.dev/<key>
}

/* ---------- 2.  signed URL for browser direct upload  ---------- */
async function getSignedUploadURL(filename, mimetype) {
  const key = generateKey(filename);

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimetype,
    Expires: 60,
    ACL: "public-read"
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);

  // after PUT, object will be public – same host
  const fileURL = `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`;

  return {
    uploadURL, // signed PUT url
    fileURL,   // public GET url (matches uploaded.Location)
    key,
    headers: { "x-amz-acl": "public-read" } // browser must send
  };
}

/* ---------- 3.  optional signed GET (private objects)  ---------- */
async function getSignedDownloadURL(key) {
  return s3.getSignedUrlPromise("getObject", {
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