const pool = require("../db");

// Normalize helper → always returns TEXT[]
function normalizeToArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "string") {
    // split by commas OR line breaks
    const parts = input
      .split(/[\n,]+/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    return parts.length > 0 ? parts : [input.trim()];
  }
  return [String(input)];
}

// Create Project
exports.createProject = async (req, res) => {
  try {
    let { name, description } = req.body;
    const images = req.files ? req.files.map((f) => f.filename) : [];

    // ✅ Normalize description to TEXT[]
    description = normalizeToArray(description);

    const result = await pool.query(
      "INSERT INTO projects (name, description, images) VALUES ($1, $2, $3) RETURNING *",
      [name, description, images]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating project:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all Projects
exports.getProjects = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get Project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description } = req.body;
    const images = req.files ? req.files.map((f) => f.filename) : [];

    // ✅ Normalize description again
    description = normalizeToArray(description);

    const result = await pool.query(
      "UPDATE projects SET name=$1, description=$2, images=$3, updated_at=NOW() WHERE id=$4 RETURNING *",
      [name, description, images, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating project:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM projects WHERE id=$1", [id]);
    res.json({ message: "✅ Project deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

