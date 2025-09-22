// routes/projectRoutes.js
const express = require("express");
const multer = require("multer");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectsController");
const { getSignedUploadURL } = require("../r2");

const router = express.Router();

// ===== Multer Memory Storage (for backend uploads to R2) =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==========================================================
// ============   CLOUD STORAGE HELPERS   ===================
// ==========================================================

// ===== GET SIGNED URL =====
// This allows frontend to upload images directly to R2
// Example request: GET /api/projects/signed-url?filename=test.png&mimetype=image/png
router.get("/signed-url", async (req, res) => {
  try {
    const { filename, mimetype } = req.query;

    if (!filename || !mimetype) {
      return res.status(400).json({ error: "Missing filename or mimetype" });
    }

    // Generate signed URL using r2.js helper
    const result = await getSignedUploadURL(filename, mimetype);

    res.json(result);
  } catch (err) {
    console.error("❌ Error generating signed URL:", err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

// ==========================================================
// ============   PROJECT ROUTES (CRUD)   ===================
// ==========================================================

// ===== CREATE PROJECT =====
// Option 1: Frontend uploads images directly using signed URL
// Option 2: Upload images through backend using Multer
router.post("/", upload.array("images", 10), createProject);

// ===== GET ALL PROJECTS =====
router.get("/", getProjects);

// ===== UPDATE PROJECT =====
// Supports new images via Multer, or frontend direct upload
router.put("/:id", upload.array("images", 10), updateProject);

// ===== GET PROJECT BY ID =====
router.get("/:id", getProjectById);

// ===== DELETE PROJECT =====
router.delete("/:id", deleteProject);

module.exports = router;
;




