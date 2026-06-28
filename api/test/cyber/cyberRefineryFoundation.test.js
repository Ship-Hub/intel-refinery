const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createProjectV1Schema,
  updateProjectV1Schema,
  createSourceV1Schema,
  createSourcePackageV1Schema,
  updateSourceV1Schema,
} = require("../../src/accounts/validators/v1Schemas");
const { calculateCyberReadiness } = require("../../src/refinery/readiness/cyberReadinessService");
const { resolveProtocolId } = require("../../src/research/protocolResolver");

test("v1 project schema accepts Cyber Refinery profile and intent", () => {
  const parsed = createProjectV1Schema.parse({
    title: "Quarterly exposure review",
    refineryProfile: "cyber",
    intent: "vulnerability_review",
    mode: "deep",
  });

  assert.equal(parsed.refineryProfile, "cyber");
  assert.equal(parsed.intent, "vulnerability_review");
  assert.equal(parsed.mode, "deep");
});

test("v1 project schema defaults to the general profile", () => {
  const parsed = createProjectV1Schema.parse({
    title: "General research project",
  });

  assert.equal(parsed.refineryProfile, "general");
  assert.equal(parsed.mode, "quick");
});

test("v1 update schema accepts Cyber lifecycle statuses", () => {
  const parsed = updateProjectV1Schema.parse({
    status: "ready_for_refinement",
    intent: "incident_review",
  });

  assert.equal(parsed.status, "ready_for_refinement");
  assert.equal(parsed.intent, "incident_review");
});

test("v1 source update schema accepts Cyber source workspace fields", () => {
  const parsed = updateSourceV1Schema.parse({
    displayName: "Tenable June export",
    sourceCategory: "vulnerability_scan",
    inclusionState: "needs_review",
    sourceNotes: "Validate duplicate host records before refinement.",
  });

  assert.equal(parsed.sourceCategory, "vulnerability_scan");
  assert.equal(parsed.inclusionState, "needs_review");
});

test("v1 source create schema accepts package and Cyber category fields", () => {
  const parsed = createSourceV1Schema.parse({
    sourceType: "url",
    uri: "https://example.com/advisory?id=123",
    sourceCategory: "security_advisory",
    sourcePackageId: "11111111-1111-4111-8111-111111111111",
    displayName: "Vendor advisory",
  });

  assert.equal(parsed.sourceType, "url");
  assert.equal(parsed.sourceCategory, "security_advisory");
  assert.equal(parsed.displayName, "Vendor advisory");
});

test("v1 source create schema accepts long browser URLs", () => {
  const longQuery = "a".repeat(1800);
  const parsed = createSourceV1Schema.parse({
    sourceType: "url",
    uri: `https://www.google.com/search?q=${longQuery}`,
    sourceCategory: "other",
    displayName: "Search result",
  });

  assert.equal(parsed.sourceType, "url");
  assert.equal(parsed.uri.includes(longQuery), true);
});

test("v1 source package schema accepts manual ingestion packages", () => {
  const parsed = createSourcePackageV1Schema.parse({
    name: "June scanner export",
    packageType: "manual_ingestion",
    sourceSystem: "tenable",
    metadata: { exportedBy: "analyst" },
  });

  assert.equal(parsed.name, "June scanner export");
  assert.equal(parsed.sourceSystem, "tenable");
});

test("Cyber readiness blocks projects with no sources", () => {
  const readiness = calculateCyberReadiness({
    project: { id: "project-1", profileKey: "cyber", intent: "cyber_assessment" },
    sources: [],
  });

  assert.equal(readiness.isReady, false);
  assert.equal(readiness.counts.totalSources, 0);
  assert.match(readiness.blockingIssues[0], /Add at least one included source/);
});

test("Cyber readiness accepts normalized included sources with content", () => {
  const readiness = calculateCyberReadiness({
    project: { id: "project-1", profileKey: "cyber", intent: "vulnerability_review" },
    sources: [
      {
        id: "source-1",
        status: "normalized",
        inclusionState: "included",
        sourceCategory: "vulnerability_scan",
        extractedText: "Critical CVE findings on externally exposed hosts.",
      },
      {
        id: "source-2",
        status: "chunked",
        inclusionState: "included",
        sourceCategory: "asset_inventory",
        rawText: "Asset inventory export.",
      },
    ],
  });

  assert.equal(readiness.isReady, true);
  assert.equal(readiness.counts.readySources, 2);
  assert.equal(readiness.counts.categories, 2);
  assert.equal(readiness.blockingIssues.length, 0);
});

test("Cyber profile resolves Cyber protocol bundle ids", () => {
  assert.equal(
    resolveProtocolId("observe", { profileKey: "cyber" }),
    "cyber/observation/source"
  );
  assert.equal(
    resolveProtocolId("connect", { profileKey: "cyber" }),
    "cyber/connection/artifact"
  );
  assert.equal(
    resolveProtocolId("observe", { profileKey: "general" }),
    "observation/source"
  );
});
