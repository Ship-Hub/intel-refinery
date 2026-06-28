# API Test Structure

## Overview

The Intel Refinery API test suite uses Node.js built-in test runner (`node:test`). Tests are organized into four categories to ensure reliable execution and clear separation of concerns.

## Directory Structure

```
api/test/
├── unit/           # Active unit tests (no external dependencies)
├── cyber/          # Cyber Refinery specific tests
├── integration/    # Integration tests (may require database/server)
└── archived/       # Legacy tests (reference removed modules)
```

## Test Commands

| Command | Description | Includes |
|---------|-------------|----------|
| `npm test` | Default test suite | unit + cyber tests |
| `npm run test:unit` | Unit tests only | account, auth, payment, AI provider tests |
| `npm run test:cyber` | Cyber Refinery tests | Cyber profile, readiness, protocol tests |
| `npm run test:integration` | Integration tests | (empty - for future use) |
| `npm run test:legacy` | Archived legacy tests | Old dispute, conversation, moderation tests |

## Active Unit Tests

Located in `api/test/unit/`:

| Test File | Purpose | External Dependencies |
|-----------|---------|----------------------|
| `accountFoundation.test.js` | Account schema validation, API key generation, OTP schemas | None |
| `aiProviderRetry.test.js` | AI provider retry logic, fallback configuration | None |
| `authFoundation.test.js` | Google auth schema validation | None |
| `paymentFoundation.test.js` | Payment checkout schema, provider registry | None |
| `paymentProviderNormalization.test.js` | Webhook normalization for Stripe, Paystack, Coinbase | None |
| `paymentSmokeScript.test.js` | Payment script configuration verification | None |
| `paymentWebhookController.test.js` | Webhook handler logic | None |
| `paymentWebhookSignatures.test.js` | Webhook signature verification | None |
| `telegramOtpMetadata.test.js` | Telegram OTP metadata handling | None |
| `validateUpload.test.js` | File upload validation | None |

## Cyber Refinery Tests

Located in `api/test/cyber/`:

| Test File | Purpose | External Dependencies |
|-----------|---------|----------------------|
| `cyberRefineryFoundation.test.js` | Cyber profile schemas, readiness calculation, protocol resolution | None |

## Archived Legacy Tests

Located in `api/test/archived/`:

These tests reference modules that have been removed from the active codebase (disputes, conversations, moderation, retrieval, web3). They are preserved for historical reference but excluded from the default test run.

| Test File | Original Purpose | Status |
|-----------|-----------------|--------|
| `chatQueryController.test.js` | Chat query classification | Module removed |
| `conversationAnalysisCommands.test.js` | Conversation bot commands | Module removed |
| `conversationAnalysisNormalization.test.js` | Conversation normalization | Module removed |
| `disputeVerdictPolicy.test.js` | Dispute verdict prompts | Module removed |
| `frequency.test.js` | Moderator audit frequency | Module removed |
| `liveRetrieval.test.js` | Live retrieval classification | Module removed |
| `mediaController.test.js` | Media visual prompts | Module removed |
| `moderationPolicy.test.js` | Moderation policy decisions | Module removed |
| `proactiveClassificationSchema.test.js` | Proactive classification | Module removed |
| `pruneConversation.test.js` | Conversation pruning | Module removed |
| `web3PaymentProof.test.js` | Web3 payment proof matching | Module removed |

**Note**: Running `npm run test:legacy` will fail because the source modules no longer exist. These tests are archived only for reference.

## Environment Variables

The following environment variables may be required for tests:

| Variable | Required By | Default in Tests |
|----------|-------------|------------------|
| `GEMINI_API_KEY` | aiProviderRetry, mediaController | "test-key" |
| `GROQ_API_KEY` | chatQueryController | "test-key" |
| `PLATFORM_ADMIN_TOKEN` | accountFoundation | "admin-secret" |

## Test Requirements

| Requirement | unit | cyber | integration | legacy |
|-------------|------|-------|-------------|--------|
| Database | No | No | Yes (planned) | No |
| Running Server | No | No | Yes (planned) | No |
| External API Keys | No | No | Maybe | No |
| Network Access | No | No | Maybe | No |

## Manual Scripts

Located in `api/scripts/`:

These are NOT test files and should not be executed by the test runner:

| Script | Purpose | Requirements |
|--------|---------|--------------|
| `e2e-test.js` | End-to-end API test | Running server on localhost:5000 |
| `intelligenceScenarioTest.js` | Dispute scenario testing | Removed modules |
| `minimal-test.js` | Minimal test server | Database connection |
| `test-auth.js` | Auth endpoint testing | Running server on localhost:5000 |
| `test-groq.js` | Groq provider testing | GROQ_API_KEY |

## Adding New Tests

1. **Unit tests**: Add to `api/test/unit/` with `.test.js` extension
2. **Cyber tests**: Add to `api/test/cyber/` with `.test.js` extension
3. **Integration tests**: Add to `api/test/integration/` with `.test.js` extension
4. Use relative imports: `../../src/` to reference source modules
5. Set required environment variables at the top of the test file with fallbacks

## CI/CD Integration

The default `npm test` command runs unit + cyber tests and is suitable for CI pipelines. The command exits with code 0 on success, non-zero on failure.

## Recent Changes

- **2026-06-28**: Reorganized test suite into unit/cyber/integration/archived structure
- Moved 11 legacy tests to `archived/` directory
- Updated import paths for moved test files
- Added test:unit, test:cyber, test:integration, test:legacy commands
