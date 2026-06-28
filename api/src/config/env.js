const {
  cleanEnv,
  str,
  port,
  num
} = require("envalid");

const env =
  cleanEnv(
    process.env,

    {

      NODE_ENV:
        str({

          choices: [
            "development",
            "production",
            "test"
          ],

          default:
            "development"

        }),

      LOG_LEVEL:
        str({

          default:
            "info"

        }),

      PORT:
        port({
          default: 5000
        }),

      DB_HOST:
        str({
          default:
            "127.0.0.1"
        }),

      DB_PORT:
        port({
          default:
            3306
        }),

      DB_USER:
        str({
          default:
            "root"
        }),

      DB_PASSWORD:
        str({
          default:
            ""
        }),

      DB_NAME:
        str({
          default:
            "intel_refinery"
        }),

      OPENROUTER_API_KEY:
        str({
          default:
            ""
        }),

      OPENROUTER_TIMEOUT_MS:
        num({
          default:
            120000
        }),

      GEMINI_API_KEY:
        str({
          default:
            ""
        }),

      GEMINI_MODEL:
        str({
          default:
            "gemini-2.5-flash"
        }),

      GEMINI_FALLBACK_MODEL:
        str({
          default:
            ""
        }),

      GROQ_API_KEY:
        str({
          default:
            ""
        }),

      GROQ_MODEL:
        str({
          default:
            "llama-3.3-70b-versatile"
        }),

      AI_PROVIDER:
        str({

          choices: [
            "gemini",
            "ollama",
            "groq"
          ],

          default:
            "gemini"

        }),

      AI_FALLBACK_PROVIDER:
        str({

          default:
            ""

        }),

      AI_PROVIDER_TIMEOUT_MS:
        num({

          default:
            120000

        }),

      AI_MAX_PROVIDER_ATTEMPTS:
        num({

          default:
            2

        }),

      OLLAMA_MODEL:
        str({

          default:
            "qwen2.5:14b"

        }),
      GOOGLE_SEARCH_API_KEY:
        str({
          default:
            ""
        }),
      GOOGLE_SEARCH_ENGINE_ID:
        str({
          default:
            ""
        }),
      TAVILY_API_KEY:
        str({
          default:
            ""
        }),
      ETHERSCAN_API_KEY:
        str({
          default:
            ""
        }),
      WEB3_EXPLORER_TIMEOUT_MS:
        num({
          default:
            20000
        }),
      RETRIEVAL_TIMEOUT_MS:
        num({
          default:
            10000
        }),

      TELEGRAM_API_ID:
        str({
          default: ""
        }),

      TELEGRAM_API_HASH:
        str({
          default: ""
        }),

      TELEGRAM_SESSION:
        str({
          default: ""
        }),

      PLATFORM_ADMIN_TOKEN:
        str({
          default:
            ""
        }),

      GOOGLE_CLIENT_ID:
        str({
          default:
            ""
        }),

      GITHUB_CLIENT_ID:
        str({
          default:
            ""
        }),

      GITHUB_CLIENT_SECRET:
        str({
          default:
            ""
        }),

      GITLAB_CLIENT_ID:
        str({
          default:
            ""
        }),

      GITLAB_CLIENT_SECRET:
        str({
          default:
            ""
        }),

      // Public URL of the frontend (used for OAuth redirect-back URLs).
      // Defaults to the same origin as the API when not set.
      FRONTEND_BASE_URL:
        str({
          default:
            ""
        }),

      AUTH_FRONTEND_BASE_URL:
        str({
          default:
            ""
        }),

      STRIPE_SECRET_KEY:
        str({
          default:
            ""
        }),

      STRIPE_WEBHOOK_SECRET:
        str({
          default:
            ""
        }),

      PAYSTACK_SECRET_KEY:
        str({
          default:
            ""
        }),

      PAYSTACK_WEBHOOK_SECRET:
        str({
          default:
            ""
        }),

      COINBASE_COMMERCE_API_KEY:
        str({
          default:
            ""
        }),

      COINBASE_COMMERCE_WEBHOOK_SECRET:
        str({
          default:
            ""
        }),

      V1_RATE_LIMIT_WINDOW_MS:
        num({
          default:
            60000
        }),

      V1_RATE_LIMIT_MAX:
        num({
          default:
            60
        }),

      V1_RATE_LIMIT_PER_KEY_WINDOW_MS:
        num({
          default:
            60000
        }),

      V1_RATE_LIMIT_PER_KEY_MAX:
        num({
          default:
            60
        }),

      WEBHOOK_RETRY_INTERVAL_SECONDS:
        num({
          default:
            60
        }),

      WEBHOOK_MAX_RETRIES:
        num({
          default:
            3
        }),

      WEBHOOK_CONCURRENCY:
        num({
          default:
            5
        }),

      REQUEST_LOG_RETENTION_DAYS:
        num({
          default:
            90
        }),

      IDEMPOTENCY_TTL_HOURS:
        num({
          default:
            24
        })

    }
  );

module.exports =
  env;
