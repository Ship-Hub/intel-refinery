require("dotenv").config();
const mysql = require("mysql2");
const env = require("../src/config/env");
const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});
const p = pool.promise();

(async () => {
  const [tables] = await p.query("SHOW TABLES");
  console.log("Tables:", tables.map((t) => Object.values(t)[0]).join(", "));

  const [obsCols] = await p.query("SHOW COLUMNS FROM observations");
  console.log("\nobservations columns:");
  obsCols.forEach((c) =>
    console.log(
      `  ${c.Field} (${c.Type}) ${c.Null === "YES" ? "NULL" : "NOT NULL"} ${
        c.Default !== null ? "default=" + c.Default : ""
      }`
    )
  );

  const [entCols] = await p.query("SHOW COLUMNS FROM entities");
  console.log("\nentities columns:");
  entCols.forEach((c) =>
    console.log(`  ${c.Field} (${c.Type}) ${c.Null === "YES" ? "NULL" : "NOT NULL"}`)
  );

  pool.end();
})();
