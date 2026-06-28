// Generic Cyber CSV Parser — handles CSV files for security findings and asset inventories
// Supports common header aliases and handles quoted values, multiline descriptions

const { registerParser } = require("./registry");
const {
  CYBER_RECORD_TYPES,
  WARNING_CODES,
  PARSER_LIMITS,
  isValidCveFormat,
  isValidIpAddress,
  isValidPort,
  normalizeSeverity,
  createRecordHash,
} = require("./contract");

const PARSER_KEY = "generic-csv";
const PARSER_VERSION = "1.0.0";

// Common header aliases for mapping
const HEADER_ALIASES = {
  id: ["id", "finding_id", "findingId", "vuln_id", "vulnId", "issue_id", "issueId", "external_id", "externalId", "row_id", "rowId"],
  title: ["title", "name", "finding_name", "findingName", "issue_name", "issueName", "summary", "vulnerability_name", "vulnerabilityName"],
  description: ["description", "desc", "details", "finding_description", "findingDescription", "issue_description", "issueDescription"],
  severity: ["severity", "risk", "risk_level", "riskLevel", "severity_level", "severityLevel", "priority"],
  score: ["cvss", "cvss_score", "cvssScore", "score", "risk_score", "riskScore", "base_score", "baseScore"],
  cve: ["cve", "cve_id", "cveId", "cve_ids", "cveIds", "cves", "cve_list", "cveList"],
  cwe: ["cwe", "cwe_id", "cweId", "cwe_ids", "cweIds", "cwes", "cwe_list", "cweList"],
  host: ["host", "hostname", "target", "asset", "affected_asset", "affectedAsset", "asset_name", "assetName"],
  ip: ["ip", "ip_address", "ipAddress", "host_ip", "hostIp", "target_ip", "targetIp"],
  domain: ["domain", "fqdn", "host_domain", "hostDomain"],
  port: ["port", "target_port", "targetPort", "service_port", "servicePort"],
  protocol: ["protocol", "service", "network_protocol", "networkProtocol"],
  status: ["status", "state", "finding_status", "findingStatus", "issue_status", "issueStatus"],
  firstSeen: ["first_seen", "firstSeen", "first_observed", "firstObserved", "discovered", "discovered_at", "discoveredAt"],
  lastSeen: ["last_seen", "lastSeen", "last_observed", "lastObserved", "updated", "updated_at", "updatedAt"],
  remediation: ["remediation", "fix", "solution", "mitigation", "recommendation", "action"],
  assetType: ["asset_type", "assetType", "type", "system_type", "systemType"],
  os: ["os", "operating_system", "operatingSystem", "platform"],
  environment: ["environment", "env", "deployment", "stage"],
  criticality: ["criticality", "importance", "business_impact", "businessImpact"],
  owner: ["owner", "responsible", "team", "assigned_to", "assignedTo"],
};

/**
 * Parse CSV content into rows
 * Handles quoted values, multiline descriptions, and various delimiters
 */
function parseCsvContent(content, delimiter = ",") {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;
  let lineNumber = 1;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentField += char;
        if (char === "\n") {
          lineNumber++;
        }
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === delimiter) {
        // End of field
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        // End of row
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push({ fields: currentRow, lineNumber });
        }
        currentRow = [];
        currentField = "";
        if (char === "\r") i++; // Skip \r in \r\n
        lineNumber++;
      } else {
        currentField += char;
      }
    }
  }

  // Handle last row
  currentRow.push(currentField.trim());
  if (currentRow.some((f) => f.length > 0)) {
    rows.push({ fields: currentRow, lineNumber });
  }

  return rows;
}

/**
 * Detect CSV delimiter from content
 */
function detectDelimiter(content) {
  const sample = content.slice(0, 1000);
  const delimiters = [",", ";", "\t", "|"];
  let bestDelimiter = ",";
  let bestCount = 0;

  for (const delimiter of delimiters) {
    const count = (sample.match(new RegExp(`\\${delimiter}`, "g")) || []).length;
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Map header names to field names
 */
function mapHeaders(headers) {
  const mapping = {};
  const usedFields = new Set();

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => alias.toLowerCase() === header) && !usedFields.has(field)) {
        mapping[i] = field;
        usedFields.add(field);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Extract CVE IDs from value
 */
function extractCveIds(value) {
  if (!value) return { valid: [], invalid: [] };

  const parts = value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  const valid = [];
  const invalid = [];

  for (const part of parts) {
    const normalized = part.toUpperCase();
    if (isValidCveFormat(normalized)) {
      valid.push(normalized);
    } else if (normalized.startsWith("CVE-")) {
      invalid.push(part);
    }
  }

  return { valid, invalid };
}

/**
 * Extract CWE IDs from value
 */
function extractCweIds(value) {
  if (!value) return [];

  return value.split(/[,;|]/).map((s) => {
    const trimmed = s.trim();
    if (/^CWE-\d+$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    if (/^\d+$/.test(trimmed)) {
      return `CWE-${trimmed}`;
    }
    return trimmed;
  }).filter(Boolean);
}

/**
 * Sanitize field value to prevent CSV formula injection
 */
function sanitizeFieldValue(value) {
  if (!value) return value;

  const str = String(value);
  // Prevent CSV formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }

  return str;
}

/**
 * Normalize a single CSV row
 */
function normalizeRow(row, headers, mapping, rowIndex, warnings) {
  const record = {};
  const rawMetadata = {};

  // Map fields
  for (let i = 0; i < row.length; i++) {
    const field = mapping[i];
    const value = row[i];

    if (field) {
      record[field] = value;
    } else if (i < headers.length && value) {
      // Preserve unknown fields
      rawMetadata[headers[i]] = value;
    }
  }

  // Check for empty record
  if (Object.keys(record).length === 0 && Object.keys(rawMetadata).length === 0) {
    return null;
  }

  const recordWarnings = [];

  // Extract and validate fields
  const title = record.title;
  if (!title) {
    recordWarnings.push({
      code: WARNING_CODES.MISSING_TITLE,
      message: `Row ${rowIndex}: Missing title`,
      rowNumber: rowIndex,
      field: "title",
    });
  }

  // Severity
  const rawSeverity = record.severity;
  const { normalized: severity, warning: severityWarning } = normalizeSeverity(rawSeverity);
  if (severityWarning) {
    recordWarnings.push({ ...severityWarning, rowNumber: rowIndex });
  }

  // Score
  const rawScore = record.score;
  const score = rawScore ? Number(rawScore) : undefined;
  const validScore = score !== undefined && !isNaN(score) && score >= 0 && score <= 10 ? score : undefined;

  // CVEs
  const { valid: cveIds, invalid: invalidCves } = extractCveIds(record.cve);
  for (const invalid of invalidCves) {
    recordWarnings.push({
      code: WARNING_CODES.INVALID_CVE,
      message: `Row ${rowIndex}: Invalid CVE format: ${invalid}`,
      rowNumber: rowIndex,
      field: "cve",
      value: invalid,
    });
  }

  // CWEs
  const cweIds = extractCweIds(record.cwe);

  // Port validation
  const rawPort = record.port;
  let port = undefined;
  if (rawPort) {
    const portNum = Number(rawPort);
    if (isValidPort(portNum)) {
      port = portNum;
    } else {
      recordWarnings.push({
        code: WARNING_CODES.INVALID_PORT,
        message: `Row ${rowIndex}: Invalid port: ${rawPort}`,
        rowNumber: rowIndex,
        field: "port",
        value: rawPort,
      });
    }
  }

  // IP validation
  const rawIp = record.ip;
  if (rawIp && !isValidIpAddress(rawIp)) {
    recordWarnings.push({
      code: WARNING_CODES.INVALID_IP,
      message: `Row ${rowIndex}: Invalid IP address: ${rawIp}`,
      rowNumber: rowIndex,
      field: "ip",
      value: rawIp,
    });
  }

  // Build normalized record
  const normalized = {
    recordType: CYBER_RECORD_TYPES.FINDING,
    externalRecordId: record.id,
    title: title ? sanitizeFieldValue(title.slice(0, PARSER_LIMITS.MAX_TITLE_LENGTH)) : undefined,
    description: record.description ? sanitizeFieldValue(record.description.slice(0, PARSER_LIMITS.MAX_DESCRIPTION_LENGTH)) : undefined,
    originalSeverity: rawSeverity,
    originalScore: validScore,
    status: record.status,
    confidence: 0.7, // Lower confidence for CSV data
    cveIds: cveIds.length > 0 ? cveIds : undefined,
    cweIds: cweIds.length > 0 ? cweIds : undefined,
    assetIdentifiers: [],
    networkContext: undefined,
    timestamps: undefined,
    remediation: record.remediation ? sanitizeFieldValue(record.remediation) : undefined,
    rawMetadata: Object.keys(rawMetadata).length > 0 ? rawMetadata : undefined,
    sourceRowNumber: rowIndex,
  };

  // Build asset identifiers
  if (record.host) {
    normalized.assetIdentifiers.push({ type: "hostname", value: record.host });
  }
  if (rawIp && isValidIpAddress(rawIp)) {
    normalized.assetIdentifiers.push({ type: "ip_address", value: rawIp });
  }
  if (record.domain) {
    normalized.assetIdentifiers.push({ type: "domain", value: record.domain });
  }
  if (normalized.assetIdentifiers.length === 0) {
    normalized.assetIdentifiers = undefined;
  }

  // Build network context
  const networkContext = {};
  if (rawIp && isValidIpAddress(rawIp)) networkContext.ip = rawIp;
  if (port !== undefined) networkContext.port = port;
  if (record.protocol) networkContext.protocol = record.protocol;
  if (Object.keys(networkContext).length > 0) {
    normalized.networkContext = networkContext;
  }

  // Build timestamps
  const timestamps = {};
  if (record.firstSeen) {
    const date = new Date(record.firstSeen);
    if (!isNaN(date.getTime())) timestamps.firstSeen = date.toISOString();
  }
  if (record.lastSeen) {
    const date = new Date(record.lastSeen);
    if (!isNaN(date.getTime())) timestamps.lastSeen = date.toISOString();
  }
  if (Object.keys(timestamps).length > 0) {
    normalized.timestamps = timestamps;
  }

  // Add record hash
  normalized.recordHash = createRecordHash(normalized);

  warnings.push(...recordWarnings);
  return normalized;
}

/**
 * Parse CSV input
 */
async function parse(input) {
  const warnings = [];
  const rawRecords = [];
  const records = [];

  // Read input
  let content;
  if (input.filePath) {
    const fs = require("fs/promises");
    const stats = await fs.stat(input.filePath);
    if (stats.size > PARSER_LIMITS.MAX_FILE_SIZE) {
      warnings.push({
        code: WARNING_CODES.SIZE_LIMIT_EXCEEDED,
        message: `File size ${stats.size} exceeds limit of ${PARSER_LIMITS.MAX_FILE_SIZE}`,
      });
      return {
        parserKey: PARSER_KEY,
        parserVersion: PARSER_VERSION,
        recordType: CYBER_RECORD_TYPES.FINDING,
        records: [],
        rawRecords: [],
        warnings,
        rejectedCount: 0,
        metadata: { fileSize: stats.size },
      };
    }
    content = await fs.readFile(input.filePath, "utf-8");
  } else if (input.rawText) {
    content = input.rawText;
  } else {
    throw new Error("Either filePath or rawText must be provided");
  }

  // Detect delimiter
  const delimiter = detectDelimiter(content);

  // Parse CSV
  const rows = parseCsvContent(content, delimiter);

  if (rows.length === 0) {
    warnings.push({
      code: WARNING_CODES.EMPTY_RECORD,
      message: "No rows found in CSV",
    });
    return {
      parserKey: PARSER_KEY,
      parserVersion: PARSER_VERSION,
      recordType: CYBER_RECORD_TYPES.FINDING,
      records: [],
      rawRecords: [],
      warnings,
      rejectedCount: 0,
      metadata: { delimiter },
    };
  }

  // First row is headers
  const headers = rows[0].fields;
  const dataRows = rows.slice(1);

  // Map headers
  const mapping = mapHeaders(headers);

  // Check for duplicate headers
  const headerCounts = {};
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    headerCounts[lower] = (headerCounts[lower] || 0) + 1;
  }
  for (const [header, count] of Object.entries(headerCounts)) {
    if (count > 1) {
      warnings.push({
        code: WARNING_CODES.UNKNOWN_FIELD,
        message: `Duplicate header: ${header}`,
        field: header,
      });
    }
  }

  // Check record count limit
  const maxRecords = input.maxRecords || PARSER_LIMITS.MAX_RECORDS;
  if (dataRows.length > maxRecords) {
    warnings.push({
      code: WARNING_CODES.SIZE_LIMIT_EXCEEDED,
      message: `Row count ${dataRows.length} exceeds limit of ${maxRecords}`,
    });
  }

  // Process rows
  let rejectedCount = 0;
  for (let i = 0; i < Math.min(dataRows.length, maxRecords); i++) {
    const row = dataRows[i];
    rawRecords.push(row.fields);

    const normalized = normalizeRow(row.fields, headers, mapping, row.lineNumber, warnings);
    if (normalized) {
      records.push(normalized);
    } else {
      rejectedCount++;
    }
  }

  return {
    parserKey: PARSER_KEY,
    parserVersion: PARSER_VERSION,
    recordType: CYBER_RECORD_TYPES.FINDING,
    records,
    rawRecords,
    warnings,
    rejectedCount,
    metadata: {
      delimiter,
      headers,
      totalRows: dataRows.length,
      processedRows: records.length,
    },
  };
}

/**
 * Check if this parser can handle the input
 */
async function canHandle(input) {
  // Check MIME type
  if (input.mimeType === "text/csv" || input.mimeType === "application/csv") {
    return true;
  }

  // Check file extension
  if (input.filePath && input.filePath.endsWith(".csv")) {
    return true;
  }

  // Check if raw text looks like CSV
  if (input.rawText) {
    const lines = input.rawText.split("\n").slice(0, 5);
    if (lines.length >= 2) {
      const firstLine = lines[0];
      const secondLine = lines[1];
      // Check if lines have consistent delimiter
      const delimiters = [",", ";", "\t", "|"];
      for (const delimiter of delimiters) {
        const firstCount = (firstLine.match(new RegExp(`\\${delimiter}`, "g")) || []).length;
        const secondCount = (secondLine.match(new RegExp(`\\${delimiter}`, "g")) || []).length;
        if (firstCount > 0 && firstCount === secondCount) {
          return true;
        }
      }
    }
  }

  return false;
}

// Create and register parser
const genericCsvParser = {
  key: PARSER_KEY,
  version: PARSER_VERSION,
  supportedMimeTypes: ["text/csv", "application/csv"],
  supportedExtensions: [".csv"],
  canHandle,
  parse,
};

registerParser(genericCsvParser);
module.exports = genericCsvParser;
