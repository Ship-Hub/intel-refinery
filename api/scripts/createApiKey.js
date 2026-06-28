require("dotenv").config();

const db =
  require("../src/config/db");

const {
  generateApiKey
} = require(
  "../src/utils/generateApiKey"
);

const {
  hashApiKey
} = require(
  "../src/utils/hashApiKey"
);

const createApiKey =
  async () => {

    const rawKey =
      generateApiKey();

    const hashedKey =
      await hashApiKey(
        rawKey
      );

    const name =
      process.argv[2] ||
      "Default Client";

    await db.promise()
      .query(
        `
        INSERT INTO api_keys
        (
          name,
          api_key_hash
        )
        VALUES (?, ?)
        `,
        [
          name,
          hashedKey
        ]
      );

    console.log(
      "\nAPI KEY CREATED:\n"
    );

    console.log(rawKey);

    process.exit(0);

};

createApiKey();