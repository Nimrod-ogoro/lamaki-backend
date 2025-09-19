const pool = require("../db");

// Helper → ensure valid numeric values
function parseNumber(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

// ✅ Create Product
const createProduct = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: "Name, price, and stock are required" });
    }

    const result = await pool.query(
      `INSERT INTO products (name, price, description, stock, image_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, parseNumber(price), description || "", parseNumber(stock), image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating product:", err);
    res.status(500).json({ error: "Server error while adding product" });
  }
};

// ✅ Get All Products
const getProducts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");

    const products = result.rows.map(p => ({
      ...p,
      price: parseNumber(p.price),
      stock: parseNumber(p.stock),
      image_url: p.image_url || null
    }));

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: "Server error fetching products" });
  }
};

// ✅ Get Product by ID
const getProductById = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });

    const p = result.rows[0];
    res.json({
      ...p,
      price: parseNumber(p.price),
      stock: parseNumber(p.stock),
      image_url: p.image_url || null
    });
  } catch (err) {
    console.error("❌ Error fetching product by ID:", err);
    res.status(500).json({ error: "Server error fetching product" });
  }
};

// ✅ Update Product
const updateProduct = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `UPDATE products 
       SET name=$1, price=$2, description=$3, stock=$4, image_url=COALESCE($5, image_url), updated_at=NOW() 
       WHERE id=$6 RETURNING *`,
      [name, parseNumber(price), description || "", parseNumber(stock), image_url, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });

    const p = result.rows[0];
    res.json({
      ...p,
      price: parseNumber(p.price),
      stock: parseNumber(p.stock),
      image_url: p.image_url || null
    });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ error: "Server error updating product" });
  }
};

// ✅ Delete Product
const deleteProduct = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });

    res.json({ message: "✅ Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ error: "Server error deleting product" });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
