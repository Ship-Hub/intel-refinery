# Codex Review Queue

## Architectural Decisions Required

### 1. Structured Record Persistence

**Status**: Pending architecture review

**Question**: Should normalized Cyber parser records be persisted in a dedicated table, or should they be processed directly into the existing `artifacts` table during refinement?

**Context**:
- Generic Cyber JSON and CSV parsers produce normalized records with fields like `recordType`, `title`, `severity`, `cveIds`, `cweIds`, etc.
- Currently, there is no intermediate table for storing these records before refinement
- The existing `artifacts` table is designed for refined outputs, not raw parsed data

**Options**:
1. **New `source_records` table**: Store parsed records with full metadata, then process into artifacts during refinement
2. **Extend `sources.metadata`**: Store parsed records as JSON in the existing source metadata field
3. **Direct to artifacts**: Skip intermediate storage and create artifacts directly during parsing

**Recommendation**: Option 1 (new `source_records` table) provides:
- Clean separation between raw parsed data and refined artifacts
- Better query performance for large datasets
- Ability to re-process records without re-parsing
- Support for record-level lineage and warnings

**Schema proposal** (pending approval):
```sql
CREATE TABLE IF NOT EXISTS source_records (
  id CHAR(36) PRIMARY KEY,
  source_id CHAR(36) NOT NULL,
  project_id VARCHAR(64) NOT NULL,
  parser_key VARCHAR(80) NOT NULL,
  parser_version VARCHAR(20) NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  external_record_id VARCHAR(255) NULL,
  title VARCHAR(1000) NULL,
  description TEXT NULL,
  original_severity VARCHAR(50) NULL,
  original_score DECIMAL(5,2) NULL,
  status VARCHAR(50) NULL,
  confidence DECIMAL(3,2) NULL,
  cwe_ids JSON NULL,
  asset_identifiers JSON NULL,
  network_context JSON NULL,
  timestamps JSON NULL,
  remediation TEXT NULL,
  raw_metadata JSON NULL,
  source_row_number INT NULL,
  record_hash CHAR(16) NOT NULL,
  warnings JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_source_records_source (source_id),
  INDEX idx_source_records_project (project_id),
  INDEX idx_source_records_hash (record_hash)
);
```

**Decision required from**: Codex / Architecture team

---

### 2. Parser Result Preview API

**Status**: Implemented as temporary preview endpoint

**Question**: Should parser results be exposed via a preview endpoint before persistence, or only after storage?

**Current implementation**: Preview endpoint that runs the parser and returns results without persisting

**Recommendation**: Keep preview endpoint for validation, add persistence endpoint after schema approval

---

## Schema Questions

### 1. Record Type Normalization

**Question**: Should `recordType` values be stored as-is or mapped to existing artifact types?

**Current values**:
- finding
- asset
- vulnerability
- indicator
- incident_event
- control
- recommendation
- software_component

**Existing artifact types** (from `cyberTaxonomy.js`):
- finding
- asset
- threat
- vulnerability
- control
- incident
- action
- evidence
- conflict
- context

**Recommendation**: Map parser output types to existing taxonomy where possible, preserve unmapped types

---

### 2. Severity Storage

**Question**: Should severity be stored as normalized enum or original string?

**Current implementation**: Both `originalSeverity` (raw string) and normalized level

**Recommendation**: Store both for flexibility

---

## Migration Concerns

### 1. Adding `source_records` table

**Risk**: Low (additive only)

**Impact**: No existing tables modified

**Rollback**: Drop table

---

### 2. Adding parser metadata to `sources` table

**Question**: Should we add `parser_key`, `parser_version`, `parsed_record_count`, `rejected_record_count` columns?

**Current state**: These are stored in `metadata` JSON field

**Recommendation**: Keep in metadata until schema is finalized

---

## Security Concerns

### 1. Parser Output Size

**Risk**: Large CSV/JSON files could produce excessive records

**Mitigation**: Enforce `PARSER_LIMITS.MAX_RECORDS` (10,000) and `PARSER_LIMITS.MAX_FILE_SIZE` (50MB)

---

### 2. Formula Injection in CSV

**Risk**: CSV values starting with `=`, `+`, `-`, `@` could execute formulas when opened in spreadsheet applications

**Mitigation**: Prefix dangerous values with single quote (implemented)

---

### 3. Raw Record Preservation

**Risk**: Storing raw records could include sensitive data

**Recommendation**: Implement field-level redaction for known sensitive fields before storage

---

## Pending Tasks

- [ ] Approve `source_records` table schema
- [ ] Implement record persistence after schema approval
- [ ] Add parser metadata columns to `sources` table (optional)
- [ ] Implement field-level redaction for sensitive data
- [ ] Add record deduplication logic
- [ ] Implement record-to-artifact mapping during refinement
