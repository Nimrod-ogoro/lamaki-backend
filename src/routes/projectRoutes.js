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

// Memory storage for Cloudflare R2 uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== CREATE PROJECT =====
router.post("/", upload.array("images"), createProject);

// ===== GET ALL PROJECTS =====
router.get("/", getProjects);

// ===== GET PROJECT BY ID =====
router.get("/:id", getProjectById);

// ===== UPDATE PROJECT =====
router.put("/:id", upload.array("images"), updateProject);

// ===== DELETE PROJECT =====
router.delete("/:id", deleteProject);

module.exports = router;


