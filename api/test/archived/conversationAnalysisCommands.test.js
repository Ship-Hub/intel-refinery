const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  isBotCommandMessage
} = require(
  "../src/conversations/services/runConversationAnalysis"
);

test(
  "conversation analysis excludes bot commands from summary content",
  () => {
    assert.equal(
      isBotCommandMessage(
        "/analyze_image@dispute_analyzer_bot"
      ),
      true
    );
    assert.equal(
      isBotCommandMessage(
        "/analyze@dispute_analyzer_bot"
      ),
      true
    );
    assert.equal(
      isBotCommandMessage(
        "This is normal conversation text."
      ),
      false
    );
  }
);
