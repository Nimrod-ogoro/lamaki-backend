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

const router = express.Router();

// ===== Multer Memory Storage (for Cloudflare R2 uploads) =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== CREATE PROJECT =====
// Accepts both single and multiple images
router.post("/", upload.array("images", 10), createProject);

// ===== GET ALL PROJECTS =====
router.get("/", getProjects);

// ===== GET PROJECT BY ID =====
router.get("/:id", getProjectById);

// ===== UPDATE PROJECT =====
// Works for single or multiple new images
router.put("/:id", upload.array("images", 10), updateProject);

// ===== DELETE PROJECT =====
router.delete("/:id", deleteProject);

module.exports = router;



