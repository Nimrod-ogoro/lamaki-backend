// routes/reviews.js
import express from 'express';
import db from '../db.js'; // your pg/mysql client
const router = express.Router();

// GET /api/reviews  (public)
router.get('/', async (_req, res) => {
  const rows = await db`
    SELECT id, author, rating, body, created_at, source
    FROM   reviews
    WHERE  approved = true
    ORDER  BY created_at DESC`;
  res.json(rows);
});

// POST /api/reviews (public – add review)
router.post('/', async (req, res) => {
  const { author, rating, body } = req.body;
  if (!author || !body || rating < 1 || rating > 5) return res.status(400).json({error:'invalid'});
  const [newRow] = await db`
    INSERT INTO reviews (author, rating, body, approved)
    VALUES (${author}, ${rating}, ${body}, true)  -- auto-approve if you trust
    RETURNING id, author, rating, body, created_at, source`;
  res.status(201).json(newRow);
});

module.exports = router;