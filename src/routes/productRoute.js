// routes/productRoute.js
const express = require("express");
const multer = require("multer");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

// Memory storage for file uploads (R2)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== CREATE PRODUCT =====
router.post("/", upload.single("image"), createProduct);

// ===== GET ALL PRODUCTS =====
router.get("/", getProducts);

// ===== GET PRODUCT BY ID =====
router.get("/:id", getProductById);

// ===== UPDATE PRODUCT =====
router.put("/:id", upload.single("image"), updateProduct);

// ===== DELETE PRODUCT =====
router.delete("/:id", deleteProduct);

module.exports = router;

