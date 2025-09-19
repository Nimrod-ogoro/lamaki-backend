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

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ===== Security & Compression =====
app.use(helmet());
app.use(compression());

// ===== CORS Setup =====
const allowedOrigins = [
  "http://localhost:5173",
  "https://lamaki-construction.vercel.app",   // ✅ space removed
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
    cookie: { secure: false }, // set true if HTTPS
  })
);

// ===== Passport Setup =====
app.use(passport.initialize());
app.use(passport.session());

// ===== Static Files =====
app.use("/uploads", express.static("uploads"));

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

// ===== Export for Vercel (serverless) =====
module.exports = app;   // ✅ DO NOT call app.listen() on Vercel