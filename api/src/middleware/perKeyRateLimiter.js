const db = require("../config/db");

const KEY_PREFIX = "intel_refinery_rate";

const perKeyRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 60;
  const keyPrefix = options.keyPrefix || KEY_PREFIX;

  return async (req, res, next) => {
    const accountId = req.account?.id || req.accountId || "anon";
    const apiKeyId = req.apiKey?.id || req.apiClient?.id || "none";
    const bucketKey = `${keyPrefix}:${apiKeyId}:${accountId}`;
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

    try {
      const [rows] = await db.promise().query(
        `SELECT count, max FROM rate_limiting_buckets
         WHERE bucket_key = ? AND window_start = ?
         LIMIT 1`,
        [bucketKey, windowStart]
      );

      const currentCount = rows.length > 0 ? rows[0].count : 0;
      const bucketMax = rows.length > 0 ? rows[0].max : max;
      const remaining = Math.max(0, bucketMax - currentCount);

      res.setHeader("X-RateLimit-Limit", bucketMax);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Math.floor(windowStart.getTime() / 1000 + windowMs / 1000));

      if (currentCount >= bucketMax) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded. Try again later.",
          meta: { retryAfter: Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000) }
        });
      }

      if (rows.length === 0) {
        await db.promise().query(
          `INSERT INTO rate_limiting_buckets (id, bucket_key, window_start, window_ms, count, max)
           VALUES (UUID(), ?, ?, ?, 1, ?)`,
          [bucketKey, windowStart, windowMs, max]
        );
      } else {
        await db.promise().query(
          `UPDATE rate_limiting_buckets SET count = count + 1 WHERE bucket_key = ? AND window_start = ?`,
          [bucketKey, windowStart]
        );
      }

      next();
    } catch (err) {
      req.log?.warn?.({ event: "rate_limiter_error", error: err.message });
      next();
    }
  };
};

module.exports = { perKeyRateLimiter };
