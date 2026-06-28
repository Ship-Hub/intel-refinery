const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const {
  nextReportAt
} = require(
  "../src/moderatorAudits/services/frequency"
);

test(
  "moderator audit frequencies advance correctly",
  () => {
    const start =
      new Date(
        "2026-05-16T00:00:00.000Z"
      );

    assert.equal(
      nextReportAt(
        "daily",
        start
      ).toISOString(),
      "2026-05-17T00:00:00.000Z"
    );
    assert.equal(
      nextReportAt(
        "biweekly",
        start
      ).toISOString(),
      "2026-05-30T00:00:00.000Z"
    );
  }
);
