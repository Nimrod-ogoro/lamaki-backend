// routes/productRoute.js
const express = require("express");
const multer = require("multer");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productsController.js");

const router = express.Router();

// Memory storage for file uploads (R2)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ---------- public routes ---------- */
router.get("/", getProducts);
router.get("/:id", getProductById);

/* ---------- admin / mutating routes ---------- */
router.post("/", upload.single("image"), createProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;

