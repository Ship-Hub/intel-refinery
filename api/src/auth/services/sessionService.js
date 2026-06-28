const crypto =
  require("crypto");
const db =
  require("../../config/db");
const {
  hashApiKey
} = require(
  "../../utils/hashApiKey"
);

const createUserSession =
  async ({
    userId,
    ttlDays =
      30
  }) => {
    const token =
      `sess_${crypto.randomBytes(
        32
      ).toString(
        "hex"
      )}`;
    const tokenHash =
      await hashApiKey(
        token
      );
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO user_sessions (
            user_id,
            session_token_hash,
            expires_at
          )
          VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))
          `,
          [
            userId,
            tokenHash,
            ttlDays
          ]
        );

    return {
      id:
        result.insertId,
      token,
      expiresInDays:
        ttlDays
    };
  };

const getSessionFromToken =
  async (
    token
  ) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            s.id,
            s.user_id AS userId,
            s.session_token_hash AS sessionTokenHash,
            s.expires_at AS expiresAt,
            s.revoked_at AS revokedAt,
            u.email,
            u.display_name AS displayName,
            u.platform_role AS platformRole,
            u.status
          FROM user_sessions s
          JOIN users u
            ON u.id = s.user_id
          WHERE
            s.expires_at > NOW()
            AND s.revoked_at IS NULL
          ORDER BY s.created_at DESC
          `
        );

    for (
      const row of rows
    ) {
      if (
        await require(
          "../../utils/hashApiKey"
        ).compareApiKey(
          token,
          row.sessionTokenHash
        )
      ) {
        await db.promise()
          .query(
            `
            UPDATE user_sessions
            SET last_used_at = NOW()
            WHERE id = ?
            `,
            [
              row.id
            ]
          );

        return row;
      }
    }

    return null;
  };

const revokeUserSession =
  async (
    sessionId
  ) => {
    await db.promise()
      .query(
        `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE id = ?
        `,
        [
          sessionId
        ]
      );
  };

module.exports = {
  createUserSession,
  getSessionFromToken,
  revokeUserSession
};
