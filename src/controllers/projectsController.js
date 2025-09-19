const pool = require("../db");
const uploadToR2 = require("../r2Upload"); // helper to upload files to Cloudflare R2

// Helper → always returns TEXT[]
function normalizeToArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    const parts = input
      .split(/[\n,]+/) // split by commas or line breaks
      .map(d => d.trim())
      .filter(d => d.length > 0);
    return parts.length > 0 ? parts : [input.trim()];
  }
  return [String(input)];
}

// ===== CREATE PROJECT =====
exports.createProject = async (req, res) => {
  try {
    let { name, description } = req.body;

    // upload images to R2
    const images = req.files
      ? await Promise.all(req.files.map(f => uploadToR2(f)))
      : [];

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

    const projects = result.rows.map(p => ({
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
      description: Array.isArray(result.rows[0].description) ? result.rows[0].description : [],
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
    let { name, description } = req.body;

    const images = req.files
      ? await Promise.all(req.files.map(f => uploadToR2(f)))
      : [];

    description = normalizeToArray(description);

    const result = await pool.query(
      "UPDATE projects SET name=$1, description=$2, images=$3, updated_at=NOW() WHERE id=$4 RETURNING *",
      [name, description, images, id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    const project = {
      ...result.rows[0],
      description: Array.isArray(result.rows[0].description) ? result.rows[0].description : [],
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
    const result = await pool.query("DELETE FROM projects WHERE id=$1 RETURNING *", [id]);

    if (!result.rows.length) return res.status(404).json({ error: "Project not found" });

    res.json({ message: "✅ Project deleted" });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    res.status(500).json({ error: "Server error" });
  }
};
