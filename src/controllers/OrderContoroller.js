const pool = require("../db");

// Helper → ensure products is always an array
function normalizeProducts(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Create new order
const createOrder = async (req, res) => {
  try {
    const { user_id, products, total_price, status } = req.body;

    if (!user_id || !products || !total_price) {
      return res.status(400).json({ message: "user_id, products, and total_price are required" });
    }

    const result = await pool.query(
      `INSERT INTO orders (user_id, products, total_price, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, JSON.stringify(products), total_price, status || "pending"]
    );

    const order = {
      ...result.rows[0],
      products: normalizeProducts(result.rows[0].products),
    };

    res.status(201).json(order);
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");

    const orders = result.rows.map((o) => ({
      ...o,
      products: normalizeProducts(o.products),
    }));

    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
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

    const order = {
      ...result.rows[0],
      products: normalizeProducts(result.rows[0].products),
    };

    res.json(order);
  } catch (error) {
    console.error("❌ Error fetching order by ID:", error);
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

    const order = {
      ...result.rows[0],
      products: normalizeProducts(result.rows[0].products),
    };

    res.json(order);
  } catch (error) {
    console.error("❌ Error updating order:", error);
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
    console.error("❌ Error deleting order:", error);
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

