// Cyber Parser Contract — defines the interface for structured Cyber parsers
// Parsers transform raw source data into normalized Cyber records

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

/**
 * @typedef {Object} NormalizedCyberRecord
 * @property {string} recordType - Type of record (finding, asset, vulnerability, etc.)
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

/**
 * @typedef {Object} ParserWarning
 * @property {string} code - Warning code
 * @property {string} message - Human-readable message
 * @property {number} [rowNumber] - Row number (for CSV)
 * @property {string} [field] - Field that caused the warning
 * @property {*} [value] - Value that caused the warning
 */

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

/**
 * @typedef {Object} CyberSourceParser
 * @property {string} key - Unique parser identifier
 * @property {string} version - Parser version (semver)
 * @property {string[]} [supportedMimeTypes] - Supported MIME types
 * @property {string[]} [supportedExtensions] - Supported file extensions
 * @property {function(ParserInput): boolean|Promise<boolean>} canHandle - Check if parser can handle input
 * @property {function(ParserInput): Promise<ParserResult>} parse - Parse input and return results
 */

// Record types supported by the Cyber parser contract
const CYBER_RECORD_TYPES = {
  FINDING: "finding",
  ASSET: "asset",
  VULNERABILITY: "vulnerability",
  INDICATOR: "indicator",
  INCIDENT_EVENT: "incident_event",
  CONTROL: "control",
  RECOMMENDATION: "recommendation",
  SOFTWARE_COMPONENT: "software_component",
};

// Common severity levels
const SEVERITY_LEVELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
  UNKNOWN: "unknown",
};

// Warning codes
const WARNING_CODES = {
  MISSING_TITLE: "MISSING_TITLE",
  INVALID_SEVERITY: "INVALID_SEVERITY",
  INVALID_CVE: "INVALID_CVE",
  INVALID_CWE: "INVALID_CWE",
  INVALID_IP: "INVALID_IP",
  INVALID_PORT: "INVALID_PORT",
  INVALID_URL: "INVALID_URL",
  TRUNCATED_FIELD: "TRUNCATED_FIELD",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  MALFORMED_RECORD: "MALFORMED_RECORD",
  EMPTY_RECORD: "EMPTY_RECORD",
  SIZE_LIMIT_EXCEEDED: "SIZE_LIMIT_EXCEEDED",
  UNKNOWN_FIELD: "UNKNOWN_FIELD",
  PARSER_ERROR: "PARSER_ERROR",
};

// Size limits
const PARSER_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_RECORDS: 10000,
  MAX_TITLE_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 50000,
  MAX_FIELD_LENGTH: 100000,
  MAX_NESTING_DEPTH: 10,
  MAX_ARRAY_LENGTH: 1000,
};

/**
 * Validate a CVE ID format
 * @param {string} cveId - CVE ID to validate
 * @returns {boolean} Whether the format is valid
 */
function isValidCveFormat(cveId) {
  return /^CVE-\d{4}-\d{4,}$/i.test(cveId);
}

/**
 * Validate an IP address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} Whether the format is valid
 */
function isValidIpAddress(ip) {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    const parts = ip.split(".");
    return parts.every((p) => {
      const num = parseInt(p, 10);
      return num >= 0 && num <= 255;
    });
  }
  // IPv6 (simplified check)
  return /^[\da-fA-F:]+$/.test(ip) && ip.includes(":");
}

/**
 * Validate a port number
 * @param {number|string} port - Port to validate
 * @returns {boolean} Whether the port is valid
 */
function isValidPort(port) {
  const num = typeof port === "string" ? parseInt(port, 10) : port;
  return Number.isInteger(num) && num >= 0 && num <= 65535;
}

/**
 * Validate a URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the format is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize severity to standard levels
 * @param {string} severity - Raw severity value
 * @returns {Object} Normalized severity and warning if applicable
 */
function normalizeSeverity(severity) {
  if (!severity) return { normalized: SEVERITY_LEVELS.UNKNOWN, warning: null };

  const lower = String(severity).toLowerCase().trim();
  const mapping = {
    critical: SEVERITY_LEVELS.CRITICAL,
    high: SEVERITY_LEVELS.HIGH,
    medium: SEVERITY_LEVELS.MEDIUM,
    moderate: SEVERITY_LEVELS.MEDIUM,
    low: SEVERITY_LEVELS.LOW,
    info: SEVERITY_LEVELS.INFO,
    informational: SEVERITY_LEVELS.INFO,
    none: SEVERITY_LEVELS.INFO,
    unknown: SEVERITY_LEVELS.UNKNOWN,
  };

  const normalized = mapping[lower];
  if (normalized) {
    return { normalized, warning: null };
  }

  return {
    normalized: SEVERITY_LEVELS.UNKNOWN,
    warning: {
      code: WARNING_CODES.INVALID_SEVERITY,
      message: `Unknown severity value: ${severity}`,
      field: "severity",
      value: severity,
    },
  };
}

/**
 * Create a deterministic hash for a record
 * @param {Object} record - Record to hash
 * @returns {string} Hex hash
 */
function createRecordHash(record) {
  const crypto = require("crypto");
  const normalized = JSON.stringify(record, Object.keys(record).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

module.exports = {
  CYBER_RECORD_TYPES,
  SEVERITY_LEVELS,
  WARNING_CODES,
  PARSER_LIMITS,
  isValidCveFormat,
  isValidIpAddress,
  isValidPort,
  isValidUrl,
  normalizeSeverity,
  createRecordHash,
};
