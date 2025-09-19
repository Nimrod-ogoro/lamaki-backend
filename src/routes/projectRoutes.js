const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectsController");

const router = express.Router();

// setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// routes
router.post("/", upload.array("images"), createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", upload.array("images"), updateProject);
router.delete("/:id", deleteProject);

module.exports = router;
