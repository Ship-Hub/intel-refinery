const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { CYBER_RECORD_TYPES, WARNING_CODES } = require("../../src/parsers/contract");

// Load parser (this triggers registration)
require("../../src/parsers/genericCsvParser");
const { getParser } = require("../../src/parsers/registry");

const parser = getParser("generic-csv");
const fixturesDir = path.join(__dirname, "../fixtures/cyber/generic-csv");

test("generic CSV parser is registered", () => {
  assert.ok(parser);
  assert.equal(parser.key, "generic-csv");
  assert.equal(parser.version, "1.0.0");
});

test("parser can handle CSV files", async () => {
  assert.equal(await parser.canHandle({ mimeType: "text/csv" }), true);
  assert.equal(await parser.canHandle({ filePath: "/path/to/file.csv" }), true);
});

test("parser cannot handle non-CSV files", async () => {
  assert.equal(await parser.canHandle({ mimeType: "application/json" }), false);
  assert.equal(await parser.canHandle({ filePath: "/path/to/file.json" }), false);
});

test("findings CSV parses correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "findings.csv"),
  });

  assert.equal(result.parserKey, "generic-csv");
  assert.equal(result.recordType, CYBER_RECORD_TYPES.FINDING);
  assert.equal(result.records.length, 3);
  assert.equal(result.rejectedCount, 0);

  const first = result.records[0];
  assert.equal(first.title, "SQL Injection in login");
  assert.equal(first.originalSeverity, "critical");
  assert.equal(first.cveIds.length, 1);
  assert.equal(first.cveIds[0], "CVE-2024-11111");
  assert.equal(first.networkContext.port, 443);
  assert.equal(first.networkContext.ip, "192.168.1.10");
  assert.equal(first.sourceRowNumber, 2);
});

test("asset inventory CSV parses correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "asset-inventory.csv"),
  });

  assert.equal(result.records.length, 4);
  assert.equal(result.metadata.headers.length, 8);
});

test("quoted commas handled correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "quoted-commas.csv"),
  });

  assert.equal(result.records.length, 2);
  assert.ok(result.records[0].description.includes(","));
});

test("multiline descriptions handled correctly", async () => {
  const result = await parser.parse({
    filePath: path.join(fixturesDir, "multiline-description.csv"),
  });

  assert.equal(result.records.length, 2);
  assert.ok(result.records[0].description.includes("\n"));
});

test("missing headers generates warning", async () => {
  const result = await parser.parse({
    rawText: "unknown1,unknown2\nvalue1,value2",
  });

  assert.equal(result.records.length, 1);
});

test("duplicate headers generates warning", async () => {
  const result = await parser.parse({
    rawText: "title,title,severity\nTest,Test2,high",
  });

  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.UNKNOWN_FIELD));
});

test("invalid port generates warning", async () => {
  const result = await parser.parse({
    rawText: "title,port\nTest,99999",
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.INVALID_PORT));
});

test("invalid CVE generates warning", async () => {
  const result = await parser.parse({
    rawText: "title,cve\nTest,CVE-123",
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.INVALID_CVE));
});

test("empty rows are rejected", async () => {
  const result = await parser.parse({
    rawText: "title,severity\nTest,high\n\n,",
  });

  assert.equal(result.records.length, 1);
});

test("row numbers are tracked", async () => {
  const result = await parser.parse({
    rawText: "title,severity\nFirst,high\nSecond,medium\nThird,low",
  });

  assert.equal(result.records.length, 3);
  assert.equal(result.records[0].sourceRowNumber, 2);
  assert.equal(result.records[1].sourceRowNumber, 3);
  assert.equal(result.records[2].sourceRowNumber, 4);
});

test("severity normalization works", async () => {
  const result = await parser.parse({
    rawText: "title,severity\nTest1,CRITICAL\nTest2,High\nTest3,moderate",
  });

  assert.equal(result.records.length, 3);
  assert.equal(result.records[0].originalSeverity, "CRITICAL");
  assert.equal(result.records[1].originalSeverity, "High");
  assert.equal(result.records[2].originalSeverity, "moderate");
});

test("CVE parsing works", async () => {
  const result = await parser.parse({
    rawText: "title,cve\nTest,CVE-2024-11111;CVE-2024-22222",
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].cveIds.length, 2);
});

test("formula injection prevention works", async () => {
  const result = await parser.parse({
    rawText: "title,severity\n=cmd|'/c calc'!A0,high",
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.records[0].title.startsWith("'"));
});

test("semicolon delimiter detected", async () => {
  const result = await parser.parse({
    rawText: "title;severity\nTest;high",
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.metadata.delimiter, ";");
});

test("tab delimiter detected", async () => {
  const result = await parser.parse({
    rawText: "title\tseverity\nTest\thigh",
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.metadata.delimiter, "\t");
});

test("max records limit enforced", async () => {
  const rows = Array.from({ length: 100 }, (_, i) => `Title ${i},high`).join("\n");
  const result = await parser.parse({
    rawText: `title,severity\n${rows}`,
    maxRecords: 10,
  });

  assert.equal(result.records.length, 10);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.SIZE_LIMIT_EXCEEDED));
});

test("empty CSV generates warning", async () => {
  const result = await parser.parse({
    rawText: "\n",
  });

  assert.equal(result.records.length, 0);
  assert.ok(result.warnings.some((w) => w.code === WARNING_CODES.EMPTY_RECORD));
});

test("large row behavior", async () => {
  const largeField = "x".repeat(10000);
  const result = await parser.parse({
    rawText: `title,description\nTest,"${largeField}"`,
  });

  assert.equal(result.records.length, 1);
  assert.ok(result.records[0].description.length <= 50000);
});
