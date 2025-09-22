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

// ===== CREATE PROJECT (backend-managed upload via Multer) =====
router.post("/", upload.array("images", 10), createProject);

// ===== GET ALL PROJECTS =====
router.get("/", getProjects);

// ===== GET PROJECT BY ID =====
router.get("/:id", getProjectById);

// ===== UPDATE PROJECT =====
router.put("/:id", upload.array("images", 10), updateProject);

// ===== DELETE PROJECT =====
router.delete("/:id", deleteProject);

// ===== GET SIGNED URL (frontend direct upload) =====
router.get("/signed-url", async (req, res) => {
  try {
    const { filename, mimetype } = req.query;
    if (!filename || !mimetype) {
      return res.status(400).json({ error: "Missing filename or mimetype" });
    }

    const result = await getSignedUploadURL(filename, mimetype);
    res.json(result);
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

module.exports = router;



