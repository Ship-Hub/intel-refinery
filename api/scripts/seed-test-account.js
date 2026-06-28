const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

(async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "Baller101.",
    database: "intel_refinery"
  });

  // Check if accounts table has required schema
  const [cols] = await conn.query("DESCRIBE accounts");
  console.log("Accounts columns:", cols.map((c) => c.Field).join(", "));

  // Create account
  const accountId = uuidv4();
  const columns = cols.map((c) => c.Field);
  const hasOrgName = columns.includes("organization_name");

  if (hasOrgName) {
    await conn.query(
      "INSERT INTO accounts (id, organization_name) VALUES (?, ?)",
      [accountId, "Test User"]
    );
  } else {
    await conn.query(
      "INSERT INTO accounts (id) VALUES (?)",
      [accountId]
    );
  }
  console.log("Account created:", accountId);

  // Create API key
  const apiKeyId = uuidv4();
  const rawKey = "refinery-test-" + crypto.randomBytes(16).toString("hex");
  const keyPrefix = rawKey.slice(0, 16);
  const hash = await bcrypt.hash(rawKey, 10);

  const [keyCols] = await conn.query("DESCRIBE api_keys");
  const keyColumns = keyCols.map((c) => c.Field);

  if (keyColumns.includes("label")) {
    await conn.query(
      "INSERT INTO api_keys (id, account_id, name, api_key_hash, key_prefix, label) VALUES (?, ?, ?, ?, ?, ?)",
      [apiKeyId, accountId, "Refinery Test Key", hash, keyPrefix, "Test Key"]
    );
  } else {
    await conn.query(
      "INSERT INTO api_keys (id, account_id, name, api_key_hash, key_prefix) VALUES (?, ?, ?, ?, ?)",
      [apiKeyId, accountId, "Refinery Test Key", hash, keyPrefix]
    );
  }
  console.log("API Key:", rawKey);
  console.log("Key ID:", apiKeyId);

  await conn.end();
  console.log("Seed complete.");
})().catch((e) => console.error(e.message));