const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
});

if (req.file) {
  const params = {
    Bucket: process.env.R2_BUCKET,
    Key: Date.now() + path.extname(req.file.originalname),
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    ACL: "public-read",
  };
  const data = await s3.upload(params).promise();
  image_url = data.Location; // this goes to DB
}

