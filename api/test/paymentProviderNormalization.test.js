const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const stripe =
  require(
    "../src/payments/providers/stripeProvider"
  );
const paystack =
  require(
    "../src/payments/providers/paystackProvider"
  );
const coinbase =
  require(
    "../src/payments/providers/coinbaseCommerceProvider"
  );

test(
  "provider webhook normalization identifies successful payments",
  () => {
    assert.deepEqual(
      stripe.normalizeWebhook({
        id:
          "evt_1",
        type:
          "checkout.session.completed",
        data: {
          object: {
            id:
              "cs_1",
            payment_intent:
              "pi_1",
            payment_status:
              "paid"
          }
        }
      }),
      {
        eventId:
          "evt_1",
        eventType:
          "checkout.session.completed",
        paymentReference:
          "cs_1",
        providerPaymentId:
          "pi_1",
        attemptStatus:
          "paid",
        isSuccessful:
          true
      }
    );

    assert.deepEqual(
      paystack.normalizeWebhook({
        event:
          "charge.success",
        data: {
          id:
            42,
          reference:
            "ref_1",
          status:
            "success"
        }
      }),
      {
        eventId:
          "42",
        eventType:
          "charge.success",
        paymentReference:
          "ref_1",
        providerPaymentId:
          "42",
        attemptStatus:
          "paid",
        isSuccessful:
          true
      }
    );

    assert.deepEqual(
      coinbase.normalizeWebhook({
        id:
          "evt_cb_1",
        type:
          "charge:confirmed",
        data: {
          id:
            "charge_1",
          code:
            "code_1"
        }
      }),
      {
        eventId:
          "evt_cb_1",
        eventType:
          "charge:confirmed",
        paymentReference:
          "code_1",
        providerPaymentId:
          "charge_1",
        attemptStatus:
          "paid",
        isSuccessful:
          true
      }
    );
  }
);

test(
  "provider webhook normalization maps terminal non-payment states",
  () => {
    assert.equal(
      stripe.normalizeWebhook({
        id:
          "evt_expired",
        type:
          "checkout.session.expired",
        data: {
          object: {
            id:
              "cs_expired"
          }
        }
      }).attemptStatus,
      "expired"
    );

    assert.equal(
      paystack.normalizeWebhook({
        event:
          "charge.failed",
        data: {
          id:
            43,
          reference:
            "ref_failed",
          status:
            "failed"
        }
      }).attemptStatus,
      "failed"
    );

    assert.equal(
      coinbase.normalizeWebhook({
        id:
          "evt_failed",
        type:
          "charge:failed",
        data: {
          id:
            "charge_failed",
          code:
            "code_failed"
        }
      }).attemptStatus,
      "failed"
    );
  }
);
