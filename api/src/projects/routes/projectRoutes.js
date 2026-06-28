// Refinery Project Routes
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("../../config/db").promise();
const router = express.Router();

// Create project
router.post("/", async (req, res) => {
  try {
    const { title: titleFromBody, name, description, workspace_id, guidance_prompt, mode } = req.body;
    const title = titleFromBody || name;
    if (!title) {
      return res.status(400).json({ success: false, error: "Project title is required" });
    }
    const accountId = req.account?.id || req.apiKey?.account_id;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO projects (id, account_id, workspace_id, title, description, guidance_prompt, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, accountId, workspace_id || null, title, description || null, guidance_prompt || null, mode || "quick"]
    );

    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    req.log.error(err, "Failed to create project");
    res.status(500).json({ success: false, error: err.message });
  }
});

// List projects
router.get("/", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const { status, limit, offset } = req.query;

    let query = "SELECT * FROM projects WHERE account_id = ?";
    const params = [accountId];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY updated_at DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit, 10));
    }
    if (offset) {
      query += " OFFSET ?";
      params.push(parseInt(offset, 10));
    }

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    req.log.error(err, "Failed to list projects");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get project
router.get("/:id", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [rows] = await pool.query(
      "SELECT * FROM projects WHERE id = ? AND account_id = ?",
      [req.params.id, accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    req.log.error(err, "Failed to get project");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update project
router.put("/:id", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const { title, description, status } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (status !== undefined) { updates.push("status = ?"); params.push(status); }

    if (updates.length === 0) {
      return res.json({ success: true, message: "No fields to update" });
    }

    params.push(req.params.id, accountId);
    await pool.query(
      `UPDATE projects SET ${updates.join(", ")} WHERE id = ? AND account_id = ?`,
      params
    );

    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    req.log.error(err, "Failed to update project");
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const accountId = req.account?.id || req.apiKey?.account_id;
    const [result] = await pool.query(
      "DELETE FROM projects WHERE id = ? AND account_id = ?",
      [req.params.id, accountId]
    );
    res.json({ success: true, deleted: result.affectedRows > 0 });
  } catch (err) {
    req.log.error(err, "Failed to delete project");
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;