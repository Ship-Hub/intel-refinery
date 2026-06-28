# Cyber Refinery API Contracts

## Overview

This document describes the current API contracts for Cyber Refinery features.

## Authentication

All API requests require authentication via:
- **API Key**: `x-api-key` header
- **Session Token**: `Authorization: Bearer <token>` header

## Base URL

```
Production: https://api.intelrefinery.site/api/v1
Local: http://localhost:5000/api/v1
```

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "requestId": "uuid"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "requestId": "uuid"
}
```

## Projects

### Create Cyber Project

```http
POST /projects
Content-Type: application/json

{
  "title": "Quarterly security review",
  "description": "Review of external attack surface",
  "refineryProfile": "cyber",
  "intent": "vulnerability_review",
  "mode": "deep"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workspaceId": null,
    "accountId": 1,
    "title": "Quarterly security review",
    "description": "Review of external attack surface",
    "guidancePrompt": null,
    "mode": "deep",
    "status": "draft",
    "intent": "vulnerability_review",
    "sourceCount": 0,
    "profileKey": "cyber",
    "profileName": "Cyber Refinery",
    "createdAt": "2026-06-28T10:00:00.000Z"
  }
}
```

### Get Project

```http
GET /projects/:projectId
```

**Response (200)**: Same as create response.

### Update Project

```http
PATCH /projects/:projectId
Content-Type: application/json

{
  "status": "ready_for_refinement",
  "intent": "incident_review"
}
```

### Delete Project

```http
DELETE /projects/:projectId
```

**Response (200)**:
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

## Sources

### List Sources

```http
GET /projects/:projectId/sources?cursor=xxx&limit=50
```

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "sourceType": "text",
      "sourceCategory": "vulnerability_scan",
      "inclusionState": "included",
      "displayName": "Tenable export",
      "title": "June scan results",
      "status": "normalized",
      "createdAt": "2026-06-28T10:00:00.000Z"
    }
  ],
  "nextCursor": "base64",
  "hasMore": false
}
```

### Add Raw Text Source

```http
POST /projects/:projectId/sources/raw
Content-Type: application/json

{
  "title": "Analyst notes",
  "content": "Critical findings from manual review...",
  "sourceCategory": "analyst_notes",
  "displayName": "Manual review notes",
  "sourceNotes": "Review completed by senior analyst"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "sourceType": "raw_text",
    "sourceCategory": "analyst_notes",
    "inclusionState": "included",
    "displayName": "Manual review notes",
    "title": "Analyst notes",
    "status": "normalized",
    "createdAt": "2026-06-28T10:00:00.000Z"
  }
}
```

### Add URL Source

```http
POST /projects/:projectId/sources/url
Content-Type: application/json

{
  "uri": "https://example.com/advisory/CVE-2024-12345",
  "title": "Vendor advisory",
  "sourceCategory": "security_advisory"
}
```

### Upload File Source

```http
POST /projects/:projectId/sources/upload
Content-Type: multipart/form-data

source: <file>
title: "June scanner export"
sourceCategory: "vulnerability_scan"
```

### Update Source

```http
PATCH /projects/:projectId/sources/:sourceId
Content-Type: application/json

{
  "displayName": "Updated name",
  "inclusionState": "excluded",
  "sourceNotes": "Duplicate of source-123"
}
```

### Preview Parser Output

```http
GET /projects/:projectId/sources/:sourceId/parse-preview
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "parser": {
      "key": "generic-json",
      "version": "1.0.0"
    },
    "recordType": "finding",
    "processedRecordCount": 5,
    "rejectedRecordCount": 0,
    "warningCount": 1,
    "warnings": [
      {
        "code": "MISSING_TITLE",
        "message": "Record 3 has no title",
        "field": "title"
      }
    ],
    "records": [
      {
        "recordType": "finding",
        "externalRecordId": "FIND-001",
        "title": "SQL Injection",
        "originalSeverity": "critical",
        "cveIds": ["CVE-2024-12345"],
        "recordHash": "abc123"
      }
    ],
    "metadata": {
      "source": "findings",
      "totalRecords": 5,
      "processedRecords": 5
    }
  }
}
```

### List Source Packages

```http
GET /projects/:projectId/source-packages
```

### Create Source Package

```http
POST /projects/:projectId/source-packages
Content-Type: application/json

{
  "name": "June scanner export",
  "packageType": "manual_ingestion",
  "sourceSystem": "tenable",
  "metadata": { "exportedBy": "analyst" }
}
```

## Parsers

### List Available Parsers

```http
GET /parsers
```

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "key": "generic-json",
      "version": "1.0.0",
      "supportedMimeTypes": ["application/json"],
      "supportedExtensions": [".json"]
    },
    {
      "key": "generic-csv",
      "version": "1.0.0",
      "supportedMimeTypes": ["text/csv", "application/csv"],
      "supportedExtensions": [".csv"]
    }
  ]
}
```

## Readiness

### Get Cyber Readiness

```http
GET /projects/:projectId/cyber/readiness
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "isReady": true,
    "score": 85,
    "counts": {
      "totalSources": 5,
      "readySources": 4,
      "categories": 3
    },
    "blockingIssues": [],
    "suggestions": [
      "Consider adding asset_inventory sources"
    ]
  }
}
```

## Refinement

### Start Refinement

```http
POST /projects/:projectId/refine
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "run-uuid",
    "runId": "run-uuid",
    "projectId": "project-uuid",
    "status": "queued",
    "progress": 0,
    "stagesCompleted": [],
    "stagesFailed": [],
    "message": "Refinement pipeline queued"
  }
}
```

### Get Run Status

```http
GET /projects/:projectId/runs/latest
GET /projects/:projectId/runs/:runId
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "run-uuid",
    "projectId": "project-uuid",
    "trigger": "api",
    "status": "running",
    "progress": 50,
    "currentStage": "observe",
    "stagesCompleted": ["ingest", "normalize", "chunk"],
    "stagesFailed": [],
    "errorMessage": null,
    "durationMs": 45000,
    "startedAt": "2026-06-28T10:00:00.000Z",
    "completedAt": null,
    "createdAt": "2026-06-28T10:00:00.000Z",
    "project": {
      "id": "project-uuid",
      "status": "refining",
      "profileKey": "cyber",
      "intent": "vulnerability_review"
    }
  }
}
```

### Stream Run Status (SSE)

```http
GET /projects/:projectId/runs/latest/stream
GET /projects/:projectId/runs/:runId/stream
Accept: text/event-stream
```

**Events**:
```
event: run-event
data: {"id":"evt-uuid","runId":"run-uuid","stage":"observe","message":"Processing sources...","createdAt":"..."}

event: status
data: {"id":"run-uuid","status":"running","progress":50,...}

event: done
data: {"id":"run-uuid","status":"completed","progress":100,...}
```

## Artifacts

### List Artifacts

```http
GET /projects/:projectId/artifacts?type=finding&status=active&search=xss&cursor=xxx&limit=50
```

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "artifactType": "finding",
      "title": "Cross-Site Scripting (XSS)",
      "summary": "Reflected XSS in search parameter",
      "content": { "severity": "high", "cveIds": ["CVE-2024-12345"] },
      "confidence": 0.85,
      "importance": 0.9,
      "status": "active",
      "sourceCoverageCount": 3,
      "firstSeenSourceId": "source-uuid",
      "firstSeenSourceName": "Scanner export",
      "createdAt": "2026-06-28T10:00:00.000Z",
      "updatedAt": "2026-06-28T10:00:00.000Z"
    }
  ],
  "nextCursor": "base64",
  "hasMore": false
}
```

### Get Artifact Detail

```http
GET /projects/:projectId/artifacts/:artifactId
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "artifactType": "finding",
    "title": "Cross-Site Scripting (XSS)",
    "summary": "Reflected XSS in search parameter",
    "confidence": 0.85,
    "importance": 0.9,
    "status": "active",
    "evidence": [
      {
        "id": "uuid",
        "sourceId": "source-uuid",
        "quote": "The search parameter reflects user input...",
        "evidenceType": "direct_quote",
        "confidence": 0.9,
        "sourceName": "Scanner export",
        "sourceCategory": "vulnerability_scan",
        "sourceType": "text"
      }
    ],
    "connections": [
      {
        "id": "uuid",
        "fromArtifactId": "finding-uuid",
        "toArtifactId": "asset-uuid",
        "connectionType": "affects",
        "label": "Affects asset",
        "confidence": 0.85,
        "fromTitle": "Cross-Site Scripting",
        "fromArtifactType": "finding",
        "toTitle": "web-server-01",
        "toArtifactType": "asset"
      }
    ]
  }
}
```

## Connections

### List Connections

```http
GET /projects/:projectId/connections?type=affects&cursor=xxx&limit=50
```

## Model Versions

### Get Model Status

```http
GET /projects/:projectId/model
```

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "versionId": "uuid",
      "versionNumber": 1,
      "status": "active",
      "summary": "Initial Cyber model",
      "createdAt": "2026-06-28T10:00:00.000Z",
      "runId": "run-uuid",
      "runStatus": "completed",
      "stagesCompleted": ["ingest", "normalize", "chunk", "observe", "connect", "understand", "reflect", "build_model", "generate_views"],
      "durationMs": 120000,
      "runCreatedAt": "2026-06-28T10:00:00.000Z"
    }
  ]
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Internal server error |

## Rate Limits

- **API Keys**: 100 requests per minute per key
- **Session tokens**: 1000 requests per minute per account

## Pagination

Endpoints support cursor-based pagination:

```http
GET /projects?cursor=base64&limit=50
```

Response includes:
- `nextCursor`: Base64 cursor for next page
- `hasMore`: Boolean indicating more results
