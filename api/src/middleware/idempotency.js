const { getIdempotentResponse, storeIdempotentResponse } = require("../accounts/services/idempotencyService");

const IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const idempotency = (req, res, next) => {
  if (!IDEMPOTENT_METHODS.has(req.method)) return next();
  const key = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
  if (!key) return next();
  req.idempotencyKey = String(key).trim();
  next();
};

const idempotencyHandler = async (req, res, next) => {
  if (!req.idempotencyKey) return next();
  try {
    const cached = await getIdempotentResponse(req.idempotencyKey);
    if (cached) {
      return res.status(cached.statusCode).json(cached.body);
    }
    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      const statusCode = res.statusCode;
      await storeIdempotentResponse({
        idempotencyKey: req.idempotencyKey,
        accountId: req.account?.id || null,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        body,
      });
      return originalJson(body);
    };
    next();
  } catch (err) {
    req.log?.warn?.({ event: "idempotency_error", error: err.message });
    next();
  }
};

module.exports = { idempotency, idempotencyHandler };
