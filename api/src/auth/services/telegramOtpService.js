const crypto =
  require("crypto");
const db =
  require("../../config/db");
const {
  hashApiKey,
  compareApiKey
} = require(
  "../../utils/hashApiKey"
);

const generateOtp =
  () =>
    String(
      crypto.randomInt(
        0,
        1000000
      )
    ).padStart(
      6,
      "0"
    );

const createTelegramOtp =
  async ({
    telegramUserId,
    displayName =
      null,
    username =
      null,
    ttlMinutes =
      5
  }) => {
    const code =
      generateOtp();
    const codeHash =
      await hashApiKey(
        code
      );

    await db.promise()
      .query(
        `
        INSERT INTO login_otps (
          provider,
          provider_user_id,
          code_hash,
          expires_at,
          metadata
        )
        VALUES ('telegram', ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)
        `,
        [
          telegramUserId,
          codeHash,
          ttlMinutes,
          JSON.stringify({
            displayName,
            username
          })
        ]
      );

    return {
      code,
      expiresInMinutes:
        ttlMinutes
    };
  };

const verifyTelegramOtp =
  async ({
    code
  }) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT *
          FROM login_otps
          WHERE
            provider = 'telegram'
            AND used_at IS NULL
            AND expires_at > NOW()
          ORDER BY created_at DESC
          LIMIT 50
          `
        );

    for (
      const row
      of rows
    ) {
      if (
        await compareApiKey(
          code,
          row.code_hash
        )
      ) {
        await db.promise()
          .query(
            `
            UPDATE login_otps
            SET used_at = NOW()
            WHERE id = ?
            `,
            [
              row.id
            ]
          );

        return {
          valid:
            true,
          telegramUserId:
            row.provider_user_id,
          metadata:
            row.metadata
              ? typeof row.metadata ===
                "string"
                ? JSON.parse(
                    row.metadata
                  )
                : row.metadata
              : {}
        };
      }
    }

    return {
      valid:
        false
    };
  };

module.exports = {
  createTelegramOtp,
  verifyTelegramOtp
};
