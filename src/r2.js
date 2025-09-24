// r2.js  –  Cloudflare R2 helper  (hard-coded NEW public host)
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

const generateKey = (f) => `${Date.now()}_${f.replace(/\s+/g, "_")}`;

/* ---------- 1.  backend upload (multer)  ---------- */
async function uploadToR2(file) {
  if (!file) return null;
  const uploaded = await s3.upload({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: generateKey(file.originalname),
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read"
  }).promise();

  // use the **new** public host (no old account hash)
  return `https://pub-06a2a441a00c4ef597b4f4f0cac7cddf.r2.dev/${uploaded.Key}`;
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

  // ✅ NEW public host – zero old account ID
  const fileURL = `https://pub-06a2a441a00c4ef597b4f4f0cac7cddf.r2.dev/${key}`;

  return {
    uploadURL,
    fileURL,
    key,
    headers: { "x-amz-acl": "public-read" }
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