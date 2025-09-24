// server.js
require('dotenv').config();
const express = require("express");
const session = require("express-session");
const passport = require("./googleAuth/googleAuth");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Optional: AWS S3 client for S3-compatible storage (Cloudflare R2)
// Install: npm i @aws-sdk/client-s3
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const authRoutes = require("./routes/auth");
const googleRoutes = require("./routes/googleAuthRoute");
const productRoutes = require("./routes/productRoute");
const projectRoutes = require("./routes/projectRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const cartRoutes = require("./routes/Cart");
const mpesaRoutes = require("./routes/mpesa");
const reviewRoutes = require("./routes/reviews");

const app = express();

// ===== Security & Perf =====
app.use(helmet());
app.use(compression());

// ===== Trust proxy (needed for secure cookies behind proxies like Vercel) =====
app.set("trust proxy", 1);

// ===== CORS Setup =====
// ALLOWED ORIGINS: environment variable or default list
const defaultAllowed = [
  "http://localhost:5173",
  "https://lamaki-construction.vercel.app",
  "https://lamaki-construction-git-main-nimrod-ogoros-projects.vercel.app",
];

const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const allowedOrigins = allowedOriginsEnv.length ? allowedOriginsEnv : defaultAllowed;

app.use((req, res, next) => {
  // Handle simple preflight quickly for serverless environment
  const origin = req.header("Origin");
  if (!origin) {
    // Allow same-origin (server-to-server / tools) requests
    return next();
  }
  if (allowedOrigins.indexOf(origin) !== -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  } else {
    // Not allowed origin
    return res.status(403).json({ error: "CORS policy violation - origin not allowed" });
  }
});

// ===== Body Parser (increase limits to avoid 413) =====
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===== Session Setup =====
// NOTE: sessions on serverless are ephemeral; for production consider a proper store (Redis, DB) or JWT-based auth.
// This keeps current session code but sets cookie options appropriately for proxied envs.
app.use(
  session({
    secret: process.env.SESSION_SECRET || "please-set-a-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // set true in prod (requires HTTPS)
      sameSite: "lax",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ===== Passport Setup =====
app.use(passport.initialize());
app.use(passport.session());

// ===== File Upload Setup =====
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fieldSize: 50 * 1024 * 1024 } }); // 50MB

// Create S3 client if env vars present
let s3Client = null;
const S3_ENABLED = !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

if (S3_ENABLED) {
  s3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT, // must be full URL (no trailing slash)
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false, // Cloudflare R2 usually supports virtual-hosted style
  });
}

// Helper: upload buffer to S3-compatible storage
async function uploadToS3(fileBuffer, originalName, mimeType) {
  if (!s3Client) throw new Error("S3 client not configured");
  const key = `${Date.now()}_${originalName}`.replace(/\s+/g, "_");
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: "public-read", // NOTE: ensure your bucket policy allows this or adjust accordingly
  };

  await s3Client.send(new PutObjectCommand(params));

  // Build a public URL:
  // If user provided S3_PUBLIC_BASE, prefer that. Otherwise attempt reasonable default.
  if (process.env.S3_PUBLIC_BASE) {
    return `${process.env.S3_PUBLIC_BASE.replace(/\/$/, "")}/${key}`;
  }

  // Default attempt: for Cloudflare R2 with a custom public domain, user should set S3_PUBLIC_BASE.
  // For AWS S3:
  if (process.env.S3_ENDPOINT && process.env.S3_ENDPOINT.includes("amazonaws.com")) {
    // e.g. https://<bucket>.s3.amazonaws.com/<key>
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
  }

  // Best-effort fallback:
  return `${process.env.S3_ENDPOINT.replace(/\/$/, "")}/${process.env.S3_BUCKET}/${key}`;
}

// Fallback local save (only for dev)
async function uploadToLocal(file) {
  if (!file) return null;
  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const fileName = `${Date.now()}_${file.originalname}`.replace(/\s+/g, "_");
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${fileName}`;
}

// Expose uploads folder in dev (will exist only if used)
if (process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

// Example upload endpoint (you can adapt to your existing routes)
// Use `upload.single('file')` or `upload.array('files')` as needed
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    let url;
    if (S3_ENABLED) {
      url = await uploadToS3(file.buffer, file.originalname, file.mimetype);
    } else if (process.env.NODE_ENV !== "production") {
      url = await uploadToLocal(file);
    } else {
      return res.status(500).json({ error: "File uploads not configured for production" });
    }

    return res.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("Lamaki merch backend is running");
});

// ===== API Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/reviews", reviewRoutes ); // reviews route
// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  // If CORS origin error, return 403
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }
  res.status(500).json({ error: err.message || "Server error" });
});

// ===== Export app for serverless (Vercel) =====
module.exports = app;

