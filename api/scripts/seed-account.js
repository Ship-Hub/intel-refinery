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

  // Get the test account
  const [accounts] = await conn.query("SELECT id FROM accounts LIMIT 1");
  let accountId;
  if (accounts.length === 0) {
    accountId = uuidv4();
    await conn.query("INSERT INTO accounts (id, organization_name) VALUES (?, ?)", [accountId, "Refinery Test"]);
    console.log("Created new account:", accountId);
  } else {
    accountId = accounts[0].id;
    console.log("Using existing account:", accountId);
  }

  // Generate API key
  const rawKey = "refinery-test-" + crypto.randomBytes(16).toString("hex");
  const keyPrefix = rawKey.slice(0, 16);
  const hash = await bcrypt.hash(rawKey, 10);

  await conn.query(
    "INSERT INTO api_keys (id, account_id, name, api_key_hash, key_prefix, label) VALUES (?, ?, ?, ?, ?, ?)",
    [uuidv4(), accountId, "Refinery Test Key", hash, keyPrefix, "Test Key"]
  );

  console.log("\n=== SAVE THIS API KEY ===\n");
  console.log(rawKey);
  console.log("\n=========================\n");

  await conn.end();
})().catch((e) => console.error(e.message));