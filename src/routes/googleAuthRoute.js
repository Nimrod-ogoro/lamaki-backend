const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Step 1: Start OAuth login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Step 2: Handle OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:5173" }),
  (req, res) => {
    // Create JWT token
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Redirect to frontend with token in query
    res.redirect(`http://localhost:5173/MerchShop?token=${token}`);
  }
);

module.exports = router;






