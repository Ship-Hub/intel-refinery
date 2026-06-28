const db =
  require("../config/db");

const {
  compareApiKey
} = require(
  "../utils/hashApiKey"
);

const {
  childFromRequest
} = require(
  "../logging/logger"
);

const apiKeyAuth =
  async (
    req,
    res,
    next
  ) => {

    try {

      const apiKey =
        req.headers[
          "x-api-key"
        ];

      if (
        !apiKey
      ) {

        childFromRequest(
          req
        ).warn({

          event:
            "api_key_missing"

        });

        return res.status(401)
          .json({

            success: false,

            error:
              "API key missing"

          });

      }

      const keyPrefix =
        String(
          apiKey
        ).slice(
          0,
          16
        );
      const [keys] =
        await db.promise()
          .query(
            `
            SELECT *
            FROM api_keys
            WHERE
              is_active = TRUE
              AND (
                key_prefix = ?
                OR key_prefix IS NULL
              )
            `
            ,
            [
              keyPrefix
            ]
          );

      let matchedKey =
        null;

      for (
        const keyRecord
        of keys
      ) {

        const valid =
          await compareApiKey(

            apiKey,

            keyRecord.api_key_hash
          );

        if (valid) {

          matchedKey =
            keyRecord;

          break;

        }

      }

      if (!matchedKey) {

        childFromRequest(
          req
        ).warn({

          event:
            "api_key_invalid"

        });

        return res.status(403)
          .json({

            success: false,

            error:
              "Invalid API key"

          });

      }

      await db.promise()
        .query(
          `
          UPDATE api_keys
          SET
            requests_count = requests_count + 1,
            last_used_at = NOW()
          WHERE id = ?
          `,
          [
            matchedKey.id
          ]
        );

      req.apiClient =
        matchedKey;
      req.accountId =
        matchedKey.account_id ||
        null;

      next();

    } catch (error) {

      childFromRequest(
        req
      ).warn({

        event:
          "api_key_auth_error",

        error:
          error.message

      });

      return res.status(500)
        .json({

          success: false,

          error:
            "Authentication failed"

          });

    }

};

module.exports = {
  apiKeyAuth
};
