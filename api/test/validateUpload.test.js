const test =
  require("node:test");
const assert =
  require("node:assert/strict");

const {
  validateUpload
} = require(
  "../src/security/validateUpload"
);

test(
  "audio uploads over 5 MB are rejected",
  () => {
    const result =
      validateUpload({
        originalname:
          "voice.ogg",
        size:
          5000001,
        path:
          "missing"
      });

    assert.equal(
      result.success,
      false
    );
    assert.match(
      result.error,
      /5MB/
    );
  }
);
