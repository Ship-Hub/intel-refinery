# Cyber Refinery Next Steps

## Priority 1: Schema Approval

### Structured Record Persistence

**Status**: Blocked pending architecture review

**Description**: Create `source_records` table for storing parsed Cyber records before refinement.

**Benefits**:
- Clean separation between raw parsed data and refined artifacts
- Better query performance for large datasets
- Ability to re-process records without re-parsing
- Support for record-level lineage and warnings

**Decision required**: See `CODEX_REVIEW_QUEUE.md` for schema proposal.

---

## Priority 2: Parser Integration

### Record-to-Artifact Mapping

**Status**: Planned

**Description**: During refinement, map normalized source records to artifacts automatically.

**Requirements**:
- Map `finding` records to `finding` artifacts
- Map `vulnerability` records to `vulnerability` artifacts
- Map `asset` records to `asset` artifacts
- Preserve `recordHash` for deduplication

---

### Additional Parsers

**Status**: Planned

**Suggested parsers**:
1. **SARIF parser**: Static Analysis Results Interchange Format
2. **Nessus parser**: Nessus vulnerability scanner exports
3. **Nmap parser**: Network scan results
4. **Burp parser**: Burp Suite scanner exports
5. **OWASP ZAP parser**: ZAP scanner reports

---

## Priority 3: Deduplication

### Record Deduplication

**Status**: Planned

**Description**: Prevent duplicate records from being processed multiple times.

**Approach**:
- Use `recordHash` for exact match deduplication
- Consider fuzzy matching for similar records
- Provide merge/skip/replace options

---

### Asset Identity Resolution

**Status**: Blocked pending architecture review

**Description**: Resolve asset identities across multiple sources.

**Requirements**:
- Match assets by hostname, IP, domain
- Merge asset metadata from multiple sources
- Preserve source lineage

---

## Priority 4: Enhanced Explorer

### Advanced Filtering

**Status**: Planned

**Description**: Add more filter options to the explorer.

**Filters to add**:
- Date range filter
- Confidence threshold filter
- Source category filter
- CVE/CWE filter
- Asset type filter

---

### Bulk Actions

**Status**: Planned

**Description**: Allow bulk operations on artifacts.

**Actions**:
- Bulk status change
- Bulk export
- Bulk tag assignment

---

### Export Functionality

**Status**: Planned

**Description**: Export artifacts in various formats.

**Formats**:
- CSV export
- JSON export
- PDF report
- STIX/TAXII (threat intelligence)

---

## Priority 5: Integrations

### Jira Integration

**Status**: Planned

**Description**: Create Jira tickets from findings.

**Features**:
- Auto-create tickets for critical findings
- Sync status between systems
- Link artifacts to Jira issues

---

### Slack Integration

**Status**: Planned

**Description**: Send notifications to Slack channels.

**Features**:
- Notify on critical findings
- Daily summary reports
- Run completion notifications

---

### Webhook Support

**Status**: Planned

**Description**: Send webhooks for external integrations.

**Events**:
- Run completed
- Critical finding detected
- Source processed

---

## Priority 6: Reporting

### Executive Dashboard

**Status**: Planned

**Description**: High-level dashboard for executives.

**Metrics**:
- Risk score over time
- Open findings by severity
- Remediation progress
- Source coverage

---

### Compliance Reports

**Status**: Planned

**Description**: Generate compliance reports.

**Frameworks**:
- NIST CSF
- ISO 27001
- SOC 2
- PCI DSS

---

## Priority 7: Advanced Features

### AI-Powered Remediation

**Status**: Blocked pending architecture review

**Description**: Use AI to suggest remediation steps.

**Requirements**:
- Generate remediation recommendations
- Prioritize by effort vs impact
- Track remediation progress

---

### Threat Intelligence Correlation

**Status**: Planned

**Description**: Correlate findings with threat intelligence feeds.

**Sources**:
- MITRE ATT&CK
- NVD
- CISA KEV
- Custom feeds

---

## Technical Debt

### Code Cleanup

| Item | Priority | Status |
|------|----------|--------|
| Remove unused multer config | Low | Documented |
| Update API documentation | Low | Documented |
| Clean dispute-era references | Low | Documented |

---

### Testing

| Item | Priority | Status |
|------|----------|--------|
| Add integration tests | Medium | Planned |
| Add parser edge case tests | Medium | Planned |
| Add API contract tests | Low | Planned |

---

## Documentation

### User Documentation

| Item | Priority | Status |
|------|----------|--------|
| Getting started guide | High | Planned |
| Source ingestion guide | High | Planned |
| Refinement guide | Medium | Planned |
| Explorer guide | Medium | Planned |

---

### Developer Documentation

| Item | Priority | Status |
|------|----------|--------|
| Parser development guide | Medium | Planned |
| Protocol development guide | Low | Planned |
| Contributing guide | Low | Planned |

---

## Timeline

### Q3 2026

- [ ] Schema approval for `source_records`
- [ ] Record persistence implementation
- [ ] Record-to-artifact mapping
- [ ] Advanced filtering in explorer

### Q4 2026

- [ ] SARIF parser
- [ ] Asset identity resolution
- [ ] Jira integration
- [ ] Export functionality

### Q1 2027

- [ ] Executive dashboard
- [ ] Compliance reports
- [ ] Threat intelligence correlation
- [ ] Slack integration

---

## Notes

- All architectural decisions require Codex review
- Database changes require migration approval
- Public API changes require compatibility documentation
- Security features require audit before deployment
