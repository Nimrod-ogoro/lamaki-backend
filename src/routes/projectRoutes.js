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

// memory storage for R2 uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.array("images"), createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", upload.array("images"), updateProject);
router.delete("/:id", deleteProject);

module.exports = router;


