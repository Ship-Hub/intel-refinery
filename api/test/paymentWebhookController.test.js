const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const {
  buildWebhookHandler
} = require(
  "../src/payments/controllers/webhookController"
);

const createResponse =
  () => ({
    statusCode:
      200,
    body:
      null,
    status(code) {
      this.statusCode =
        code;
      return this;
    },
    json(body) {
      this.body =
        body;
      return this;
    }
  });

test(
  "verified successful webhook marks payment paid and attempt paid",
  async () => {
    const calls =
      [];
    const handler =
      buildWebhookHandler({
        providerCode:
          "stripe",
        provider: {
          verifyWebhook:
            () => true,
          normalizeWebhook:
            () => ({
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
            })
        },
        services: {
          recordWebhookEvent:
            async () => ({
              duplicate:
                false
            }),
          getPaymentByAttemptReference:
            async () => ({
              id:
                11,
              paymentAttemptId:
                22
            }),
          markPaymentPaid:
            async (input) =>
              calls.push([
                "paid",
                input
              ]),
          markPaymentFailed:
            async (input) =>
              calls.push([
                "failed",
                input
              ]),
          markPaymentAttemptStatus:
            async (input) =>
              calls.push([
                "attempt",
                input
              ]),
          markWebhookProcessed:
            async (input) =>
              calls.push([
                "processed",
                input
              ])
        }
      });
    const res =
      createResponse();

    await handler(
      {
        body:
          Buffer.from(
            '{"id":"evt_1"}'
          ),
        headers: {}
      },
      res
    );

    assert.equal(
      res.statusCode,
      200
    );
    assert.deepEqual(
      calls,
      [
        [
          "paid",
          {
            paymentId:
              11,
            providerPaymentId:
              "pi_1"
          }
        ],
        [
          "attempt",
          {
            paymentAttemptId:
              22,
            status:
              "paid"
          }
        ],
        [
          "processed",
          {
            providerCode:
              "stripe",
            providerEventId:
              "evt_1"
          }
        ]
      ]
    );
  }
);

test(
  "verified failed webhook marks payment failed and attempt failed",
  async () => {
    const calls =
      [];
    const handler =
      buildWebhookHandler({
        providerCode:
          "paystack",
        provider: {
          verifyWebhook:
            () => true,
          normalizeWebhook:
            () => ({
              eventId:
                "evt_failed",
              eventType:
                "charge.failed",
              paymentReference:
                "ref_failed",
              providerPaymentId:
                "43",
              attemptStatus:
                "failed",
              isSuccessful:
                false
            })
        },
        services: {
          recordWebhookEvent:
            async () => ({
              duplicate:
                false
            }),
          getPaymentByAttemptReference:
            async () => ({
              id:
                12,
              paymentAttemptId:
                23
            }),
          markPaymentPaid:
            async (input) =>
              calls.push([
                "paid",
                input
              ]),
          markPaymentFailed:
            async (input) =>
              calls.push([
                "failed",
                input
              ]),
          markPaymentAttemptStatus:
            async (input) =>
              calls.push([
                "attempt",
                input
              ]),
          markWebhookProcessed:
            async (input) =>
              calls.push([
                "processed",
                input
              ])
        }
      });
    const res =
      createResponse();

    await handler(
      {
        body:
          Buffer.from(
            '{"id":"evt_failed"}'
          ),
        headers: {}
      },
      res
    );

    assert.equal(
      res.statusCode,
      200
    );
    assert.deepEqual(
      calls,
      [
        [
          "failed",
          {
            paymentId:
              12
          }
        ],
        [
          "attempt",
          {
            paymentAttemptId:
              23,
            status:
              "failed"
          }
        ],
        [
          "processed",
          {
            providerCode:
              "paystack",
            providerEventId:
              "evt_failed"
          }
        ]
      ]
    );
  }
);

test(
  "duplicate webhook returns success without reprocessing",
  async () => {
    let processed =
      false;
    const handler =
      buildWebhookHandler({
        providerCode:
          "coinbase_commerce",
        provider: {
          verifyWebhook:
            () => true,
          normalizeWebhook:
            () => ({
              eventId:
                "evt_dup",
              eventType:
                "charge:confirmed",
              paymentReference:
                "code_dup",
              providerPaymentId:
                "charge_dup",
              attemptStatus:
                "paid",
              isSuccessful:
                true
            })
        },
        services: {
          recordWebhookEvent:
            async () => ({
              duplicate:
                true
            }),
          getPaymentByAttemptReference:
            async () => {
              processed =
                true;
            },
          markPaymentPaid:
            async () => {
              processed =
                true;
            },
          markPaymentFailed:
            async () => {
              processed =
                true;
            },
          markPaymentAttemptStatus:
            async () => {
              processed =
                true;
            },
          markWebhookProcessed:
            async () => {
              processed =
                true;
            }
        }
      });
    const res =
      createResponse();

    await handler(
      {
        body:
          Buffer.from(
            '{"id":"evt_dup"}'
          ),
        headers: {}
      },
      res
    );

    assert.equal(
      res.statusCode,
      200
    );
    assert.equal(
      processed,
      false
    );
    assert.equal(
      res.body.data.duplicate,
      true
    );
  }
);
