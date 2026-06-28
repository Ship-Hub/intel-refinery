const axios =
  require("axios");
const env =
  require("../../config/env");
const {
  verifyCoinbaseSignature
} = require("../services/signatureService");

const ensureConfigured =
  () => {
    if (
      !env.COINBASE_COMMERCE_API_KEY
    ) {
      throw new Error(
        "COINBASE_COMMERCE_API_KEY is required"
      );
    }
  };

const createCheckoutSession =
  async ({
    payment,
    redirectUrl,
    cancelUrl
  }) => {
    ensureConfigured();

    const response =
      await axios.post(
        "https://api.commerce.coinbase.com/charges",
        {
          name:
            payment.description ||
            "Credit top-up",
          description:
            payment.description ||
            "Credit top-up",
          pricing_type:
            "fixed_price",
          local_price: {
            amount:
              (
                payment.amountCents /
                100
              ).toFixed(
                2
              ),
            currency:
              payment.currency
          },
          metadata: {
            payment_id:
              payment.id
          },
          redirect_url:
            redirectUrl,
          cancel_url:
            cancelUrl
        },
        {
          headers: {
            "X-CC-Api-Key":
              env.COINBASE_COMMERCE_API_KEY,
            "X-CC-Version":
              "2018-03-22",
            "Content-Type":
              "application/json"
          }
        }
      );

    return {
      providerReference:
        response.data.data.code,
      checkoutUrl:
        response.data.data.hosted_url,
      metadata: {
        chargeId:
          response.data.data.id
      }
    };
  };

const verifyWebhook =
  ({
    rawBody,
    headers
  }) => {
    if (
      !env.COINBASE_COMMERCE_WEBHOOK_SECRET
    ) {
      throw new Error(
        "COINBASE_COMMERCE_WEBHOOK_SECRET is required"
      );
    }

    return verifyCoinbaseSignature({
      rawBody,
      signature:
        headers["x-cc-webhook-signature"],
      secret:
        env.COINBASE_COMMERCE_WEBHOOK_SECRET
    });
  };

const normalizeWebhook =
  (event) => ({
    eventId:
      event.id,
    eventType:
      event.type,
    paymentReference:
      event.data?.code ||
      null,
    providerPaymentId:
      event.data?.id ||
      null,
    attemptStatus:
      event.type ===
      "charge:confirmed"
        ? "paid"
        : event.type ===
            "charge:failed"
          ? "failed"
          : event.type ===
              "charge:pending"
            ? "pending"
            : null,
    isSuccessful:
      event.type ===
      "charge:confirmed"
  });

module.exports = {
  createCheckoutSession,
  verifyWebhook,
  normalizeWebhook
};
