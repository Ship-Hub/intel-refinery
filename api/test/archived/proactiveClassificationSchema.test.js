const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  proactiveClassificationSchema
} = require(
  "../src/validators/proactiveClassificationSchema"
);

test(
  "proactive schema accepts recent messages and local signal",
  () => {
    const parsed =
      proactiveClassificationSchema.parse({
        messages: [
          {
            text:
              "you lied"
          }
        ],
        localSignal: {
          category:
            "moderation_triage",
          confidence:
            0.9
        }
      });

    assert.equal(
      parsed.directRequest,
      false
    );
  }
);
