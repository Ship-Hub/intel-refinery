const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createProjectV1Schema,
  updateProjectV1Schema,
  updateSourceV1Schema,
} = require("../src/accounts/validators/v1Schemas");
const { calculateCyberReadiness } = require("../src/refinery/readiness/cyberReadinessService");

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
