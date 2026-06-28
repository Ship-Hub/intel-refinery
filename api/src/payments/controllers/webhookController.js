const {
  successResponse,
  errorResponse
} = require(
  "../../middleware/apiResponse"
);
const {
  getProvider
} = require(
  "../providers"
);
const {
  recordWebhookEvent,
  markWebhookProcessed
} = require(
  "../services/webhookService"
);
const {
  getPaymentByAttemptReference,
  markPaymentAttemptStatus,
  markPaymentFailed,
  markPaymentPaid
} = require(
  "../services/paymentService"
);

const buildWebhookHandler =
  ({
    providerCode,
    provider =
      getProvider(
        providerCode
      ),
    services = {
      recordWebhookEvent,
      markWebhookProcessed,
      getPaymentByAttemptReference,
      markPaymentAttemptStatus,
      markPaymentFailed,
      markPaymentPaid
    }
  }) =>
    async (
      req,
      res
    ) => {
      const rawBody =
        Buffer.isBuffer(
          req.body
        )
          ? req.body.toString(
              "utf8"
            )
          : JSON.stringify(
              req.body ||
                {}
            );
      let payload;

      try {
        payload =
          JSON.parse(
            rawBody
          );
      } catch (error) {
        return errorResponse(
          res,
          400,
          "Invalid webhook payload"
        );
      }

      try {
        if (
          !provider.verifyWebhook({
            rawBody,
            headers:
              req.headers
          })
        ) {
          return errorResponse(
            res,
            400,
            "Invalid webhook signature"
          );
        }

        const normalized =
          provider.normalizeWebhook(
            payload
          );
        const recorded =
          await services.recordWebhookEvent({
            providerCode,
            providerEventId:
              normalized.eventId,
            eventType:
              normalized.eventType,
            payload
          });

        if (
          recorded.duplicate
        ) {
          return successResponse(
            res,
            {
              received:
                true,
              duplicate:
                true
            }
          );
        }

        if (
          normalized.paymentReference
        ) {
          const payment =
            await services.getPaymentByAttemptReference({
              providerCode,
              providerReference:
                normalized.paymentReference
            });

          if (payment) {
            if (
              normalized.isSuccessful
            ) {
              await services.markPaymentPaid({
                paymentId:
                  payment.id,
                providerPaymentId:
                  normalized.providerPaymentId
              });
            } else if (
              normalized.attemptStatus ===
                "failed" ||
              normalized.attemptStatus ===
                "expired"
            ) {
              await services.markPaymentFailed({
                paymentId:
                  payment.id
              });
            }

            if (
              normalized.attemptStatus
            ) {
              await services.markPaymentAttemptStatus({
                paymentAttemptId:
                  payment.paymentAttemptId,
                status:
                  normalized.attemptStatus
              });
            }
          }
        }

        await services.markWebhookProcessed({
          providerCode,
          providerEventId:
            normalized.eventId
        });

        return successResponse(
          res,
          {
            received:
              true
          }
        );
      } catch (error) {
        const eventId =
          payload.id ||
          payload.data?.id ||
          null;

        if (
          eventId
        ) {
          await services.markWebhookProcessed({
            providerCode,
            providerEventId:
              String(
                eventId
              ),
            processingError:
              error.message
          }).catch(
            () => {}
          );
        }

        return errorResponse(
          res,
          500,
          error.message
        );
      }
    };

module.exports = {
  handleStripeWebhook:
    buildWebhookHandler({
      providerCode:
        "stripe"
    }),
  handlePaystackWebhook:
    buildWebhookHandler({
      providerCode:
        "paystack"
    }),
  handleCoinbaseWebhook:
    buildWebhookHandler({
      providerCode:
        "coinbase_commerce"
    }),
  buildWebhookHandler
};
