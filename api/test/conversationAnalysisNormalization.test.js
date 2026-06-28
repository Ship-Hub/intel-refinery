const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  normalizeConversationAnalysis
} = require(
  "../src/conversations/analyzers/analyzeConversationState"
);

test(
  "conversation analysis normalization fills harmless omissions",
  () => {
    const normalized =
      normalizeConversationAnalysis({
        summary:
          "A short exchange.",
        fudAssessment: {
          confidence:
            0.4
        }
      });

    assert.equal(
      normalized.conversationType,
      "unknown"
    );
    assert.deepEqual(
      normalized.primaryEscalators,
      []
    );
    assert.equal(
      normalized.fudAssessment.classification,
      "uncertain"
    );
  }
);
