const crypto =
  require("crypto");
const db =
  require("../../config/db");
const {
  hashApiKey
} = require(
  "../../utils/hashApiKey"
);

const generateRawApiKey =
  () =>
    `intel_live_${crypto.randomBytes(
      24
    ).toString(
      "hex"
    )}`;

const createApiKey =
  async ({
    accountId,
    label,
    createdByUserId =
      null,
    dailyCreditLimit =
      null
  }) => {
    const rawKey =
      generateRawApiKey();
    const keyHash =
      await hashApiKey(
        rawKey
      );
    const keyPrefix =
      rawKey.slice(
        0,
        16
      );
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO api_keys (
            account_id,
            name,
            label,
            key_prefix,
            api_key_hash,
            created_by_user_id,
            daily_credit_limit,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
          `,
          [
            accountId,
            label,
            label,
            keyPrefix,
            keyHash,
            createdByUserId,
            dailyCreditLimit
          ]
        );

    return {
      id:
        result.insertId,
      rawKey,
      keyPrefix,
      label
    };
  };

const listApiKeys =
  async (
    accountId
  ) => {
    const params =
      [];
    let whereClause =
      "";

    if (
      accountId
    ) {
      whereClause =
        "WHERE k.account_id = ?";
      params.push(
        accountId
      );
    }

    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            k.id,
            k.account_id AS accountId,
            a.name AS accountName,
            k.label,
            k.key_prefix AS keyPrefix,
            k.is_active AS isActive,
            k.requests_count AS requestsCount,
            k.last_used_at AS lastUsedAt,
            k.created_at AS createdAt,
            k.revoked_at AS revokedAt,
            k.daily_credit_limit AS dailyCreditLimit,
            COALESCE((
              SELECT SUM(ue.credits_charged)
              FROM usage_events ue
              WHERE ue.api_key_id = k.id
            ), 0) AS creditsUsed
          FROM api_keys k
          LEFT JOIN accounts a
            ON a.id = k.account_id
          ${whereClause}
          ORDER BY k.created_at DESC
          `,
          params
        );

    return rows;
  };

const revokeApiKey =
  async ({
    apiKeyId,
    accountId =
      null
  }) => {
    const [result] =
      await db.promise()
        .query(
        `
        UPDATE api_keys
        SET
          is_active = FALSE,
          revoked_at = NOW()
        WHERE
          id = ?
          ${accountId
            ? "AND account_id = ?"
            : ""}
        `,
        accountId
          ? [
              apiKeyId,
              accountId
            ]
          : [
              apiKeyId
            ]
      );

    return result.affectedRows >
      0;
  };

const deleteApiKey =
  async ({
    apiKeyId,
    accountId =
      null
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          DELETE FROM api_keys
          WHERE
            id = ?
            ${accountId
              ? "AND account_id = ?"
              : ""}
          `,
          accountId
            ? [
                apiKeyId,
                accountId
              ]
            : [
                apiKeyId
              ]
        );

    return result.affectedRows >
      0;
  };

module.exports = {
  generateRawApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey
};
