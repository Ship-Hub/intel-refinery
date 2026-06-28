# Cyber Parser Contract

## Overview

The Cyber Parser Contract defines a standardized interface for parsing structured security data into normalized Cyber records. Parsers transform raw source data (JSON, CSV, etc.) into a consistent format that can be processed by the Cyber Refinery pipeline.

## Parser Interface

```javascript
/**
 * @typedef {Object} CyberSourceParser
 * @property {string} key - Unique parser identifier (e.g., "generic-json", "generic-csv")
 * @property {string} version - Parser version (semver format)
 * @property {string[]} [supportedMimeTypes] - Supported MIME types
 * @property {string[]} [supportedExtensions] - Supported file extensions
 * @property {function(ParserInput): boolean|Promise<boolean>} canHandle - Check if parser can handle input
 * @property {function(ParserInput): Promise<ParserResult>} parse - Parse input and return results
 */
```

## Parser Input

```javascript
/**
 * @typedef {Object} ParserInput
 * @property {string} [filePath] - Path to the source file
 * @property {string} [rawText] - Raw text content
 * @property {string} [mimeType] - MIME type of the source
 * @property {string} [fileName] - Original file name
 * @property {Object} [metadata] - Additional metadata
 * @property {number} [maxRecords] - Maximum records to process
 * @property {number} [maxFileSize] - Maximum file size in bytes
 */
```

## Parser Result

```javascript
/**
 * @typedef {Object} ParserResult
 * @property {string} parserKey - Parser identifier
 * @property {string} parserVersion - Parser version
 * @property {string} recordType - Type of records in result
 * @property {NormalizedCyberRecord[]} records - Normalized records
 * @property {Object[]} rawRecords - Original raw records for lineage
 * @property {ParserWarning[]} warnings - Warnings encountered
 * @property {number} rejectedCount - Number of rejected records
 * @property {Object} metadata - Parser-specific metadata
 */
```

## Normalized Cyber Record

```javascript
/**
 * @typedef {Object} NormalizedCyberRecord
 * @property {string} recordType - Type: finding, asset, vulnerability, indicator, incident_event, control, recommendation, software_component
 * @property {string} [externalRecordId] - ID from the source system
 * @property {string} [title] - Record title
 * @property {string} [description] - Record description
 * @property {string} [originalSeverity] - Original severity from source
 * @property {number} [originalScore] - Original numeric score (e.g., CVSS)
 * @property {string} [status] - Record status
 * @property {number} [confidence] - Confidence level (0-1)
 * @property {string[]} [cveIds] - Associated CVE identifiers
 * @property {string[]} [cweIds] - Associated CWE identifiers
 * @property {Object[]} [assetIdentifiers] - Associated asset identifiers
 * @property {Object} [networkContext] - Network context (IP, port, protocol)
 * @property {Object} [codeLocation] - Code location information
 * @property {Object} [timestamps] - Temporal information
 * @property {string} [remediation] - Remediation guidance
 * @property {string[]} [references] - External references
 * @property {Object} [evidence] - Supporting evidence
 * @property {Object} [rawMetadata] - Original source metadata
 */
```

## Record Types

| Type | Description | Example |
|------|-------------|---------|
| `finding` | Security finding or vulnerability | SQL Injection, XSS |
| `asset` | IT asset or system | Web server, database |
| `vulnerability` | Specific vulnerability | CVE-2024-12345 |
| `indicator` | Threat indicator | Malicious IP, domain |
| `incident_event` | Security incident event | Breach, attack |
| `control` | Security control | Firewall rule, access control |
| `recommendation` | Security recommendation | Implement WAF |
| `software_component` | Software component | Library, dependency |

## Warning Codes

| Code | Description |
|------|-------------|
| `MISSING_TITLE` | Record has no title |
| `INVALID_SEVERITY` | Unknown severity value |
| `INVALID_CVE` | Invalid CVE format |
| `INVALID_CWE` | Invalid CWE format |
| `INVALID_IP` | Invalid IP address |
| `INVALID_PORT` | Invalid port number |
| `INVALID_URL` | Invalid URL format |
| `TRUNCATED_FIELD` | Field exceeded max length |
| `MISSING_REQUIRED_FIELD` | Required field missing |
| `MALFORMED_RECORD` | Record structure is invalid |
| `EMPTY_RECORD` | Record has no data |
| `SIZE_LIMIT_EXCEEDED` | File or record count limit |
| `UNKNOWN_FIELD` | Unknown field preserved |
| `PARSER_ERROR` | General parser error |

## Parser Registry

```javascript
const { registerParser, getParser, findParser, listParsers } = require("./registry");

// Register a parser
registerParser({
  key: "generic-json",
  version: "1.0.0",
  supportedMimeTypes: ["application/json"],
  supportedExtensions: [".json"],
  canHandle: async (input) => { /* ... */ },
  parse: async (input) => { /* ... */ },
});

// Get parser by key
const parser = getParser("generic-json");

// Find parser for input
const parser = await findParser({ filePath: "/path/to/file.json" });

// List all parsers
const parsers = listParsers();
```

## Security Rules

1. **Size Limits**: Enforce file size and record count limits
2. **No Code Execution**: Never evaluate or execute code from source data
3. **No Command Execution**: Never execute commands found in source data
4. **Filename Sanitization**: Don't trust filenames from source data
5. **No Secret Logging**: Don't log raw secrets or credentials
6. **Graceful Failures**: Malformed records produce warnings, not crashes
7. **Input Validation**: Validate all input formats (CVE, IP, port, URL)
8. **Field Truncation**: Truncate fields exceeding max length

## Adding a New Parser

1. Create a new file in `api/src/parsers/`
2. Implement the `CyberSourceParser` interface
3. Register with `registerParser()`
4. Add tests in `api/test/cyber/`
5. Update this documentation

### Example Parser Structure

```javascript
const { registerParser } = require("./registry");
const { CYBER_RECORD_TYPES, WARNING_CODES } = require("./contract");

const myParser = {
  key: "my-parser",
  version: "1.0.0",
  supportedMimeTypes: ["application/x-my-format"],
  supportedExtensions: [".myf"],

  canHandle: async (input) => {
    if (input.mimeType === "application/x-my-format") return true;
    if (input.filePath && input.filePath.endsWith(".myf")) return true;
    return false;
  },

  parse: async (input) => {
    const records = [];
    const warnings = [];
    const rawRecords = [];

    // Parse logic here

    return {
      parserKey: myParser.key,
      parserVersion: myParser.version,
      recordType: CYBER_RECORD_TYPES.FINDING,
      records,
      rawRecords,
      warnings,
      rejectedCount: 0,
      metadata: {},
    };
  },
};

registerParser(myParser);
module.exports = myParser;
```

## Parser Versioning

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Increment MAJOR for breaking changes to output format
- Increment MINOR for new features or fields
- Increment PATCH for bug fixes

## Failure Behavior

| Scenario | Behavior |
|----------|----------|
| Invalid JSON | Return error with line number |
| Empty file | Return empty result with warning |
| Missing required fields | Add warning, include record if possible |
| Invalid field format | Add warning, mark as unverified |
| Size limit exceeded | Return partial result with warning |
| Unknown fields | Preserve in rawMetadata |

## Record Preservation

- Original raw records are preserved in `rawRecords`
- Each normalized record includes `rawMetadata` with original data
- Record hash is generated for deduplication
- Source row/line numbers are preserved for lineage

## Test Fixtures

Located in `api/test/fixtures/cyber/`:

```
cyber/
├── generic-json/
│   ├── single-finding.json
│   ├── multiple-findings.json
│   ├── nested-collection.json
│   ├── unknown-wrapper.json
│   ├── missing-title.json
│   ├── invalid-severity.json
│   ├── multiple-cves.json
│   ├── unknown-fields.json
│   ├── empty.json
│   └── empty-array.json
├── generic-csv/
│   ├── findings.csv
│   ├── asset-inventory.csv
│   ├── quoted-commas.csv
│   └── multiline-description.csv
├── sarif/
└── invalid/
    └── malformed.json
```
