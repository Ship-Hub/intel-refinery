const axios =
  require("axios");
const env =
  require("../../config/env");
const {
  verifyPaystackSignature
} = require("../services/signatureService");

const ensureConfigured =
  () => {
    if (
      !env.PAYSTACK_SECRET_KEY
    ) {
      throw new Error(
        "PAYSTACK_SECRET_KEY is required"
      );
    }
  };

const createCheckoutSession =
  async ({
    payment,
    email,
    callbackUrl
  }) => {
    ensureConfigured();

    if (
      !email
    ) {
      throw new Error(
        "email is required for Paystack checkout"
      );
    }

    const reference =
      `payment_${payment.id}_${Date.now()}`;
    const response =
      await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount:
            payment.amountCents,
          currency:
            payment.currency,
          reference,
          callback_url:
            callbackUrl,
          metadata: {
            payment_id:
              payment.id
          }
        },
        {
          headers: {
            Authorization:
              `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            "Content-Type":
              "application/json"
          }
        }
      );

    return {
      providerReference:
        response.data.data.reference,
      checkoutUrl:
        response.data.data.authorization_url,
      metadata: {
        accessCode:
          response.data.data.access_code
      }
    };
  };

const verifyWebhook =
  ({
    rawBody,
    headers
  }) => {
    if (
      !env.PAYSTACK_WEBHOOK_SECRET &&
      !env.PAYSTACK_SECRET_KEY
    ) {
      throw new Error(
        "PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY is required"
      );
    }

    return verifyPaystackSignature({
      rawBody,
      signature:
        headers["x-paystack-signature"],
      secret:
        env.PAYSTACK_WEBHOOK_SECRET ||
        env.PAYSTACK_SECRET_KEY
    });
  };

const normalizeWebhook =
  (event) => ({
    eventId:
      event.data?.id
        ? String(
            event.data.id
          )
        : event.event,
    eventType:
      event.event,
    paymentReference:
      event.data?.reference ||
      null,
    providerPaymentId:
      event.data?.id
        ? String(
            event.data.id
          )
        : null,
    attemptStatus:
      event.event ===
      "charge.success" &&
      event.data?.status ===
        "success"
        ? "paid"
        : event.event ===
            "charge.failed" ||
            event.data?.status ===
              "failed"
          ? "failed"
          : null,
    isSuccessful:
      event.event ===
      "charge.success" &&
      event.data?.status ===
        "success"
  });

module.exports = {
  createCheckoutSession,
  verifyWebhook,
  normalizeWebhook
};
