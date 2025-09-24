// routes/projectRoutes.js
const express = require("express");
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectsController");
const { getSignedUploadURL } = require("../r2");

const router = express.Router();

/* ----------------------------------------------------------
   1.  Signed-URL route  (front-end → R2)
   ---------------------------------------------------------- */
router.get("/signed-url", async (req, res) => {
  try {
    const { filename, mimetype } = req.query;
    if (!filename || !mimetype)
      return res.status(400).json({ error: "Missing filename or mimetype" });

    const result = await getSignedUploadURL(filename, mimetype);
    res.json(result);
  } catch (err) {
    console.error("❌ Error generating signed URL:", err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

/* ----------------------------------------------------------
   2.  CRUD routes  (JSON only – no multer)
   ---------------------------------------------------------- */
router.post("/", createProject);            // ← images now arrive as URLs
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);          // ← images now arrive as URLs
router.delete("/:id", deleteProject);

module.exports = router;




