const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const crypto =
  require("crypto");
const {
  verifyPaystackSignature,
  verifyCoinbaseSignature,
  verifyStripeSignature
} = require(
  "../src/payments/services/signatureService"
);

test(
  "payment webhook signatures verify expected digests",
  () => {
    const rawBody =
      '{"ok":true}';
    const paystackSecret =
      "paystack-secret";
    const coinbaseSecret =
      "coinbase-secret";
    const stripeSecret =
      "stripe-secret";
    const timestamp =
      Math.floor(
        Date.now() /
          1000
      );

    assert.equal(
      verifyPaystackSignature({
        rawBody,
        signature:
          crypto.createHmac(
            "sha512",
            paystackSecret
          )
            .update(
              rawBody
            )
            .digest(
              "hex"
            ),
        secret:
          paystackSecret
      }),
      true
    );
    assert.equal(
      verifyCoinbaseSignature({
        rawBody,
        signature:
          crypto.createHmac(
            "sha256",
            coinbaseSecret
          )
            .update(
              rawBody
            )
            .digest(
              "hex"
            ),
        secret:
          coinbaseSecret
      }),
      true
    );
    assert.equal(
      verifyStripeSignature({
        rawBody,
        signatureHeader:
          `t=${timestamp},v1=${crypto.createHmac(
            "sha256",
            stripeSecret
          )
            .update(
              `${timestamp}.${rawBody}`
            )
            .digest(
              "hex"
            )}`,
        secret:
          stripeSecret
      }),
      true
    );
  }
);
