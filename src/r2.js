const express = require("express");
const router = express.Router();
const projectsController = require("../controllers/projectsController");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

// Cloudflare R2 config
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(process.env.R2_ENDPOINT), // e.g. https://<account_id>.r2.cloudflarestorage.com
  accessKeyId: process.env.R2_ACCESS_KEY,
  secretAccessKey: process.env.R2_SECRET_KEY,
  region: "auto",
});

// Multer S3 setup
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.R2_BUCKET, // e.g. "lamaki"
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
});

