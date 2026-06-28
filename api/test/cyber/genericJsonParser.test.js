const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { CYBER_RECORD_TYPES, WARNING_CODES } = require("../../src/parsers/contract");

// Load parser (this triggers registration)
require("../../src/parsers/genericJsonParser");
const { getParser } = require("../../src/parsers/registry");

const parser = getParser("generic-json");
const fixturesDir = path.join(__dirname, "../fixtures/cyber/generic-json");

test("generic JSON parser is registered", () => {
  assert.ok(parser);
  assert.equal(parser.key, "generic-json");
  assert.equal(parser.version, "1.0.0");
});

test("parser can handle JSON files", async () => {
  assert.equal(await parser.canHandle({ mimeType: "application/json" }), true);
  assert.equal(await parser.canHandle({ filePath: "/path/to/file.json" }), true);
  assert.equal(await parser.canHandle({ rawText: '{"key": "value"}' }), true);
});

test("parser cannot handle non-JSON files", async () => {
  assert.equal(await parser.canHandle({ mimeType: "text/csv" }), false);
  assert.equal(await parser.canHandle({ filePath: "/path/to/file.csv" }), false);
});

test("single record parses correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "single-finding.json"),
  });

  assert.equal(result.parserKey, "generic-json");
  assert.equal(result.recordType, CYBER_RECORD_TYPES.FINDING);
  assert.equal(result.records.length, 1);
  assert.equal(result.rejectedCount, 0);

  const record = result.records[0];
  assert.equal(record.title, "Exposed administrative interface");
  assert.equal(record.originalSeverity, "high");
  assert.equal(record.cveIds.length, 1);
  assert.equal(record.cveIds[0], "CVE-2024-12345");
  assert.equal(record.cweIds.length, 1);
  assert.equal(record.cweIds[0], "CWE-284");
  assert.equal(record.networkContext.port, 443);
  assert.equal(record.networkContext.ip, "203.0.113.50");
  assert.equal(record.assetIdentifiers.length, 2); // hostname + ip
  assert.ok(record.recordHash);
});

test("multiple records parse correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "multiple-findings.json"),
  });

  assert.equal(result.records.length, 3);
  assert.equal(result.rejectedCount, 0);
  assert.equal(result.metadata.totalRecords, 3);
  assert.equal(result.metadata.processedRecords, 3);

  assert.equal(result.records[0].title, "SQL Injection in login form");
  assert.equal(result.records[0].originalSeverity, "critical");
  assert.equal(result.records[1].title, "Missing security headers");
  assert.equal(result.records[2].title, "Outdated TLS version");
});

test("nested collection parses correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "nested-collection.json"),
  });

  assert.equal(result.records.length, 2);
  assert.equal(result.metadata.source, "findings");
  assert.equal(result.records[0].title, "Cross-Site Scripting (XSS)");
});

test("unknown wrapper parses correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "unknown-wrapper.json"),
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.metadata.source, "data.results");
  assert.equal(result.records[0].title, "Insecure Deserialization");
});

test("missing title generates warning", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "missing-title.json"),
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.MISSING_TITLE));
});

test("invalid severity generates warning", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "invalid-severity.json"),
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.INVALID_SEVERITY));
  assert.equal(result.records[0].originalSeverity, "SUPER_CRITICAL");
});

test("multiple CVEs parse correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "multiple-cves.json"),
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].cveIds.length, 3);
  assert.equal(result.records[0].cweIds.length, 2);
});

test("unknown fields preserved in rawMetadata", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "unknown-fields.json"),
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.records[0].rawMetadata);
  assert.equal(result.records[0].rawMetadata.custom_field_1, "custom value 1");
  assert.equal(result.records[0].rawMetadata.internal_score, 42);
  assert.deepEqual(result.records[0].rawMetadata.tags, ["web", "api", "critical-path"]);
});

test("empty object generates warning", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "empty.json"),
  });

  assert.equal(result.records.length, 0);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.EMPTY_RECORD));
});

test("empty array generates warning", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "empty-array.json"),
  });

  assert.equal(result.records.length, 0);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.EMPTY_RECORD));
});

test("malformed JSON generates error", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "../invalid/malformed.json"),
  });

  assert.equal(result.records.length, 0);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.PARSER_ERROR));
});

test("raw text parsing works", async () => {
  const result = await parser.parse({
    rawText: JSON.stringify({
      title: "Test finding",
      severity: "high",
      cve: "CVE-2024-12345",
    }),
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].title, "Test finding");
});

test("max records limit enforced", async () => {
  const records = Array.from({ length: 100 }, (_, i) => ({
    title: `Finding ${i}`,
    severity: "medium",
  }));

  const result = await parser.parse({
    rawText: JSON.stringify(records),
    maxRecords: 10,
  });

  assert.equal(result.records.length, 10);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.SIZE_LIMIT_EXCEEDED));
});

test("severity normalization works", async () => {
  const result = await parser.parse({
    rawText: JSON.stringify([
      { title: "Test 1", severity: "CRITICAL" },
      { title: "Test 2", severity: "High" },
      { title: "Test 3", severity: "moderate" },
      { title: "Test 4", severity: "LOW" },
      { title: "Test 5", severity: "informational" },
    ]),
  });

  assert.equal(result.records.length, 5);
  assert.equal(result.records[0].originalSeverity, "CRITICAL");
  assert.equal(result.records[1].originalSeverity, "High");
  assert.equal(result.records[2].originalSeverity, "moderate");
  assert.equal(result.records[3].originalSeverity, "LOW");
  assert.equal(result.records[4].originalSeverity, "informational");
});

test("CVE validation works", async () => {
  const result = await parser.parse({
    rawText: JSON.stringify({
      title: "CVE test",
      severity: "high",
      cve: ["CVE-2024-12345", "invalid-cve", "CVE-123"],
    }),
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].cveIds.length, 1);
  assert.equal(result.records[0].cveIds[0], "CVE-2024-12345");
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.INVALID_CVE));
});

test("timestamps extracted correctly", async () => {
  const result = await parser.parse({
    rawText: JSON.stringify({
      title: "Timestamp test",
      severity: "medium",
      first_seen: "2024-01-15T10:30:00Z",
      last_seen: "2024-06-28T14:22:00Z",
    }),
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.records[0].timestamps);
  assert.equal(result.records[0].timestamps.firstSeen, "2024-01-15T10:30:00.000Z");
  assert.equal(result.records[0].timestamps.lastSeen, "2024-06-28T14:22:00.000Z");
});

test("network context extracted correctly", async () => {
  const result = await parser.parse({
    rawText: JSON.stringify({
      title: "Network test",
      severity: "medium",
      ip: "192.168.1.10",
      port: "443",
      protocol: "https",
    }),
  });

  assert.equal(result.records.length, 1);
  assert.deepEqual(result.records[0].networkContext, {
    ip: "192.168.1.10",
    port: 443,
    protocol: "https",
  });
});
