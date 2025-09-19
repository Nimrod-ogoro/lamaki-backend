const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
});

async function uploadToR2(file) {
  if (!file) return null;

  const params = {
    Bucket: process.env.R2_BUCKET,
    Key: Date.now() + path.extname(file.originalname),
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  const data = await s3.upload(params).promise();
  return `${process.env.R2_URL}/${params.Key}`;
}

module.exports = uploadToR2;