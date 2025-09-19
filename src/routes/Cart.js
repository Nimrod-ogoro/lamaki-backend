const express = require ("express");
const db = require( "../db.js"); // your db connection
const authMiddleware = require ( "../middleware/authMiddleware.js"); // JWT auth

const router = express.Router();

// ✅ Get cart for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id AS cart_id, c.quantity, p.*
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// ✅ Add item to cart
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [userId, product_id, quantity]
    );

    const { rows } = await db.query(
      `SELECT c.id AS cart_id, c.quantity, p.*
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// ✅ Update item qty
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    await db.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [quantity, id, userId]
    );

    const { rows } = await db.query(
      `SELECT c.id AS cart_id, c.quantity, p.*
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update qty" });
  }
});

// ✅ Remove item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    const { rows } = await db.query(
      `SELECT c.id AS cart_id, c.quantity, p.*
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

module.exports= router;


