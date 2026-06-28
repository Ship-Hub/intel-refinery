# Legacy Cleanup Status

## Overview

This document tracks the cleanup of dispute-era terminology from the active Intel Refinery and Cyber Refinery code paths.

## Cleaned Active UI Strings

No active UI strings require cleaning. The Cyber Refinery frontend uses neutral terminology:
- "Findings" instead of "disputes"
- "Artifacts" instead of "evidence"
- "Actions" instead of "rulings"
- "Refinement" instead of "analysis"

## Cleaned Active API Naming

No active API routes use dispute-era naming. The v1 API uses:
- `/projects` (not `/cases`)
- `/sources` (not `/evidence`)
- `/artifacts` (not `/findings`)
- `/connections` (not `/relationships`)

## Remaining Database Legacy

No database tables use dispute-era naming. Active tables:
- `projects` (not `cases`)
- `sources` (not `evidence`)
- `artifacts` (not `disputes`)
- `refinery_runs` (not `analysis_runs`)

## Archived Code

The following files contain dispute-era references but are archived or inactive:

### Backend (api/src/)

| File | Issue | Status |
|------|-------|--------|
| `config/multer.js` | Uses `disputeId` variable | Legacy file, not imported by active code |
| `controllers/apiDocumentation.js` | References dispute routes and documentation | Documentation only, no runtime impact |
| `ai/utils/validateAiResponse.js` | Contains `disputeSummarySchema` | Schema definition, not actively used |

### Frontend (frontend/src/)

| File | Issue | Status |
|------|-------|--------|
| `data/siteData.js` | Marketing copy mentions "disputes" | Landing page only |
| `components/AuthPanel.jsx` | References `@dispute_analyzer_bot` | Telegram bot link |
| `components/DocsPage.jsx` | Example API calls mention "dispute" | Documentation only |
| `components/DeveloperSection.jsx` | Example API calls mention "dispute" | Documentation only |
| `components/PlatformIntegrations.jsx` | Marketing copy mentions "dispute" | Landing page only |
| `components/UseCases.jsx` | Use case examples mention "disputes" | Landing page only |

## Unsafe Changes Requiring Future Migration

None identified. All dispute-era references are in:
1. Archived test files (already moved to `api/test/archived/`)
2. Documentation/marketing copy (no runtime impact)
3. Unused legacy code (not imported by active routes)

## Recommendations

### Low Risk (Can be done now)

1. **Update marketing copy**: Replace "dispute" with neutral terminology in landing page components
2. **Update documentation**: Replace "dispute" examples with Cyber Refinery examples
3. **Update Telegram bot reference**: Change `@dispute_analyzer_bot` if bot has been renamed

### Medium Risk (Requires testing)

1. **Clean up `config/multer.js`**: Either remove if unused, or rename `disputeId` to `itemId`
2. **Clean up `apiDocumentation.js`**: Remove dispute route references
3. **Clean up `validateAiResponse.js`**: Remove or rename `disputeSummarySchema`

### High Risk (Requires migration)

None identified. No database tables use dispute-era naming.

## Notes

- The word "case" is used generically in some documentation but does not reference the old dispute-case abstraction
- The word "evidence" is used in the artifact_evidence table but refers to source evidence, not dispute evidence submission
- The Telegram bot reference (`@dispute_analyzer_bot`) may be an external service that cannot be renamed
