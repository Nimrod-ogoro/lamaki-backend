// server.js
const express = require("express");
const session = require("express-session");
const passport = require("./googleAuth/googleAuth");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const googleRoutes = require("./routes/googleAuthRoute");
const productRoutes = require("./routes/productRoute");
const projectRoutes = require("./routes/projectRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const cartRoutes = require("./routes/Cart");
const mpesaRoutes = require("./routes/mpesa");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();

// ===== Security & Compression =====
app.use(helmet());
app.use(compression());

// ===== CORS Setup =====
const allowedOrigins = [
  "http://localhost:5173",
  "https://lamaki-construction.vercel.app",
  "https://lamaki-construction-git-main-nimrod-ogoros-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS policy violation"), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===== Body Parser =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Session Setup =====
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }, // HTTPS only in prod
  })
);

// ===== Passport Setup =====
app.use(passport.initialize());
app.use(passport.session());

// ===== File Upload Setup =====
// store uploaded files in memory first
const storage = multer.memoryStorage();
const upload = multer({ storage });

// fallback for production: save files locally
const uploadToLocal = async (file) => {
  if (!file) return null;
  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  const filePath = path.join(uploadDir, `${Date.now()}_${file.originalname}`);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${path.basename(filePath)}`;
};

// ===== Static Files =====
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});

// ===== Export for Vercel (serverless) =====
module.exports = app; // DO NOT call app.listen() on Vercel
