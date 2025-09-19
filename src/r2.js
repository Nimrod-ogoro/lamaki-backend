const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,      // ← add _ID
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY, // ← add _ACCESS_KEY
  region: process.env.R2_REGION || "us-east-1",
  signatureVersion: "v4",
});

async function uploadToR2(file) {
  if (!file) return null;

  const params = {
    Bucket: process.env.R2_BUCKET_NAME, // ← add _NAME
    Key: Date.now() + path.extname(file.originalname),
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  const data = await s3.upload(params).promise();
  return data.Location; // R2 gives you the public URL
}

module.exports = uploadToR2;