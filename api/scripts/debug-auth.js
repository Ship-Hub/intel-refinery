const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const db = mysql.createPool({
    host: "127.0.0.1", user: "root", password: "Baller101.",
    database: "intel_refinery", connectionLimit: 1
  });

  const rawKey = "refinery-test-a6329de321e9698636b64b87db742122";
  const keyPrefix = rawKey.slice(0, 16);
  console.log("Looking for prefix:", keyPrefix);

  try {
    const [keys] = await db.query(
      "SELECT k.*, a.id AS account_id FROM api_keys k JOIN accounts a ON a.id = k.account_id WHERE k.key_prefix = ? AND k.revoked_at IS NULL",
      [keyPrefix]
    );
    console.log("Keys found:", keys.length);

    for (const row of keys) {
      console.log("  id:", row.id, "hash:", row.api_key_hash?.substring(0, 20));
      const matches = await bcrypt.compare(rawKey, row.api_key_hash);
      console.log("  match:", matches);
    }

    if (keys.length === 0) {
      const [allKeys] = await db.query("SELECT id, key_prefix, revoked_at FROM api_keys");
      console.log("All keys in DB:", JSON.stringify(allKeys));
    }
  } catch (err) {
    console.error("ERROR:", err.message);
    console.error(err.stack);
  }

  await db.end();
})();