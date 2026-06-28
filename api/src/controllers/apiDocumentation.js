const buildApiDocumentation =
  () => ({
    success: true,
    api:
      "Intel Engine API",
    version:
      "1.2.0",
    environment: {
      nodeEnv:
        "Set NODE_ENV to development | production | test",
      logging:
        "Structured JSON logs via pino; set LOG_LEVEL (trace|debug|info|warn|error|fatal)"
    },
    authentication: {
      type:
        "API Key",
      header:
        "x-api-key",
      publicEndpoints: [
        "GET /health",
        "GET /docs",
        "GET /",
        "POST /auth/telegram/verify-otp",
        "POST /auth/google",
        "GET /dashboard/account",
        "GET /dashboard/api-keys",
        "POST /dashboard/api-keys",
        "POST /dashboard/api-keys/:apiKeyId/revoke",
        "DELETE /dashboard/api-keys/:apiKeyId",
        "GET /dashboard/usage",
        "GET /dashboard/payments",
        "POST /dashboard/checkout",
        "POST /webhooks/stripe",
        "POST /webhooks/paystack",
        "POST /webhooks/coinbase-commerce"
      ],
      notes: [
        "All /api routes require x-api-key.",
        "All /api/admin routes additionally require x-admin-token.",
        "Telegram OTP issuance is internal-only; the bot should request codes, while the website verifies codes.",
        "Dashboard sessions use opaque bearer or x-session-token values returned by auth endpoints.",
        "Keys are stored hashed; plaintext keys are never logged.",
        "Never embed API keys in client-side code or public repos."
      ]
    },
    aiProviders: {
      supported:
        [
          "groq",
          "gemini",
          "ollama"
        ],
      configuration:
        "AI_PROVIDER=groq|gemini|ollama; optional AI_FALLBACK_PROVIDER may be another supported provider.",
      notes: [
        "Groq supports fast text generation, vision analysis, and Whisper transcription in the current integration.",
        "Provider attempts are bounded by AI_MAX_PROVIDER_ATTEMPTS and AI_PROVIDER_TIMEOUT_MS."
      ]
    },
    limits: {
      maxMessagesPerIngestRequest:
        500,
      maxMessageLength:
        5000,
      mediaUploadMaxBytes:
        5000000,
      audioMaxSeconds:
        600,
      ocrUploadMaxBytes:
        "Route multer cap is 10 MiB; generic upload validation is 5 MB.",
      conversationAnalysisContext:
        "Server-side caps apply to prompt size, per-message text length, and message count before model calls."
    },
    workflows: {
      conversationAnalysis: [
        "POST /api/conversations/ingest",
        "POST /api/conversations/analyze",
        "GET /api/conversations/analysis/:sessionId"
      ],
      media: [
        "POST /api/media/image for OCR plus visual interpretation",
        "POST /api/media/audio for transcription plus analysis",
        "POST /api/ocr when OCR-only extraction is desired"
      ]
    },
    endpoints: [
      {
        method:
          "GET",
        path:
          "/health",
        auth:
          "public",
        description:
          "Liveness probe."
      },
      {
        method:
          "GET",
        path:
          "/docs",
        auth:
          "public",
        description:
          "Machine-readable API documentation."
      },
      {
        method:
          "GET",
        path:
          "/",
        auth:
          "public",
        description:
          "Basic service banner."
      },
      {
        method:
          "POST",
        path:
          "/auth/google",
        auth:
          "public",
        description:
          "Verify a Google ID token, create or link the user identity, and issue a dashboard session."
      },
      {
        method:
          "GET",
        path:
          "/auth/me",
        auth:
          "session",
        description:
          "Return the currently authenticated dashboard user."
      },
      {
        method:
          "POST",
        path:
          "/auth/logout",
        auth:
          "session",
        description:
          "Revoke the current dashboard session."
      },
      {
        method:
          "GET",
        path:
          "/dashboard/account",
        auth:
          "session",
        description:
          "Return the signed-in user's primary account summary."
      },
      {
        method:
          "GET",
        path:
          "/dashboard/api-keys",
        auth:
          "session",
        description:
          "List API keys for the signed-in user's primary account."
      },
      {
        method:
          "POST",
        path:
          "/dashboard/api-keys",
        auth:
          "session",
        description:
          "Create an API key for the signed-in user's primary account."
      },
      {
        method:
          "POST",
        path:
          "/dashboard/api-keys/:apiKeyId/revoke",
        auth:
          "session",
        description:
          "Revoke an API key owned by the signed-in user's primary account."
      },
      {
        method:
          "DELETE",
        path:
          "/dashboard/api-keys/:apiKeyId",
        auth:
          "session",
        description:
          "Delete an API key owned by the signed-in user's primary account."
      },
      {
        method:
          "GET",
        path:
          "/dashboard/usage",
        auth:
          "session",
        description:
          "List recent usage events for the signed-in user's primary account."
      },
      {
        method:
          "GET",
        path:
          "/dashboard/payments",
        auth:
          "session",
        description:
          "List recent payments for the signed-in user's primary account."
      },
      {
        method:
          "POST",
        path:
          "/dashboard/checkout",
        auth:
          "session",
        description:
          "Create a checkout session for the signed-in user's primary account."
      },
      {
        method:
          "POST",
        path:
          "/auth/telegram/request-otp",
        auth:
          "platform-admin",
        description:
          "Internal-only OTP issuance endpoint intended for the Telegram bot connector."
      },
      {
        method:
          "POST",
        path:
          "/auth/telegram/verify-otp",
        auth:
          "public",
        description:
          "Verify a one-time Telegram login code supplied by the user on the web platform."
      },
      {
        method:
          "POST",
        path:
          "/webhooks/stripe",
        auth:
          "provider-signature",
        description:
          "Stripe webhook receiver. Marks successful checkout sessions paid and grants credits."
      },
      {
        method:
          "POST",
        path:
          "/webhooks/paystack",
        auth:
          "provider-signature",
        description:
          "Paystack webhook receiver. Marks successful charges paid and grants credits."
      },
      {
        method:
          "POST",
        path:
          "/webhooks/coinbase-commerce",
        auth:
          "provider-signature",
        description:
          "Coinbase Commerce webhook receiver. Marks confirmed charges paid and grants credits."
      },
      {
        method:
          "GET",
        path:
          "/uploads/:file",
        auth:
          "api-key",
        description:
          "Serve stored uploaded files from the local uploads directory when present."
      },
      {
        method:
          "GET",
        path:
          "/api/evidence/test",
        auth:
          "api-key",
        description:
          "Evidence route smoke-test endpoint."
      },
      {
        method:
          "POST",
        path:
          "/api/evidence/:id/upload",
        auth:
          "api-key",
        description:
          "Upload evidence for a dispute or case record using multipart field evidence."
      },
      {
        method:
          "POST",
        path:
          "/api/url/analyze",
        auth:
          "api-key",
        description:
          "Analyze a URL for extracted metadata and risk signals."
      },
      {
        method:
          "POST",
        path:
          "/api/web3/wallet-token-analysis",
        auth:
          "api-key",
        description:
          "Check an EVM wallet against a token contract using explorer data. Returns current token balance, incoming/outgoing transfer totals, recent transfers, and a careful assessment for claims like team dumping.",
        exampleRequest: {
          chainId:
            "1",
          walletAddress:
            "0x0000000000000000000000000000000000000000",
          tokenContractAddress:
            "0x0000000000000000000000000000000000000000",
          transferLimit:
            100
        }
      },
      {
        method:
          "POST",
        path:
          "/api/web3/payment-proof",
        auth:
          "api-key",
        description:
          "Verify an on-chain payment proof by transaction hash against claimed sender, recipient, amount, and chain. Returns confirmed/not_confirmed plus failed checks.",
        exampleRequest: {
          chainId:
            "1",
          txHash:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          expectedFrom:
            "0x0000000000000000000000000000000000000000",
          expectedTo:
            "0x0000000000000000000000000000000000000000",
          expectedAmount:
            "0.25"
        }
      },
      {
        method:
          "GET",
        path:
          "/api/entities/:value",
        auth:
          "api-key",
        description:
          "Look up related entity intelligence for a supplied value."
      },
      {
        method:
          "GET",
        path:
          "/api/conversations/resolve",
        auth:
          "api-key",
        description:
          "Resolve a conversation identifier from query parameters."
      },
      {
        method:
          "POST",
        path:
          "/api/conversations/resolve",
        auth:
          "api-key",
        description:
          "Resolve a conversation identifier from request body."
      },
      {
        method:
          "POST",
        path:
          "/api/conversations/ingest",
        auth:
          "api-key",
        description:
          "Ingest normalized messages for any supported platform or custom integration.",
        exampleRequest: {
          platform:
            "custom_crm",
          conversationId:
            "ticket-123",
          messages: [
            {
              messageId:
                "1",
              text:
                "Customer says the refund has not arrived.",
              timestamp:
                "2026-05-16T10:00:00Z",
              participant: {
                username:
                  "agent_42",
                displayName:
                  "Agent 42"
              }
            }
          ]
        }
      },
      {
        method:
          "POST",
        path:
          "/api/conversations/analyze",
        auth:
          "api-key",
        description:
          "Queue an asynchronous conversation analysis job for an ingested conversation."
      },
      {
        method:
          "GET",
        path:
          "/api/conversations/analysis/:sessionId",
        auth:
          "api-key",
        description:
          "Poll a conversation analysis session until completed or failed."
      },
      {
        method:
          "POST",
        path:
          "/api/chat",
        auth:
          "api-key",
        description:
          "Single-turn assistant Q&A with classifier-based routing and structured case reasoning when appropriate."
      },
      {
        method:
          "POST",
        path:
          "/api/ocr",
        auth:
          "api-key",
        description:
          "OCR-only extraction from one or more image files using multipart field image."
      },
      {
        method:
          "POST",
        path:
          "/api/media/image",
        auth:
          "api-key",
        description:
          "Analyze one image with OCR plus visual interpretation, returning visual summary and observations."
      },
      {
        method:
          "POST",
        path:
          "/api/media/audio",
        auth:
          "api-key",
        description:
          "Transcribe and analyze one audio file using multipart field audio. Intended limit: 5 MB and 10 minutes."
      },
      {
        method:
          "POST",
        path:
          "/api/audit/report",
        auth:
          "api-key",
        description:
          "Run a platform-agnostic interaction quality audit. Pass agents[] and either an inline messages[] array or a conversationId to pull from the DB. Works for Telegram groups, customer-support platforms, AI agents, marketplaces, or any custom integration.",
        exampleRequest: {
          platformType:
            "customer-support",
          agentRole:
            "Customer support representative",
          agents: [
            {
              externalUserId:
                "agent_01",
              displayName:
                "Alice"
            }
          ],
          messages: [
            {
              senderId:
                "customer_1",
              text:
                "My order never arrived!",
              timestamp:
                "2026-01-01T10:00:00Z"
            },
            {
              senderId:
                "agent_01",
              text:
                "I'm so sorry — let me look into this right now.",
              timestamp:
                "2026-01-01T10:02:00Z"
            }
          ]
        }
      },
      {
        method:
          "POST",
        path:
          "/api/audit/monitors",
        auth:
          "api-key",
        description:
          "Register or update a recurring scheduled interaction-quality audit monitor. Requires the conversation to already be ingested via /api/conversations/ingest."
      },
      {
        method:
          "GET",
        path:
          "/api/audit/monitors",
        auth:
          "api-key",
        description:
          "List active audit monitors, optionally filtered by ?platform=<value>."
      },
      {
        method:
          "GET",
        path:
          "/api/audit/due",
        auth:
          "api-key",
        description:
          "Run all overdue scheduled audit monitors and return reports. Intended for cron/worker use."
      },
      {
        method:
          "POST",
        path:
          "/api/moderator-audits/monitors",
        auth:
          "api-key",
        description:
          "Legacy: create or update a Telegram moderator audit monitor. Prefer /api/audit/monitors for new integrations."
      },
      {
        method:
          "GET",
        path:
          "/api/moderator-audits/monitors",
        auth:
          "api-key",
        description:
          "Legacy: list active moderator audit monitors. Prefer /api/audit/monitors."
      },
      {
        method:
          "GET",
        path:
          "/api/moderator-audits/reports/due",
        auth:
          "api-key",
        description:
          "Legacy: generate due moderator audit reports. Prefer /api/audit/due."
      },
      {
        method:
          "POST",
        path:
          "/api/moderator-audits/reports/generate",
        auth:
          "api-key",
        description:
          "Legacy: on-demand moderator audit report. Prefer /api/audit/report."
      },
      {
        method:
          "GET",
        path:
          "/api/conversation-settings",
        auth:
          "api-key",
        description:
          "Get persisted connector settings for a conversation, including conversational level."
      },
      {
        method:
          "PUT",
        path:
          "/api/conversation-settings",
        auth:
          "api-key",
        description:
          "Create or update persisted connector settings for a conversation, including conversational level."
      },
      {
        method:
          "GET",
        path:
          "/api/admin/accounts",
        auth:
          "api-key + platform-admin",
        description:
          "List customer accounts with total paid and current credit balance."
      },
      {
        method:
          "POST",
        path:
          "/api/admin/accounts",
        auth:
          "api-key + platform-admin",
        description:
          "Create a customer account."
      },
      {
        method:
          "GET",
        path:
          "/api/admin/api-keys",
        auth:
          "api-key + platform-admin",
        description:
          "List issued API keys, optionally filtered by accountId."
      },
      {
        method:
          "POST",
        path:
          "/api/admin/api-keys",
        auth:
          "api-key + platform-admin",
        description:
          "Create an API key and return the plaintext key once."
      },
      {
        method:
          "POST",
        path:
          "/api/admin/api-keys/:apiKeyId/revoke",
        auth:
          "api-key + platform-admin",
        description:
          "Revoke an API key."
      },
      {
        method:
          "POST",
        path:
          "/api/admin/credits/grants",
        auth:
          "api-key + platform-admin",
        description:
          "Grant credits to an account and append a ledger entry."
      },
      {
        method:
          "GET",
        path:
          "/api/admin/usage",
        auth:
          "api-key + platform-admin",
        description:
          "List recent usage events, optionally filtered by accountId."
      },
      {
        method:
          "POST",
        path:
          "/api/admin/payments/checkout-sessions",
        auth:
          "api-key + platform-admin",
        description:
          "Create a provider checkout session for Stripe, Paystack, or Coinbase Commerce while customer-facing billing auth is still being built."
      },
      {
        method:
          "GET",
        path:
          "/api/admin/payments",
        auth:
          "api-key + platform-admin",
        description:
          "List payments with optional account and status filters."
      },
      {
        method:
          "GET",
        path:
          "/api/admin/payments/attempts",
        auth:
          "api-key + platform-admin",
        description:
          "List provider payment attempts."
      },
      {
        method:
          "GET",
        path:
          "/api/admin/payments/webhook-events",
        auth:
          "api-key + platform-admin",
        description:
          "List recorded webhook events."
      }
    ],
    currentlyNotMounted: [
      {
        file:
          "src/routes/disputeRoutes.js",
        routes: [
          "GET /api/disputes",
          "POST /api/disputes"
        ]
      },
      {
        file:
          "src/routes/analysisRoutes.js",
        routes: [
          "POST /api/analysis/:id/analyze"
        ]
      },
      {
        file:
          "src/routes/evidenceStatusRoutes.js",
        routes: [
          "GET /api/evidence-status/:id"
        ]
      }
    ],
    integrationGuides: {
      escrowPlatforms: [
        "Use /api/conversations/ingest for case messages, /api/media/image and /api/media/audio for evidence, then queue conversation analysis.",
        "Current API provides building blocks for dispute support, but a finished escrow product still needs case lifecycle endpoints, verdict schemas, tenant controls, and workflow-level authorization."
      ],
      customerCareAudits: [
        "Use POST /api/audit/report with an inline messages[] array — no prior ingestion needed.",
        "Set platformType to 'customer-support', 'telegram', 'ai-agent', or 'marketplace' to tune the AI rubric.",
        "Each agent gets a score (0-10) across 6 dimensions: tone, helpfulness, accuracy, empathy, escalationHandling, compliance.",
        "Team-level output includes overallScore, teamSummary, teamRecommendations, and riskAlerts for management.",
        "For recurring reports, register a monitor via POST /api/audit/monitors — the conversation must be ingested first."
      ],
      disputeResolution: [
        "Use POST /api/disputes/analyze with a context string describing the dispute.",
        "Returns a structured verdict: disputeType, verdict enum, confidence score, keyFindings, evidenceAssessment, contradictions, riskFlags, recommendation, and requiredEvidence.",
        "Integrates with escrow platforms, marketplaces, and arbitration services."
      ],
      telegramBots: [
        "Use /api/chat for Q&A.",
        "Use /api/media/image or /api/ocr for images.",
        "Use /api/media/audio for voice notes.",
        "Use /api/conversation-settings for per-group behavior such as conversational level.",
        "Use the conversation workflow for thread-level intelligence."
      ]
    },
    supportedPlatforms: [
      "Telegram",
      "X/Twitter",
      "Discord",
      "Marketplace systems",
      "CRM/support systems",
      "Custom integrations"
    ]
  });

module.exports = {
  buildApiDocumentation
};
