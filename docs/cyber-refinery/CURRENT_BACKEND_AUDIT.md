# Cyber Refinery Backend Audit

Date: 2026-06-28

This audit reflects the current repository implementation, not the intended product architecture. Cyber Refinery should extend the shared Intel Refinery backend rather than become a separate application.

## Capability Matrix

| Capability | Status | Existing implementation | Gap | Recommended action |
| ---------- | ------ | ----------------------- | --- | ------------------ |
| Application framework | Already implemented | Node.js, Express, CommonJS API in `api/server.js`; React/Vite frontend workspace. | None for Phase 1. | Reuse existing API and workspace boundaries. |
| Database and ORM | Partially implemented | MySQL via `mysql2` pool in `api/src/config/db.js`; raw SQL migrations. | No ORM or central schema metadata; migrations have inconsistent eras. | Keep additive migrations and avoid schema rewrites. |
| Database migrations | Needs modification | `009_refinery_model.sql`, `011_refinery_redesign.sql`, `012_commercial_v1.sql`, plus `database/migrations/*`. | Commercial migrations conflict in ID assumptions; refinery redesign is destructive if replayed blindly. | Add a new idempotent migration for profile/source workspace fields. |
| Project model | Partially implemented | `projects` table includes workspace/account/title/description/guidance/mode/status/source count. | No profile abstraction, intent, or Cyber lifecycle metadata. | Add `refinery_profiles` and project profile/intent columns. |
| Workspace or organization model | Partially implemented | Commercial account/workspace/member tables exist in later migrations and v1 auth context. | Older refinery routes can operate with looser workspace semantics. | Prefer v1/account-aware routes for new Cyber APIs. |
| Authentication | Already implemented | API keys, sessions, OAuth routes, v1 auth middleware in `server.js`. | Two API auth paths exist: old refinery route auth and v1 API auth. | Reuse v1 auth for new public Developer APIs. |
| Authorization | Partially implemented | v1 project/source list routes join through account ownership; API key scopes exist. | Some old source detail/delete routes do not verify account ownership. | Add Cyber APIs only behind v1 ownership checks; fix old source auth separately. |
| Source model | Partially implemented | `sources` table stores project/source type/raw/extracted metadata/hash/status. | No inclusion state, Cyber category, source package, duplicate/replacement workflow, or parser warnings. | Add source workspace metadata columns and package table. |
| Upload flow | Partially implemented | `/api/sources/upload` validates files, hashes, extracts, and stores source rows. | Upload flow is on older app route, not v1 Developer API; no Cyber package/inclusion model. | Reuse existing ingestion, add metadata fields, then expose v1 source operations. |
| URL ingestion | Partially implemented | `/api/sources/url` uses URL adapter and extractor. | SSRF protection is not consistently applied to old URL ingestion. | Apply SSRF controls before expanding URL ingestion. |
| Text ingestion | Already implemented | `/api/sources/raw` and text adapter support raw/plain/markdown/csv. | No structured parser records. | Reuse for Cyber notes and add parser registry later. |
| Source-processing states | Needs modification | Statuses include `pending`, `normalized`, `chunked`, `failed` in practice; project status is free-form in redesign. | No lifecycle states such as collecting sources, ready for refinement, updates available. | Add documented status constants and readiness calculation before changing pipeline behavior. |
| Chunking | Already implemented | `api/src/ai/utils/chunkText.js` and processing pipeline chunk source text. | No Cyber-aware chunk policy. | Reuse now; profile-specific chunk strategy can come later. |
| OCR | Already implemented | Image adapter uses Tesseract OCR. | OCR quality warnings are not modeled. | Preserve adapter and add parser warnings in a later parser phase. |
| Document parsers | Partially implemented | PDF, image, text, URL, and placeholder audio adapters registered in `api/src/ingestion/registry.js`. | Registry is source-type based, not parser-bundle based; no CSV/JSON scanner-specific normalization. | Introduce parser bundles after profile foundation. |
| Job queue | Missing | Refinement pipeline runs as a direct async function; v1 refine only inserts a run. | No durable queue or background orchestration for v1. | Defer queue work; document v1 refine behavior clearly. |
| Workers | Unsafe to assume | `api/worker.js` exists, but refinery processing is not wired as a durable worker queue. | Worker architecture is not a reliable Cyber dependency. | Audit worker wiring before using it for refinement. |
| Model-provider abstraction | Already implemented | `api/src/orchestrator` routes tasks to OpenRouter/Groq/Gemini/Ollama through shared runners. | Provider config is generic; no Cyber task routing yet. | Reuse orchestrator only; do not call providers directly. |
| Protocol system | Partially implemented | `api/src/research` has protocol registry and observe/connect/understand/reflect/presentation files. | Not connected to a profile bundle selection model. | Add profile bundle keys, then map Cyber protocols later. |
| Refinery Runs | Partially implemented | `refinery_runs` table and processing pipeline create/update runs; v1 refine creates a running run only. | v1 run does not execute the pipeline or provide real progress. | Keep v1 trigger behavior unchanged in Phase 1; improve after queue decision. |
| Model versions | Partially implemented | `refinery_model_versions` are built by processing pipeline and read through v1 model route. | No profile-specific model schema. | Add Cyber artifact/model schemas later. |
| Artifacts | Partially implemented | `artifacts` table and v1 list route exist. | No Cyber artifact taxonomy. | Add schema taxonomy after profile work. |
| Connections | Partially implemented | `artifact_connections` and evidence tables exist with v1 list route. | No Cyber connection vocabulary. | Add Cyber connection types through profile/protocol bundles. |
| Source references | Partially implemented | `artifact_evidence` and `connection_evidence` connect outputs to source chunks. | No first-class source review references in source workspace. | Preserve traceability and add source workspace metadata. |
| View generation | Partially implemented | Views table/routes and generate-view task exist. | No Cyber dashboards or board views. | Add Cyber view bundle after artifact taxonomy. |
| Exports | Missing | No clear export surface found in current API routes. | Cyber export requirements are unimplemented. | Defer until model/view semantics are stable. |
| API keys | Already implemented | Account API keys with scopes, request logs, and v1 routes. | Scope granularity is generic. | Reuse existing scopes initially. |
| Public Developer API | Partially implemented | `/api/v1` supports projects, lists sources/artifacts/connections/model, usage, keys, refine trigger. | No source create/update/package APIs and no profile/readiness APIs. | Add profile/readiness/source workspace routes under v1. |
| Quota system | Partially implemented | Entitlements, plan limits, and usage events exist. | Refinery costs are not fully tied to Cyber workflows. | Do not expand costs in Phase 1; account later when pipeline runs. |
| Usage tracking | Partially implemented | `usage_events` are queried by v1 usage routes. | Pipeline stage accounting is incomplete. | Defer until runnable Cyber pipeline stages exist. |
| AI cost accounting | Partially implemented | Usage tables and AI execution tables exist in migrations. | No reliable end-to-end Cyber cost attribution found. | Audit before billing Cyber-specific usage. |
| Audit logging | Partially implemented | Admin audit logs exist in commercial migration area. | Project/source user audit trail is not comprehensive. | Add Cyber source review audit events later. |
| Realtime progress transport | Missing | No websocket/SSE progress transport found for refinery runs. | Product may need progress updates during refinement. | Defer until job queue is designed. |
| Existing tests | Partially implemented | Node test suite covers validators/services/payment/auth/media and security helpers. | No DB-backed Cyber/profile/refinery API integration tests. | Add pure service/schema tests for Phase 1 and defer DB integration. |
| Frontend API contracts | Needs modification | Frontend workspace uses older `/api/projects` and `/api/sources`; developer API uses `/api/v1`. | Cyber workspace frontend has no profile/readiness/source package contract yet. | Add v1-compatible backend first, then update frontend. |
| Old Intel Engine/dispute abstractions | Needs modification | Some tests and old assets still reference Intel Engine/dispute-era concepts. | Naming and domain remnants can confuse Cyber implementation. | Clean opportunistically only where touched. |

## Current Database Schema

The repository contains multiple schema generations:

- `api/database/009_refinery_model.sql` defines the original neutral Refinery model, including projects, sources, chunks, extraction/observation/entity/theme/model/report tables, AI task/execution tables, model runs, and prompt versions.
- `api/database/011_refinery_redesign.sql` performs a graph-first redesign, recreating projects, sources, chunks, refinery runs, model versions, artifacts, artifact evidence, artifact connections, connection evidence, and views.
- `api/database/010_commercial_backend.sql`, `api/database/012_commercial_v1.sql`, and `api/database/migrations/*` add account, user, workspace, API key, billing, entitlement, usage, webhook, idempotency, and audit-log concerns.

Because these files are not a single clean linear migration history, new Cyber work should be additive and idempotent. Do not replay destructive refinery redesign migrations against production without an explicit migration plan.

## Current Project Lifecycle

Projects can be created through older `/api/projects` routes and through `/api/v1/projects`. v1 creation sets `status = 'draft'`; older refinery processing later uses statuses such as `processing`, `completed`, and `failed`. v1 update currently accepts only `draft`, `active`, and `archived`.

There is no profile selection, Cyber intent, readiness state, or source collection lifecycle in the current project API.

## Current Source Lifecycle

Sources can be created through older upload, URL, and raw-text routes. The route verifies project ownership during creation and list operations. Ingestion adapters extract text and create sources with states such as `normalized`, `pending`, or `failed`. The processing pipeline chunks normalized/pending sources and can mark them `chunked`.

There is no source inclusion/exclusion state, package grouping, duplicate review, replacement tracking, parser warning model, or Cyber-specific source category.

## Current Refinery Run Lifecycle

The older refinery route calls `processProject`, which creates a run, processes stages synchronously, updates run status, and builds a model version/views. The v1 refine endpoint only inserts a `refinery_runs` row with `status = 'running'` and returns the run ID. It does not currently invoke the processing pipeline.

## Existing Module Boundaries

- `api/src/projects` owns older app project routes.
- `api/src/sources` owns older source ingestion routes.
- `api/src/accounts` owns commercial/v1 developer API controllers, routes, validators, and account services.
- `api/src/processing` owns the refinery graph/pipeline.
- `api/src/ingestion` owns source-type adapters.
- `api/src/orchestrator` owns model-provider execution.
- `api/src/research` owns protocol definitions/registry.
- `api/src/refinery` owns model/artifact/connection/view route helpers.

Cyber Refinery should add profile/source-workspace/readiness services beside shared refinery/account modules rather than duplicate these systems.

## Existing Routes

Primary relevant route surfaces:

- `/api/projects` for app project CRUD.
- `/api/sources/upload`, `/api/sources/url`, `/api/sources/raw`, `/api/sources/project/:projectId`, `/api/sources/:id`, `/api/sources/:id/chunks`.
- `/api/projects/:projectId/refine` for older pipeline execution.
- `/api/projects/:projectId/artifacts`, `/connections`, `/model`, `/views`.
- `/api/v1/projects`, `/api/v1/projects/:projectId`, `/api/v1/projects/:projectId/sources`, `/artifacts`, `/connections`, `/model`, `/refine`.
- `/api/v1/usage` and `/api/v1/api-keys`.

New Cyber API work should prefer `/api/v1` because it is account-aware and already shaped as the public Developer API.

## Queue And Worker Architecture

No durable queue-backed refinery architecture is safe to assume from the current code. `api/worker.js` exists, but the active pipeline path is direct function execution in `api/src/processing/pipeline.js`, and the v1 refine route does not invoke it.

## AI Orchestration

AI calls should go through `api/src/orchestrator`. Task routing is centralized in `api/src/orchestrator/config.js`; task definitions live under `api/src/tasks/definitions`. Cyber-specific protocols should extend task/protocol selection rather than making provider calls from controllers or parsers.

## Cost And Quota Accounting

The commercial backend includes plan limits, entitlements, API keys, request logs, and usage events. The v1 usage route summarizes `usage_events`. Full Cyber refinement cost attribution is not implemented end to end, so Phase 1 should avoid billing-sensitive behavior changes.

## Current Security Concerns

- Old source detail/delete routes should verify account ownership before returning or deleting a source.
- Old URL ingestion should consistently apply SSRF protections.
- v1 refine creates a running run without actually executing work, which can mislead API consumers.
- Migration history contains destructive and inconsistent schema assumptions.
- API key scope enforcement is present but broad; new Cyber write operations should apply explicit account ownership checks.

## Technical Debt Affecting Cyber Refinery

- Two project/source API surfaces exist, and the frontend currently uses the older app routes.
- The parser registry is adapter-oriented, not bundle/version oriented.
- Project status vocabulary is inconsistent between routes and pipeline.
- v1 controllers contain unused imports from older project routes.
- There is no reliable queue/progress story for refinement.
- Some old Intel Engine/dispute naming remains in tests/assets and should be cleaned as related files are touched.

## Phase 1 Recommendation

Implement a minimal additive foundation:

1. Add `refinery_profiles` and project profile/intent columns.
2. Add source workspace metadata such as inclusion state, source category, package grouping, duplicate/replacement references, and notes.
3. Add profile-aware v1 project create/update/read fields.
4. Add a pure readiness service for Cyber projects that evaluates whether included sources are sufficient to refine.
5. Add focused tests around validators/readiness logic.

Do not add scanners, exploitation, remediation, endpoint access, or provider-specific AI calls.
