require("dotenv").config();

const express =
  require("express");

const cors =
  require("cors");

const path =
  require("path");

const fs =
  require("fs");

const env =
  require(
    "./src/config/env"
  );

const {
  validateStartup
} = require(
  "./src/config/validateStartup"
);

const {
  logger
} = require(
  "./src/logging/logger"
);

const {
  startRefinementWorker,
  stopRefinementWorker
} = require(
  "./src/refinery/refinementQueue"
);

const {
  requestId
} = require(
  "./src/middleware/requestId"
);

const {
  requestTimer
} = require(
  "./src/middleware/requestTimer"
);

const {
  apiRateLimiter
} = require(
  "./src/middleware/rateLimiter"
);

const {
  apiKeyAuth
} = require(
  "./src/middleware/apiKeyAuth"
);

const {
  errorHandler
} = require(
  "./src/middleware/errorHandler"
);

const {
  healthCheck
} = require(
  "./src/controllers/healthController"
);

const {
  apiDocs
} = require(
  "./src/controllers/docsController"
);

// ── Refinery Routes ────────────────────────────────────────────────────────

const projectRoutes =
  require(
    "./src/projects/routes/projectRoutes"
  );

const sourceRoutes =
  require(
    "./src/sources/routes/sourceRoutes"
  );

const artifactRoutes =
  require(
    "./src/refinery/routes/artifactRoutes"
  );

const connectionRoutes =
  require(
    "./src/refinery/routes/connectionRoutes"
  );

const modelRoutes =
  require(
    "./src/refinery/routes/modelRoutes"
  );

const viewRoutes =
  require(
    "./src/refinery/routes/viewRoutes"
  );

const refineRoutes =
  require(
    "./src/refinery/routes/refineRoutes"
  );

const authRoutes =
  require(
    "./src/auth/routes/authRoutes"
  );

const adminAccountRoutes =
  require(
    "./src/accounts/routes/adminAccountRoutes"
  );

const customerAccountRoutes =
  require(
    "./src/accounts/routes/customerAccountRoutes"
  );

const paymentRoutes =
  require(
    "./src/payments/routes/paymentRoutes"
  );

const adminPaymentRoutes =
  require(
    "./src/payments/routes/adminPaymentRoutes"
  );

const webhookRoutes =
  require(
    "./src/payments/routes/webhookRoutes"
  );

const customerPaymentRoutes =
  require(
    "./src/payments/routes/customerPaymentRoutes"
  );

const v1Routes =
  require(
    "./src/accounts/routes/v1Routes"
  );

const webhookRoutesV1 =
  require(
    "./src/accounts/routes/webhookRoutes"
  );

const adminAnalyticsRoutes =
  require(
    "./src/accounts/routes/adminAnalyticsRoutes"
  );

const app =
  express();

app.use(cors());

app.use(
  "/webhooks",
  express.raw({
    type:
      "application/json"
  }),
  webhookRoutes
);

app.use(express.json());

app.use(requestId);

app.use(requestTimer);

app.get(
  "/health",
  healthCheck
);

app.get(
  "/docs",
  apiDocs
);

// ── Frontend static serving ────────────────────────────────────────────────

const frontendDist = path.join(
  __dirname,
  "..",
  "frontend",
  "dist"
);
const hasFrontend = fs.existsSync(frontendDist);

if (hasFrontend) {
  app.use(express.static(frontendDist));

  const sendIndex = (req, res) =>
    res.sendFile(path.join(frontendDist, "index.html"));

  app.get("/", sendIndex);
  app.get("/console", sendIndex);
  app.get("/pricing", sendIndex);
  app.get("/developer", sendIndex);
} else {
  app.get(
    "/",
    (req, res) => {
      res.json({
        success: true,
        message: "Intel Refinery API running",
        requestId: req.requestId
      });
    }
  );
}

// ── Public routes ──────────────────────────────────────────────────────────

app.use("/auth", authRoutes);
app.use("/dashboard", customerAccountRoutes);
app.use("/dashboard", customerPaymentRoutes);
app.use("/admin", adminAccountRoutes);
app.use("/admin/payments", adminPaymentRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Refinery auth — accepts API key OR session token ───────────────────────

const { getSessionFromToken } = require("./src/auth/services/sessionService");
const { compareApiKey } = require("./src/utils/hashApiKey");
const dbRefinery = require("./src/config/db");

const refineryAuth = async (req, res, next) => {
  try {
    const rawKey = req.headers["x-api-key"];
    if (rawKey) {
      try {
        const keyPrefix = String(rawKey).slice(0, 16);
        const [keys] = await dbRefinery.promise().query(
          "SELECT k.id, k.account_id, k.api_key_hash FROM api_keys k JOIN accounts a ON a.id = k.account_id WHERE k.key_prefix = ? AND k.revoked_at IS NULL",
          [keyPrefix]
        );
        for (const row of keys) {
          if (await compareApiKey(rawKey, row.api_key_hash)) {
            req.account = { id: row.account_id };
            req.apiKey = { id: row.id, account_id: row.account_id };
            return next();
          }
        }
      } catch (err) {
        console.error("refineryAuth key error:", err.message);
      }
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      try {
        const session = await getSessionFromToken(token);
        if (session) {
          const [members] = await dbRefinery.promise().query(
            "SELECT account_id FROM account_members WHERE user_id = ? LIMIT 1",
            [session.userId]
          );
          if (members.length === 0) {
            return res.status(401).json({ success: false, error: "User has no account" });
          }
          req.account = { id: members[0].account_id };
          req.user = session;
          return next();
        }
      } catch (err) {
        // Fall through
      }
    }
  } catch (err) {
    console.error("refineryAuth fatal:", err.message);
    return res.status(500).json({ success: false, error: "Auth system error" });
  }

  return res.status(401).json({ success: false, error: "Authentication failed" });
};

// ── Refinery API Routes ────────────────────────────────────────────────────

app.use("/api/projects", refineryAuth, projectRoutes);
app.use("/api/sources", refineryAuth, sourceRoutes);
app.use("/api/projects", refineryAuth, refineRoutes);
app.use("/api/projects", refineryAuth, modelRoutes);
app.use("/api/projects", refineryAuth, artifactRoutes);
app.use("/api/projects", refineryAuth, connectionRoutes);
app.use("/api/projects", refineryAuth, viewRoutes);

app.use(apiRateLimiter);
app.use((req, res, next) => {
  if (req.path.startsWith("/api/v1")) return next();
  return apiKeyAuth(req, res, next);
});

// ── V1 Developer API ───────────────────────────────────────────────────────
// Authenticated via API key (x-api-key header) with per-key rate limiting
// Mounted under /api/v1 for all Developer Hub endpoints

const { perKeyRateLimiter } = require("./src/middleware/perKeyRateLimiter");
const { idempotency, idempotencyHandler } = require("./src/middleware/idempotency");

const v1ApiAuth = async (req, res, next) => {
  const rawKey = req.headers["x-api-key"];
  if (rawKey) {
    try {
      const keyPrefix = String(rawKey).slice(0, 16);
      const [keys] = await dbRefinery.promise().query(
        "SELECT k.id, k.account_id, k.api_key_hash, k.is_active FROM api_keys k WHERE k.key_prefix = ? AND k.revoked_at IS NULL LIMIT 10",
        [keyPrefix]
      );
      for (const row of keys) {
        if (row.is_active && await compareApiKey(rawKey, row.api_key_hash)) {
          req.account = { id: row.account_id };
          req.apiKey = { id: row.id, account_id: row.account_id };
          await dbRefinery.promise().query(
            "UPDATE api_keys SET requests_count = requests_count + 1, last_used_at = NOW() WHERE id = ?",
            [row.id]
          );
          return next();
        }
      }
    } catch (err) {
      req.log?.warn?.({ event: "v1_api_auth_error", error: err.message });
    }
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    try {
      const session = await getSessionFromToken(token);
      if (session) {
        req.account = { id: session.account_id };
        req.user = session;
        return next();
      }
    } catch (err) {
      req.log?.warn?.({ event: "v1_session_auth_error", error: err.message });
    }
  }

  return res.status(401).json({ success: false, error: "Authentication failed" });
};

app.use("/api/v1", requestId, requestTimer, v1ApiAuth, perKeyRateLimiter({ max: 60, windowMs: 60000 }), idempotency, v1Routes);

// ── Webhook Management API (under dashboard, session-protected) ────────────

const { sessionAuth } = require("./src/middleware/sessionAuth");
const webhookSessionAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey) {
    return v1ApiAuth(req, res, next);
  }
  return sessionAuth(req, res, next);
};

app.use("/dashboard/webhooks", webhookSessionAuth, webhookRoutesV1);

// ── Admin Analytics ────────────────────────────────────────────────────────

app.use("/admin/analytics", adminAnalyticsRoutes);

// ── Legacy API Routes ──────────────────────────────────────────────────────

app.use("/api/payments", paymentRoutes);

app.use(errorHandler);

let serverInstance =
  null;

let shuttingDown =
  false;

const gracefulShutdown =
  (
    signal
  ) => {

    if (
      shuttingDown
    ) {

      return;

    }

    shuttingDown =
      true;

    logger.info({

      event:
        "shutdown_signal",

      signal

    });

    stopRefinementWorker();

    if (
      !serverInstance
    ) {

      process.exit(
        0
      );

      return;

    }

    serverInstance.close(
      () => {

        logger.info({

          event:
            "http_server_closed"

        });

        process.exit(
          0
        );

      }
    );

    setTimeout(
      () => {

        logger.warn({

          event:
            "shutdown_timeout_forcing_exit"

        });

        process.exit(
          1
        );

      },

      15000
    );

  };

const boot =
  async () => {

    await validateStartup();

    serverInstance =
      app.listen(
        env.PORT,
        () => {

          logger.info({

            event:
              "http_server_listen",

            port:
              env.PORT,

            nodeEnv:
              env.NODE_ENV

          });

        }
      );

    startRefinementWorker();

    process.on(
      "SIGTERM",
      () =>
        gracefulShutdown(
          "SIGTERM"
        )
    );

    process.on(
      "SIGINT",
      () =>
        gracefulShutdown(
          "SIGINT"
        )
    );

  };

boot()
  .catch(
    (error) => {

      logger.fatal({

        event:
          "server_boot_failed",

        error:
          error.message

      });

      process.exit(
        1
      );

    }
  );
