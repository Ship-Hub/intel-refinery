# Cyber Refinery Implementation Status

## Overview

This document tracks the implementation status of Cyber Refinery features as of June 2026.

## Feature Status

### Core Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| General and Cyber Refinery profiles | Implemented | `refinery_profiles` table with general and cyber profiles |
| Cyber project creation | Implemented | v1 API supports `refineryProfile: "cyber"` |
| Persistent Cyber Source Workspace | Implemented | Sources have `source_category`, `inclusion_state`, `display_name` |
| Source packages | Implemented | `source_packages` table for grouping sources |
| Source categories and inclusion state | Implemented | Categories: vulnerability_scan, asset_inventory, security_advisory, etc. |
| Refinement readiness | Implemented | `calculateCyberReadiness()` service |

### Ingestion

| Feature | Status | Notes |
|---------|--------|-------|
| Raw text ingestion | Implemented | `POST /api/v1/projects/:projectId/sources/raw` |
| URL ingestion | Implemented | `POST /api/v1/projects/:projectId/sources/url` |
| File upload | Implemented | `POST /api/v1/projects/:projectId/sources/upload` |
| Generic Cyber JSON parser | Implemented | `generic-json` parser with field mapping |
| Generic Cyber CSV parser | Implemented | `generic-csv` parser with header detection |
| Parser contract and registry | Implemented | `CyberSourceParser` interface |

### Refinement Pipeline

| Feature | Status | Notes |
|---------|--------|-------|
| Real Cyber refinement runs | Implemented | Pipeline uses Cyber protocol bundle |
| Durable run execution | Implemented | `refinery_runs` table |
| Run events | Implemented | `refinery_run_events` table |
| Server-Sent Events | Implemented | `GET /projects/:projectId/runs/:runId/stream` |
| Cyber-specific protocol selection | Implemented | Protocol resolver uses profile key |

### Artifacts and Connections

| Feature | Status | Notes |
|---------|--------|-------|
| Artifact lineage | Implemented | `first_seen_source_id` tracks origin |
| Evidence | Implemented | `artifact_evidence` table |
| Connections | Implemented | `artifact_connections` table |
| Source coverage | Implemented | `source_coverage_count` field |

### Explorer UI

| Feature | Status | Notes |
|---------|--------|-------|
| Overview tab | Implemented | Stat cards, top findings/assets/actions |
| Findings tab | Implemented | Filterable list with detail panel |
| Assets tab | Implemented | Asset explorer with exposure info |
| Actions tab | Implemented | Action prioritization |
| Versions tab | Implemented | Model version history |
| Loading states | Implemented | Skeleton loaders |
| Empty states | Implemented | Contextual messages |
| Error states | Implemented | Error display with retry |
| Keyboard accessibility | Implemented | Tab navigation, arrow keys |
| Search | Implemented | Title/summary search |
| Filters | Implemented | Severity, status, source filters |

### Commercial API

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | Implemented | API key and session auth |
| Workspaces | Implemented | Account/workspace isolation |
| API keys | Implemented | Key generation and revocation |
| Quotas | Implemented | Plan-based credit limits |
| Rate limits | Implemented | Per-key rate limiting |
| Webhooks | Implemented | Payment webhooks |

## API Routes

### Cyber Project Management

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/projects` | GET | Implemented | List projects |
| `/api/v1/projects` | POST | Implemented | Create Cyber project |
| `/api/v1/projects/:projectId` | GET | Implemented | Get project details |
| `/api/v1/projects/:projectId` | PATCH | Implemented | Update project |
| `/api/v1/projects/:projectId` | DELETE | Implemented | Delete project |

### Source Management

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/projects/:projectId/sources` | GET | Implemented | List sources |
| `/api/v1/projects/:projectId/sources/raw` | POST | Implemented | Add raw text |
| `/api/v1/projects/:projectId/sources/url` | POST | Implemented | Add URL source |
| `/api/v1/projects/:projectId/sources/upload` | POST | Implemented | Upload file |
| `/api/v1/projects/:projectId/sources/:sourceId` | PATCH | Implemented | Update source |
| `/api/v1/projects/:projectId/sources/:sourceId/parse-preview` | GET | Implemented | Preview parser output |
| `/api/v1/projects/:projectId/source-packages` | GET | Implemented | List packages |
| `/api/v1/projects/:projectId/source-packages` | POST | Implemented | Create package |

### Readiness and Refinement

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/projects/:projectId/cyber/readiness` | GET | Implemented | Check readiness |
| `/api/v1/projects/:projectId/refine` | POST | Implemented | Start refinement |
| `/api/v1/projects/:projectId/runs/latest` | GET | Implemented | Get latest run |
| `/api/v1/projects/:projectId/runs/:runId` | GET | Implemented | Get run status |
| `/api/v1/projects/:projectId/runs/latest/stream` | GET | Implemented | SSE stream |
| `/api/v1/projects/:projectId/runs/:runId/stream` | GET | Implemented | SSE stream |

### Artifacts and Connections

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/projects/:projectId/artifacts` | GET | Implemented | List artifacts |
| `/api/v1/projects/:projectId/artifacts/:artifactId` | GET | Implemented | Get artifact detail |
| `/api/v1/projects/:projectId/connections` | GET | Implemented | List connections |
| `/api/v1/projects/:projectId/model` | GET | Implemented | Get model versions |

### Parsers

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `/api/v1/parsers` | GET | Implemented | List available parsers |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key |
| `PLATFORM_ADMIN_TOKEN` | No | Admin access token |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `GROQ_API_KEY` | No | Groq API key |
| `OPENROUTER_API_KEY` | No | OpenRouter API key |

## Database Tables

### Core Tables

| Table | Description |
|-------|-------------|
| `projects` | Projects with profile and intent |
| `sources` | Source files with categories and inclusion state |
| `source_packages` | Source groupings |
| `refinery_profiles` | Profile definitions (general, cyber) |
| `refinery_runs` | Refinement run tracking |
| `refinery_run_events` | Run event log |
| `artifacts` | Refined artifacts |
| `artifact_evidence` | Evidence links |
| `artifact_connections` | Artifact relationships |

### Commercial Tables

| Table | Description |
|-------|-------------|
| `accounts` | Customer accounts |
| `api_keys` | API key management |
| `workspaces` | Workspace isolation |
| `plans` | Subscription plans |
| `subscriptions` | Account subscriptions |
| `usage_events` | Usage tracking |

## Known Limitations

1. **Parser persistence**: Parsed records are not yet persisted to a dedicated table (requires schema approval)
2. **Record deduplication**: No automatic deduplication of parsed records
3. **Asset merging**: No automatic asset identity resolution
4. **Finding merging**: No automatic finding deduplication
5. **Remediation tracking**: No outbound Jira/Slack integration

## Next Steps

See `NEXT_STEPS.md` for planned improvements.
