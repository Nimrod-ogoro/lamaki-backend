const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db.js");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // ✅ Check if user exists by email
        const userRes = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        let user;
        if (userRes.rows.length > 0) {
          user = userRes.rows[0];
        } else {
          // 🆕 Insert new user
          const insertRes = await pool.query(
            "INSERT INTO users (name, email, provider) VALUES ($1, $2, $3) RETURNING *",
            [profile.displayName, email, "google"]
          );
          user = insertRes.rows[0];
        }

        return done(null, user);
      } catch (err) {
        console.error("Google Auth Error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, res.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;




