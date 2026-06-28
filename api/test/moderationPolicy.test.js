const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  decideProactiveAction
} = require(
  "../src/moderation/moderationPolicy"
);

test(
  "moderation policy stays quiet on weak signals and offers help on sustained strong ones",
  () => {
    assert.equal(
      decideProactiveAction({
        category:
          "moderation_triage",
        confidence:
          0.6,
        messageCount:
          5
      }).action,
      "observe"
    );
    assert.equal(
      decideProactiveAction({
        category:
          "moderation_triage",
        confidence:
          0.95,
        messageCount:
          3
      }).action,
      "offer_help"
    );
    assert.equal(
      decideProactiveAction({
        category:
          "summary",
        confidence:
          0.95,
        messageCount:
          1,
        conversationalLevel:
          1
      }).action,
      "observe"
    );
    assert.equal(
      decideProactiveAction({
        category:
          "casual_qa",
        confidence:
          0.95,
        messageCount:
          1,
        conversationalLevel:
          3
      }).action,
      "respond"
    );
  }
);
