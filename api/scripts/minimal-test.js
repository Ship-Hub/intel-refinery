// Minimal test to isolate refinery auth + routes
require("dotenv").config();
const express = require("express");
const db = require("./src/config/db");
const { compareApiKey } = require("./src/utils/hashApiKey");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// Minimal refinery auth
app.use("/api/projects", async (req, res, next) => {
  try {
    const rawKey = req.headers["x-api-key"];
    if (!rawKey) {
      return res.status(401).json({ error: "No API key" });
    }
    const keyPrefix = String(rawKey).slice(0, 16);
    const [keys] = await db.promise().query(
      "SELECT id, account_id, api_key_hash FROM api_keys WHERE key_prefix = ? AND revoked_at IS NULL",
      [keyPrefix]
    );
    for (const row of keys) {
      if (await compareApiKey(rawKey, row.api_key_hash)) {
        req.account = { id: row.account_id };
        req.apiKey = { id: row.id, account_id: row.account_id };
        console.log("AUTH OK: account=" + row.account_id);
        return next();
      }
    }
    console.log("AUTH FAIL: key not matched");
    return res.status(401).json({ error: "Key not matched" });
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Minimal project route
app.get("/api/projects", async (req, res) => {
  try {
    const accountId = req.account.id;
    const [rows] = await db.promise().query(
      "SELECT * FROM projects WHERE account_id = ?",
      [accountId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { title } = req.body;
    const id = uuidv4();
    const accountId = req.account.id;
    await db.promise().query(
      "INSERT INTO projects (id, account_id, title) VALUES (?, ?, ?)",
      [id, accountId, title]
    );
    const [rows] = await db.promise().query("SELECT * FROM projects WHERE id = ?", [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5002, () => console.log("Minimal test server on 5002"));