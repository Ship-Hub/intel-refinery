const db =
  require("../../config/db");

const recordAdminAudit =
  async ({
    actorType =
      "platform_token",
    actorUserId =
      null,
    action,
    targetType,
    targetId =
      null,
    metadata =
      null
  }) => {
    await db.promise()
      .query(
        `
        INSERT INTO admin_audit_logs (
          actor_type,
          actor_user_id,
          action,
          target_type,
          target_id,
          metadata
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          actorType,
          actorUserId,
          action,
          targetType,
          targetId,
          metadata
            ? JSON.stringify(
                metadata
              )
            : null
        ]
      );
  };

const listAdminAuditLogs =
  async ({
    limit =
      100
  } = {}) => {
    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            id,
            actor_type AS actorType,
            actor_user_id AS actorUserId,
            action,
            target_type AS targetType,
            target_id AS targetId,
            metadata,
            created_at AS createdAt
          FROM admin_audit_logs
          ORDER BY created_at DESC
          LIMIT ?
          `,
          [
            limit
          ]
        );

    return rows;
  };

module.exports = {
  recordAdminAudit,
  listAdminAuditLogs
};
