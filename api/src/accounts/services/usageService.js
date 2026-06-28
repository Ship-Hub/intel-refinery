const db =
  require("../../config/db");

const recordUsageEvent =
  async ({
    accountId,
    apiKeyId =
      null,
    featureType,
    creditsCharged =
      0,
    provider =
      null,
    model =
      null,
    inputTokens =
      null,
    outputTokens =
      null,
    audioSeconds =
      null,
    imageCount =
      null,
    retrievalProvider =
      null,
    metadata =
      null
  }) => {
    const [result] =
      await db.promise()
        .query(
          `
          INSERT INTO usage_events (
            account_id,
            api_key_id,
            feature_type,
            credits_charged,
            provider,
            model,
            input_tokens,
            output_tokens,
            audio_seconds,
            image_count,
            retrieval_provider,
            metadata
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            accountId,
            apiKeyId,
            featureType,
            creditsCharged,
            provider,
            model,
            inputTokens,
            outputTokens,
            audioSeconds,
            imageCount,
            retrievalProvider,
            metadata
              ? JSON.stringify(
                  metadata
                )
              : null
          ]
        );

    return {
      id:
        result.insertId
    };
  };

const listUsageEvents =
  async ({
    accountId,
    limit =
      100
  } = {}) => {
    const params =
      [];
    let whereClause =
      "";

    if (
      accountId
    ) {
      whereClause =
        "WHERE account_id = ?";
      params.push(
        accountId
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
            account_id AS accountId,
            api_key_id AS apiKeyId,
            feature_type AS featureType,
            credits_charged AS creditsCharged,
            provider,
            model,
            input_tokens AS inputTokens,
            output_tokens AS outputTokens,
            audio_seconds AS audioSeconds,
            image_count AS imageCount,
            retrieval_provider AS retrievalProvider,
            created_at AS createdAt
          FROM usage_events
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ?
          `,
          params
        );

    return rows;
  };

module.exports = {
  recordUsageEvent,
  listUsageEvents
};
