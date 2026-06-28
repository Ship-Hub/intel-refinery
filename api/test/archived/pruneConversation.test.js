const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  pruneConversation
} = require(
  "../src/conversations/utils/pruneConversation"
);

test(
  "conversation pruning keeps long substantive messages for summaries",
  () => {
    const messages =
      pruneConversation([
        {
          text:
            "x".repeat(
              2500
            )
        }
      ]);

    assert.equal(
      messages.length,
      1
    );
  }
);
