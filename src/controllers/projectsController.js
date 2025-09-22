const pool = require("../db");
const { uploadToR2 } = require("../r2"); // helper to upload files to Cloudflare R2
const AWS = require("aws-sdk");

// Setup R2 client (for deleting)
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: process.env.R2_REGION || "us-east-1",
  signatureVersion: "v4",
});

// Helper → always returns TEXT[]
function normalizeToArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    const parts = input
      .split(/[\n,]+/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    return parts.length > 0 ? parts : [input.trim()];
  }
  return [String(input)];
}

// ===== CREATE PROJECT =====
exports.createProject = async (req, res) => {
  try {
    let { name, description, imageUrls } = req.body;

    // Case 1: Files uploaded via Multer
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(req.files.map((f) => uploadToR2(f)));
    }

    // Case 2: Direct URLs from signed upload flow
    let directUrls = [];
    if (imageUrls) {
      try {
        directUrls = JSON.parse(imageUrls); // frontend sends ["url1","url2"]
      } catch {
        directUrls = normalizeToArray(imageUrls);
      }
    }

    const images = [...uploadedImages, ...directUrls];
    description = normalizeToArray(description);

    const result = await pool.query(
      "INSERT INTO projects (name, description, images) VALUES ($1, $2, $3) RETURNING *",
      [name, description, images]
    );

    const project = {
      ...result.rows[0],
      description: normalizeToArray(result.rows[0].description),
      images: Array.isArray(result.rows[0].images) ? result.rows[0].images : [],
    };

    res.json(project);
  } catch (err) {
    console.error("❌ Error creating project:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== GET ALL PROJECTS =====
exports.getProjects = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY created_at DESC");

    const projects = result.rows.map((p) => ({
      ...p,
      description: Array.isArray(p.description) ? p.description : [],
      images: Array.isArray(p.images) ? p.images : [],
    }));

    res.json(projects);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== GET PROJECT BY ID =====
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM projects WHERE id=$1", [id]);

    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const project = {
      ...result.rows[0],
      description: Array.isArray(result.rows[0].description)
        ? result.rows[0].description
        : [],
      images: Array.isArray(result.rows[0].images) ? result.rows[0].images : [],
    };

    res.json(project);
  } catch (err) {
    console.error("❌ Error fetching project by ID:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== UPDATE PROJECT =====
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, imageUrls } = req.body;

    // Upload new images if any (Multer)
    const newUploads = req.files
      ? await Promise.all(req.files.map((f) => uploadToR2(f)))
      : [];

    // Direct URLs (from signed upload flow)
    let newDirectUrls = [];
    if (imageUrls) {
      try {
        newDirectUrls = JSON.parse(imageUrls);
      } catch {
        newDirectUrls = normalizeToArray(imageUrls);
      }
    }

    // Get existing project
    const existing = await pool.query("SELECT * FROM projects WHERE id=$1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Project not found" });

    const oldImages = Array.isArray(existing.rows[0].images)
      ? existing.rows[0].images
      : [];

    // Merge old + new
    const images = [...oldImages, ...newUploads, ...newDirectUrls];
    description = normalizeToArray(description);

    const result = await pool.query(
      "UPDATE projects SET name=$1, description=$2, images=$3, updated_at=NOW() WHERE id=$4 RETURNING *",
      [name, description, images, id]
    );

    const project = {
      ...result.rows[0],
      description: normalizeToArray(result.rows[0].description),
      images: Array.isArray(result.rows[0].images) ? result.rows[0].images : [],
    };

    res.json(project);
  } catch (err) {
    console.error("❌ Error updating project:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ===== DELETE PROJECT =====
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Get project before deleting
    const existing = await pool.query("SELECT * FROM projects WHERE id=$1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Project not found" });

    const images = Array.isArray(existing.rows[0].images)
      ? existing.rows[0].images
      : [];

    // Delete images from R2
    await Promise.all(
      images.map(async (url) => {
        try {
          const key = url.split("/").pop(); // filename
          await s3
            .deleteObject({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: key,
            })
            .promise();
        } catch (err) {
          console.error("⚠️ Failed to delete image from R2:", url, err.message);
        }
      })
    );

    // Delete project from DB
    await pool.query("DELETE FROM projects WHERE id=$1", [id]);

    res.json({ message: "✅ Project and images deleted" });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    res.status(500).json({ error: "Server error" });
  }
};

