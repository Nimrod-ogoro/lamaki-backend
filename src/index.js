// server.js
const express = require("express");
const session = require("express-session");
const passport = require("./googleAuth/googleAuth");
const cors = require("cors");
const helmet = require('helmet');
const compression = require('compression');
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

// ===== CORS Setup =====
app.use(cors({
  origin: "http://localhost:5173",   // frontend URL
  credentials: true,                 // allow cookies/credentials
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(helmet());
app.use(cors({ origin: ['https://lamaki-construction.vercel.app', 'http://localhost:5173'] }));

// ===== Body parser ===== men it should bw working am tired
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Session setup (before passport) =====
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

// ===== Passport setup =====
app.use(passport.initialize());
app.use(passport.session());

// ===== Test route =====
app.get("/", (req, res) => {
  res.send("Lamaki merch backend is running");
});

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/projects", projectRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/orders", orderRoutes);
app.use('/api/mpesa', mpesaRoutes);

app.use("/api/cart", cartRoutes);


// ===== Start server =====
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

