const db =
  require("../../config/db");

const recordWebhookEvent =
  async ({
    providerCode,
    providerEventId,
    eventType,
    payload
  }) => {
    try {
      const [result] =
        await db.promise()
          .query(
            `
            INSERT INTO webhook_events (
              provider_code,
              provider_event_id,
              event_type,
              payload
            )
            VALUES (?, ?, ?, ?)
            `,
            [
              providerCode,
              providerEventId,
              eventType,
              JSON.stringify(
                payload
              )
            ]
          );

      return {
        id:
          result.insertId,
        duplicate:
          false
      };
    } catch (error) {
      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {
        return {
          id:
            null,
          duplicate:
            true
        };
      }

      throw error;
    }
  };

const markWebhookProcessed =
  async ({
    providerCode,
    providerEventId,
    processingError =
      null
  }) => {
    await db.promise()
      .query(
        `
        UPDATE webhook_events
        SET
          processed_at = NOW(),
          processing_error = ?
        WHERE
          provider_code = ?
          AND provider_event_id = ?
        `,
        [
          processingError,
          providerCode,
          providerEventId
        ]
      );
  };

const listWebhookEvents =
  async ({
    providerCode =
      null,
    limit =
      100
  } = {}) => {
    const params =
      [];
    let whereClause =
      "";

    if (
      providerCode
    ) {
      whereClause =
        "WHERE provider_code = ?";
      params.push(
        providerCode
      );
    }
    params.push(
      limit
    );

    const [rows] =
      await db.promise()
        .query(
          `
          SELECT
            id,
            provider_code AS providerCode,
            provider_event_id AS providerEventId,
            event_type AS eventType,
            processed_at AS processedAt,
            processing_error AS processingError,
            created_at AS createdAt
          FROM webhook_events
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ?
          `,
          params
        );

    return rows;
  };

module.exports = {
  recordWebhookEvent,
  markWebhookProcessed,
  listWebhookEvents
};
