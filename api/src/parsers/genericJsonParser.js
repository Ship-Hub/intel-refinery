// Generic Cyber JSON Parser — handles various JSON formats for security findings
// Supports common vendor formats and preserves unknown fields

const { registerParser } = require("./registry");
const {
  CYBER_RECORD_TYPES,
  WARNING_CODES,
  PARSER_LIMITS,
  isValidCveFormat,
  isValidIpAddress,
  isValidPort,
  isValidUrl,
  normalizeSeverity,
  createRecordHash,
} = require("./contract");

const PARSER_KEY = "generic-json";
const PARSER_VERSION = "1.0.0";

// Common field aliases for mapping
const FIELD_ALIASES = {
  // Record ID
  id: ["id", "finding_id", "findingId", "vuln_id", "vulnId", "issue_id", "issueId", "external_id", "externalId"],
  // Title
  title: ["title", "name", "summary", "finding_name", "findingName", "issue_name", "issueName", "vulnerability_name", "vulnerabilityName"],
  // Description
  description: ["description", "desc", "details", "finding_description", "findingDescription", "issue_description", "issueDescription"],
  // Severity
  severity: ["severity", "risk", "risk_level", "riskLevel", "severity_level", "severityLevel", "priority"],
  // Numeric score
  score: ["cvss", "cvss_score", "cvssScore", "score", "risk_score", "riskScore", "base_score", "baseScore"],
  // Status
  status: ["status", "state", "finding_status", "findingStatus", "issue_status", "issueStatus"],
  // CVE
  cve: ["cve", "cve_id", "cveId", "cve_ids", "cveIds", "cves", "cve_list", "cveList"],
  // CWE
  cwe: ["cwe", "cwe_id", "cweId", "cwe_ids", "cweIds", "cwes", "cwe_list", "cweList"],
  // Asset
  asset: ["asset", "host", "hostname", "target", "affected_asset", "affectedAsset", "asset_name", "assetName"],
  // IP
  ip: ["ip", "ip_address", "ipAddress", "host_ip", "hostIp", "target_ip", "targetIp"],
  // Domain
  domain: ["domain", "fqdn", "host_domain", "hostDomain"],
  // Port
  port: ["port", "target_port", "targetPort", "service_port", "servicePort"],
  // Protocol
  protocol: ["protocol", "service", "network_protocol", "networkProtocol"],
  // File path
  filePath: ["file_path", "filePath", "path", "file", "source_file", "sourceFile", "location"],
  // Repository
  repository: ["repository", "repo", "repo_name", "repoName", "source_repo", "sourceRepo"],
  // First observed
  firstObserved: ["first_seen", "firstSeen", "first_observed", "firstObserved", "discovered", "discovered_at", "discoveredAt", "created", "created_at", "createdAt"],
  // Last observed
  lastObserved: ["last_seen", "lastSeen", "last_observed", "lastObserved", "updated", "updated_at", "updatedAt", "modified", "modified_at", "modifiedAt"],
  // Remediation
  remediation: ["remediation", "fix", "solution", "mitigation", "recommendation", "action"],
  // References
  references: ["references", "refs", "external_references", "externalReferences", "links", "urls"],
  // Evidence
  evidence: ["evidence", "proof", "details", "additional_data", "additionalData"],
};

/**
 * Find value in object using alias list
 */
function findValueByAliases(obj, aliases) {
  for (const alias of aliases) {
    if (obj[alias] !== undefined) {
      return obj[alias];
    }
  }
  return undefined;
}

/**
 * Extract array of strings from value
 */
function extractStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    // Handle comma-separated or single value
    if (value.includes(",")) {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [value];
  }
  return [];
}

/**
 * Extract CVE IDs from various formats
 */
function extractCveIds(value) {
  const raw = extractStringArray(value);
  const valid = [];
  const invalid = [];

  for (const id of raw) {
    const normalized = String(id).toUpperCase().trim();
    if (isValidCveFormat(normalized)) {
      valid.push(normalized);
    } else if (normalized.startsWith("CVE-")) {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

/**
 * Extract CWE IDs from various formats
 */
function extractCweIds(value) {
  const raw = extractStringArray(value);
  return raw.map((id) => {
    const str = String(id).trim();
    // Normalize CWE-XXX format
    if (/^CWE-\d+$/i.test(str)) {
      return str.toUpperCase();
    }
    // Normalize numeric CWE
    if (/^\d+$/.test(str)) {
      return `CWE-${str}`;
    }
    return str;
  });
}

/**
 * Extract asset identifiers from record
 */
function extractAssetIdentifiers(record) {
  const identifiers = [];

  const hostname = findValueByAliases(record, FIELD_ALIASES.asset);
  if (hostname) {
    identifiers.push({ type: "hostname", value: String(hostname) });
  }

  const ip = findValueByAliases(record, FIELD_ALIASES.ip);
  if (ip) {
    identifiers.push({ type: "ip_address", value: String(ip) });
  }

  const domain = findValueByAliases(record, FIELD_ALIASES.domain);
  if (domain) {
    identifiers.push({ type: "domain", value: String(domain) });
  }

  return identifiers;
}

/**
 * Extract network context from record
 */
function extractNetworkContext(record) {
  const context = {};

  const ip = findValueByAliases(record, FIELD_ALIASES.ip);
  if (ip) context.ip = String(ip);

  const port = findValueByAliases(record, FIELD_ALIASES.port);
  if (port !== undefined) {
    const portNum = Number(port);
    if (isValidPort(portNum)) {
      context.port = portNum;
    }
  }

  const protocol = findValueByAliases(record, FIELD_ALIASES.protocol);
  if (protocol) context.protocol = String(protocol);

  return Object.keys(context).length > 0 ? context : undefined;
}

/**
 * Extract timestamps from record
 */
function extractTimestamps(record) {
  const timestamps = {};

  const firstSeen = findValueByAliases(record, FIELD_ALIASES.firstObserved);
  if (firstSeen) {
    const date = new Date(firstSeen);
    if (!isNaN(date.getTime())) {
      timestamps.firstSeen = date.toISOString();
    }
  }

  const lastSeen = findValueByAliases(record, FIELD_ALIASES.lastObserved);
  if (lastSeen) {
    const date = new Date(lastSeen);
    if (!isNaN(date.getTime())) {
      timestamps.lastSeen = date.toISOString();
    }
  }

  return Object.keys(timestamps).length > 0 ? timestamps : undefined;
}

/**
 * Extract known fields and preserve unknown ones
 */
function extractRawMetadata(record, knownFields) {
  const metadata = {};
  const knownSet = new Set(knownFields);

  for (const [key, value] of Object.entries(record)) {
    if (!knownSet.has(key) && value !== undefined && value !== null) {
      metadata[key] = value;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Normalize a single record
 */
function normalizeRecord(record, index, warnings) {
  if (!record || typeof record !== "object") {
    warnings.push({
      code: WARNING_CODES.MALFORMED_RECORD,
      message: `Record ${index} is not a valid object`,
    });
    return null;
  }

  // Check for empty record
  if (Object.keys(record).length === 0) {
    warnings.push({
      code: WARNING_CODES.EMPTY_RECORD,
      message: `Record ${index} is empty`,
    });
    return null;
  }

  const recordWarnings = [];

  // Extract title
  const title = findValueByAliases(record, FIELD_ALIASES.title);
  if (!title) {
    recordWarnings.push({
      code: WARNING_CODES.MISSING_TITLE,
      message: `Record ${index} has no title`,
      field: "title",
    });
  }

  // Extract and validate severity
  const rawSeverity = findValueByAliases(record, FIELD_ALIASES.severity);
  const { normalized: severity, warning: severityWarning } = normalizeSeverity(rawSeverity);
  if (severityWarning) {
    recordWarnings.push({ ...severityWarning, rowNumber: index });
  }

  // Extract score
  const rawScore = findValueByAliases(record, FIELD_ALIASES.score);
  const score = rawScore !== undefined ? Number(rawScore) : undefined;
  const validScore = score !== undefined && !isNaN(score) && score >= 0 && score <= 10 ? score : undefined;

  // Extract CVEs
  const rawCve = findValueByAliases(record, FIELD_ALIASES.cve);
  const { valid: cveIds, invalid: invalidCves } = extractCveIds(rawCve);
  for (const invalid of invalidCves) {
    recordWarnings.push({
      code: WARNING_CODES.INVALID_CVE,
      message: `Invalid CVE format: ${invalid}`,
      field: "cve",
      value: invalid,
    });
  }

  // Extract CWEs
  const rawCwe = findValueByAliases(record, FIELD_ALIASES.cwe);
  const cweIds = extractCweIds(rawCwe);

  // Extract assets
  const assetIdentifiers = extractAssetIdentifiers(record);

  // Extract network context
  const networkContext = extractNetworkContext(record);

  // Extract timestamps
  const timestamps = extractTimestamps(record);

  // Extract remediation
  const remediation = findValueByAliases(record, FIELD_ALIASES.remediation);
  const remediationStr = remediation ? String(remediation).slice(0, PARSER_LIMITS.MAX_DESCRIPTION_LENGTH) : undefined;

  // Extract references
  const rawReferences = findValueByAliases(record, FIELD_ALIASES.references);
  const references = extractStringArray(rawReferences).filter(isValidUrl);

  // Extract evidence
  const evidence = findValueByAliases(record, FIELD_ALIASES.evidence);

  // Build normalized record
  const normalized = {
    recordType: CYBER_RECORD_TYPES.FINDING,
    externalRecordId: findValueByAliases(record, FIELD_ALIASES.id)?.toString(),
    title: title ? String(title).slice(0, PARSER_LIMITS.MAX_TITLE_LENGTH) : undefined,
    description: findValueByAliases(record, FIELD_ALIASES.description)?.toString()?.slice(0, PARSER_LIMITS.MAX_DESCRIPTION_LENGTH),
    originalSeverity: rawSeverity ? String(rawSeverity) : undefined,
    originalScore: validScore,
    status: findValueByAliases(record, FIELD_ALIASES.status)?.toString(),
    confidence: 0.8, // Default confidence for parsed data
    cveIds: cveIds.length > 0 ? cveIds : undefined,
    cweIds: cweIds.length > 0 ? cweIds : undefined,
    assetIdentifiers: assetIdentifiers.length > 0 ? assetIdentifiers : undefined,
    networkContext,
    codeLocation: findValueByAliases(record, FIELD_ALIASES.filePath) ? {
      filePath: String(findValueByAliases(record, FIELD_ALIASES.filePath)),
      repository: findValueByAliases(record, FIELD_ALIASES.repository)?.toString(),
    } : undefined,
    timestamps,
    remediation: remediationStr,
    references: references.length > 0 ? references : undefined,
    evidence: evidence || undefined,
    rawMetadata: extractRawMetadata(record, [
      ...FIELD_ALIASES.id,
      ...FIELD_ALIASES.title,
      ...FIELD_ALIASES.description,
      ...FIELD_ALIASES.severity,
      ...FIELD_ALIASES.score,
      ...FIELD_ALIASES.status,
      ...FIELD_ALIASES.cve,
      ...FIELD_ALIASES.cwe,
      ...FIELD_ALIASES.asset,
      ...FIELD_ALIASES.ip,
      ...FIELD_ALIASES.domain,
      ...FIELD_ALIASES.port,
      ...FIELD_ALIASES.protocol,
      ...FIELD_ALIASES.filePath,
      ...FIELD_ALIASES.repository,
      ...FIELD_ALIASES.firstObserved,
      ...FIELD_ALIASES.lastObserved,
      ...FIELD_ALIASES.remediation,
      ...FIELD_ALIASES.references,
      ...FIELD_ALIASES.evidence,
    ]),
  };

  // Add record hash for deduplication
  normalized.recordHash = createRecordHash(normalized);

  warnings.push(...recordWarnings);
  return normalized;
}

/**
 * Extract records from various JSON structures
 */
function extractRecords(data) {
  // Direct array
  if (Array.isArray(data)) {
    return { records: data, source: "array" };
  }

  // Object with common collection keys
  if (typeof data === "object" && data !== null) {
    const collectionKeys = [
      "findings", "results", "vulnerabilities", "issues", "items",
      "data", "records", "entries", "list", "alerts", "events",
    ];

    for (const key of collectionKeys) {
      if (Array.isArray(data[key])) {
        return { records: data[key], source: key };
      }
    }

    // Nested in data object
    if (data.data && typeof data.data === "object") {
      for (const key of collectionKeys) {
        if (Array.isArray(data.data[key])) {
          return { records: data.data[key], source: `data.${key}` };
        }
      }
    }

    // Single record (has title or name)
    if (data.title || data.name || data.summary) {
      return { records: [data], source: "single" };
    }

    // Single record with common security fields
    if (data.description || data.severity || data.cve || data.cwe || data.host || data.ip) {
      return { records: [data], source: "single" };
    }
  }

  return { records: [], source: "unknown" };
}

/**
 * Parse JSON input
 */
async function parse(input) {
  const warnings = [];
  const rawRecords = [];
  const records = [];

  // Read input
  let jsonStr;
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
    jsonStr = await fs.readFile(input.filePath, "utf-8");
  } else if (input.rawText) {
    jsonStr = input.rawText;
  } else {
    throw new Error("Either filePath or rawText must be provided");
  }

  // Parse JSON
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (err) {
    warnings.push({
      code: WARNING_CODES.PARSER_ERROR,
      message: `Invalid JSON: ${err.message}`,
    });
    return {
      parserKey: PARSER_KEY,
      parserVersion: PARSER_VERSION,
      recordType: CYBER_RECORD_TYPES.FINDING,
      records: [],
      rawRecords: [],
      warnings,
      rejectedCount: 0,
      metadata: { parseError: err.message },
    };
  }

  // Extract records from structure
  const { records: rawItems, source } = extractRecords(data);

  if (rawItems.length === 0) {
    warnings.push({
      code: WARNING_CODES.EMPTY_RECORD,
      message: "No records found in JSON",
    });
    return {
      parserKey: PARSER_KEY,
      parserVersion: PARSER_VERSION,
      recordType: CYBER_RECORD_TYPES.FINDING,
      records: [],
      rawRecords: [],
      warnings,
      rejectedCount: 0,
      metadata: { source },
    };
  }

  // Check record count limit
  const maxRecords = input.maxRecords || PARSER_LIMITS.MAX_RECORDS;
  if (rawItems.length > maxRecords) {
    warnings.push({
      code: WARNING_CODES.SIZE_LIMIT_EXCEEDED,
      message: `Record count ${rawItems.length} exceeds limit of ${maxRecords}`,
    });
  }

  // Process records
  let rejectedCount = 0;
  for (let i = 0; i < Math.min(rawItems.length, maxRecords); i++) {
    const rawRecord = rawItems[i];
    rawRecords.push(rawRecord);

    const normalized = normalizeRecord(rawRecord, i, warnings);
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
      source,
      totalRecords: rawItems.length,
      processedRecords: records.length,
    },
  };
}

/**
 * Check if this parser can handle the input
 */
async function canHandle(input) {
  // Check MIME type
  if (input.mimeType === "application/json") {
    return true;
  }

  // Check file extension
  if (input.filePath && input.filePath.endsWith(".json")) {
    return true;
  }

  // Check if raw text is valid JSON
  if (input.rawText) {
    try {
      JSON.parse(input.rawText);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

// Create and register parser
const genericJsonParser = {
  key: PARSER_KEY,
  version: PARSER_VERSION,
  supportedMimeTypes: ["application/json"],
  supportedExtensions: [".json"],
  canHandle,
  parse,
};

registerParser(genericJsonParser);
module.exports = genericJsonParser;
