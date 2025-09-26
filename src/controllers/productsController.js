// controllers/productController.js
const pool = require("../db");
const { uploadToR2 } = require("../r2");   // same helper you use for projects
const AWS = require("aws-sdk");

// R2 client for optional image deletion
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION || "us-east-1",
  signatureVersion: "v4",
});

/* ---------- helpers ---------- */
function parseNumber(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

/* ---------- CREATE ---------- */
exports.createProduct = async (req, res) => {
  try {
    // Accept either pre-uploaded URL (string) or a fresh file
    const { name, price, description, stock, image_url } = req.body;

    let finalImage = image_url || null;
    if (!finalImage && req.file) {
      finalImage = await uploadToR2(req.file); // direct upload fallback
    }

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: "Name, price and stock are required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO products (name, price, description, stock, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, parseNumber(price), description || "", parseNumber(stock), finalImage]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ createProduct:", err);
    res.status(500).json({ error: "Server error while adding product" });
  }
};

/* ---------- READ ALL ---------- */
exports.getProducts = async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY id DESC");
    const products = rows.map((p) => ({
      ...p,
      price:  parseNumber(p.price),
      stock:  parseNumber(p.stock),
      image_url: p.image_url || null,
    }));
    res.json(products);
  } catch (err) {
    console.error("❌ getProducts:", err);
    res.status(500).json({ error: "Server error fetching products" });
  }
};

/* ---------- READ ONE ---------- */
exports.getProductById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });

    const p = rows[0];
    res.json({ ...p, price: parseNumber(p.price), stock: parseNumber(p.stock) });
  } catch (err) {
    console.error("❌ getProductById:", err);
    res.status(500).json({ error: "Server error fetching product" });
  }
};

/* ---------- UPDATE ---------- */
exports.updateProduct = async (req, res) => {
  try {
    const { name, price, description, stock, image_url } = req.body;
    const id = req.params.id;

    let newImage = image_url || null;
    if (!newImage && req.file) newImage = await uploadToR2(req.file);

    const { rows } = await pool.query(
      `UPDATE products
         SET name=$1, price=$2, description=$3, stock=$4,
             image_url=COALESCE($5, image_url), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, parseNumber(price), description || "", parseNumber(stock), newImage, id]
    );

    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ updateProduct:", err);
    res.status(500).json({ error: "Server error updating product" });
  }
};

/* ---------- DELETE ---------- */
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    // grab image URL before deletion
    const { rows } = await pool.query("SELECT image_url FROM products WHERE id=$1", [id]);
    if (!rows.length) return res.status(404).json({ error: "Product not found" });

    const imageUrl = rows[0].image_url;

    // delete from DB
    await pool.query("DELETE FROM products WHERE id=$1", [id]);

    // optionally remove from R2
    if (imageUrl) {
      try {
        const key = imageUrl.split("/").pop();
        await s3
          .deleteObject({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
          .promise();
      } catch (e) {
        console.warn("⚠️  could not delete image from R2:", e.message);
      }
    }

    res.json({ message: "✅ Product deleted" });
  } catch (err) {
    console.error("❌ deleteProduct:", err);
    res.status(500).json({ error: "Server error" });
  }
};