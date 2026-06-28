const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const fs =
  require("node:fs");
const path =
  require("node:path");

test(
  "payment smoke script exposes provider-specific commands",
  () => {
    const packageJson =
      JSON.parse(
        fs.readFileSync(
          path.join(
            __dirname,
            "..",
            "package.json"
          ),
          "utf8"
        )
      );

    assert.equal(
      packageJson.scripts["smoke:payments"],
      "node scripts/paymentProviderSmoke.js all"
    );
    assert.equal(
      packageJson.scripts["smoke:payments:stripe"],
      "node scripts/paymentProviderSmoke.js stripe"
    );
    assert.equal(
      packageJson.scripts["smoke:payments:paystack"],
      "node scripts/paymentProviderSmoke.js paystack"
    );
    assert.equal(
      packageJson.scripts["smoke:payments:coinbase"],
      "node scripts/paymentProviderSmoke.js coinbase_commerce"
    );
  }
);
