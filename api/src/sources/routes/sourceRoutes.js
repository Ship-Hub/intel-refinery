// Refinery Source Routes
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs/promises");
const multer = require("multer");
const pool = require("../../config/db").promise();
const ingestionRegistry = require("../../ingestion/registry");
const { generateFileHash } = require("../../security/generateFileHash");
const { validateUpload, UploadError } = require("../../security/validateUpload");
const { ensureDirectory } = require("../../storage/ensureDirectory");
const appConfig = require("../../config/appConfig");

const router = express.Router();

const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(UPLOADS_DIR, "sources");
    await ensureDirectory(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: appConfig.uploads.maxFileSize }
});

// Upload source
router.post("/upload", upload.single("source"), async (req, res) => {
  try {
    const { project_id } = req.body;
    if (!project_id) {
      return res.status(400).json({ success: false, error: "project_id is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No source file uploaded" });
    }

    const accountId = req.account?.id || req.apiKey?.account_id;

    // Verify project belongs to account
    const [projects] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ?",
      [project_id, accountId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // Validate upload
    try {
      validateUpload(req.file);
    } catch (err) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, error: err.message });
    }

    const fileHash = await generateFileHash(req.file.path);
    const mimeType = req.file.mimetype;
    const sourceId = uuidv4();

    // Detect source type from MIME
    let sourceType = "other";
    let sourceCategory = "other";

    if (mimeType === "application/pdf") {
      sourceType = "pdf";
      sourceCategory = "document";
    } else if (mimeType.startsWith("image/")) {
      sourceType = "image";
      sourceCategory = "image";
    } else if (mimeType.startsWith("text/") || mimeType === "text/markdown") {
      sourceType = "text";
      sourceCategory = "text";
    } else if (mimeType.startsWith("audio/")) {
      sourceType = "audio";
      sourceCategory = "audio";
    }

    // Run ingestion adapter
    const adapter = ingestionRegistry.get(sourceType);
    let extractedText = "";
    let metadata = {};

    if (adapter && adapter.processFile) {
      try {
        const result = await adapter.processFile(req.file.path, req.file.originalname);
        extractedText = result.text || "";
        metadata = result.metadata || {};
      } catch (err) {
        // Ingestion failed but source is still stored
        metadata.ingestionError = err.message;
      }
    }

    await pool.query(
      `INSERT INTO sources (id, project_id, source_type, original_name, uri, extracted_text, metadata, content_hash, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sourceId, project_id, sourceType,
        req.file.originalname, req.file.path,
        extractedText,
        JSON.stringify(metadata), fileHash,
        extractedText ? "normalized" : "pending"
      ]
    );

    // Update project source count
    await pool.query(
      "UPDATE projects SET source_count = source_count + 1 WHERE id = ?",
      [project_id]
    );

    const [rows] = await pool.query("SELECT * FROM sources WHERE id = ?", [sourceId]);

    res.status(201).json({
      success: true,
      data: rows[0],
      message: extractedText
        ? "Source uploaded and text extracted"
        : "Source uploaded, text extraction pending"
    });
  } catch (err) {
    req.log.error(err, "Failed to upload source");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add URL source
router.post("/url", async (req, res) => {
  try {
    const { project_id, url } = req.body;
    if (!project_id || !url) {
      return res.status(400).json({ success: false, error: "project_id and url are required" });
    }

    const accountId = req.account?.id || req.apiKey?.account_id;

    const [projects] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ?",
      [project_id, accountId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const sourceId = uuidv4();
    const adapter = ingestionRegistry.get("url");
    let extractedText = "";
    let metadata = { url };

    if (adapter && adapter.processUrl) {
      const result = await adapter.processUrl(url);
      extractedText = result.text || "";
      metadata = { ...metadata, ...result.metadata };
    }

    await pool.query(
      `INSERT INTO sources (id, project_id, source_type, title, uri, extracted_text, metadata, status)
       VALUES (?, ?, 'url', ?, ?, ?, ?, ?)`,
      [
        sourceId, project_id,
        metadata.title || url,
        url,
        extractedText,
        JSON.stringify(metadata),
        extractedText ? "normalized" : "pending"
      ]
    );

    await pool.query(
      "UPDATE projects SET source_count = source_count + 1 WHERE id = ?",
      [project_id]
    );

    const [rows] = await pool.query("SELECT * FROM sources WHERE id = ?", [sourceId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    req.log.error(err, "Failed to add URL source");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add raw text source
router.post("/raw", async (req, res) => {
  try {
    const { project_id, text, title } = req.body;
    if (!project_id || !text) {
      return res.status(400).json({ success: false, error: "project_id and text are required" });
    }

    const accountId = req.account?.id || req.apiKey?.account_id;

    const [projects] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ?",
      [project_id, accountId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const sourceId = uuidv4();
    const adapter = ingestionRegistry.get("text");

    let extractedText = text;
    let metadata = {};

    if (adapter && adapter.processRaw) {
      const result = await adapter.processRaw(text);
      metadata = result.metadata || {};
    }

    await pool.query(
      `INSERT INTO sources (id, project_id, source_type, title, raw_text, extracted_text, metadata, status)
       VALUES (?, ?, 'raw_text', ?, ?, ?, ?, 'normalized')`,
      [
        sourceId, project_id,
        title || "Pasted Text",
        text,
        extractedText,
        JSON.stringify(metadata)
      ]
    );

    await pool.query(
      "UPDATE projects SET source_count = source_count + 1 WHERE id = ?",
      [project_id]
    );

    const [rows] = await pool.query("SELECT * FROM sources WHERE id = ?", [sourceId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    req.log.error(err, "Failed to add raw text source");
    res.status(500).json({ success: false, error: err.message });
  }
});

// List project sources
router.get("/project/:projectId", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [projects] = await pool.query(
      "SELECT id FROM projects WHERE id = ? AND account_id = ?",
      [req.params.projectId, accountId]
    );
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM sources WHERE project_id = ? ORDER BY created_at DESC",
      [req.params.projectId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    req.log.error(err, "Failed to list sources");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get source
router.get("/:id", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [rows] = await pool.query(
      `SELECT s.* FROM sources s
       JOIN projects p ON p.id = s.project_id
       WHERE s.id = ? AND p.account_id = ?`,
      [req.params.id, accountId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    req.log.error(err, "Failed to get source");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete source
router.delete("/:id", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [rows] = await pool.query(
      `SELECT s.* FROM sources s
       JOIN projects p ON p.id = s.project_id
       WHERE s.id = ? AND p.account_id = ?`,
      [req.params.id, accountId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }

    const source = rows[0];

    // Delete file if stored locally
    if (source.uri && !source.uri.startsWith("http")) {
      await fs.unlink(source.uri).catch(() => {});
    }

    await pool.query("DELETE FROM sources WHERE id = ?", [req.params.id]);
    await pool.query(
      "UPDATE projects SET source_count = GREATEST(source_count - 1, 0) WHERE id = ?",
      [source.project_id]
    );

    res.json({ success: true, deleted: true });
  } catch (err) {
    req.log.error(err, "Failed to delete source");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get source chunks
router.get("/:id/chunks", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    // Verify source belongs to account
    const [sourceCheck] = await pool.query(
      `SELECT s.id FROM sources s
       JOIN projects p ON p.id = s.project_id
       WHERE s.id = ? AND p.account_id = ?`,
      [req.params.id, accountId]
    );
    if (sourceCheck.length === 0) {
      return res.status(404).json({ success: false, error: "Source not found" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM source_chunks WHERE source_id = ? ORDER BY chunk_index ASC",
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    req.log.error(err, "Failed to get source chunks");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;