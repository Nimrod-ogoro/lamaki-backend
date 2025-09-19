const express = require("express");
const router = express.Router();
const { register, login, getUsers } = require("../controllers/authController"); // import properly
const authMiddleware = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route (needs token)
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "welcome", user: req.user });
});

// ✅ Get all users (remove authMiddleware if you want dashboard to load without login)
router.get("/users", getUsers);

module.exports = router;
