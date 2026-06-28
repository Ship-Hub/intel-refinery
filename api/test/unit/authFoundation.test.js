const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const {
  googleAuthSchema
} = require(
  "../../src/auth/validators/authSchemas"
);

test(
  "google auth schema requires an id token",
  () => {
    assert.equal(
      googleAuthSchema.safeParse({
        idToken:
          "token"
      }).success,
      true
    );
    assert.equal(
      googleAuthSchema.safeParse(
        {}
      ).success,
      false
    );
  }
);
