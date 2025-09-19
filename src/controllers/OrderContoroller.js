const pool = require("../db");

// Create new order
const createOrder = async (req, res) => {
  try {
    const { user_id, products, total_price, status } = req.body;

    const result = await pool.query(
      `INSERT INTO orders (user_id, products, total_price, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, JSON.stringify(products), total_price, status || "pending"]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, products, total_price, status } = req.body;

    const result = await pool.query(
      `UPDATE orders 
       SET user_id=$1, products=$2, total_price=$3, status=$4
       WHERE id=$5 RETURNING *`,
      [user_id, JSON.stringify(products), total_price, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM orders WHERE id=$1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
