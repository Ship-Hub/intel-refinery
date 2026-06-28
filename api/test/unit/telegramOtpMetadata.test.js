const test =
  require("node:test");
const assert =
  require("node:assert/strict");

test(
  "telegram otp metadata supports parsed MySQL JSON objects",
  () => {
    const metadata =
      {
        displayName:
          "Jeph",
        username:
          "jeph"
      };

    assert.deepEqual(
      typeof metadata ===
        "string"
        ? JSON.parse(
            metadata
          )
        : metadata,
      {
        displayName:
          "Jeph",
        username:
          "jeph"
      }
    );
  }
);
