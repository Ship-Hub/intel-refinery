const axios =
  require("axios");
const env =
  require("../../config/env");
const {
  verifyStripeSignature
} = require("../services/signatureService");

const ensureConfigured =
  () => {
    if (
      !env.STRIPE_SECRET_KEY
    ) {
      throw new Error(
        "STRIPE_SECRET_KEY is required"
      );
    }
  };

const createCheckoutSession =
  async ({
    payment,
    successUrl,
    cancelUrl
  }) => {
    ensureConfigured();

    const params =
      new URLSearchParams({
        mode:
          "payment",
        success_url:
          successUrl,
        cancel_url:
          cancelUrl,
        "line_items[0][price_data][currency]":
          payment.currency
            .toLowerCase(),
        "line_items[0][price_data][product_data][name]":
          payment.description ||
          "Credit top-up",
        "line_items[0][price_data][unit_amount]":
          String(
            payment.amountCents
          ),
        "line_items[0][quantity]":
          "1",
        "metadata[payment_id]":
          String(
            payment.id
          )
      });

    const response =
      await axios.post(
        "https://api.stripe.com/v1/checkout/sessions",
        params,
        {
          headers: {
            Authorization:
              `Bearer ${env.STRIPE_SECRET_KEY}`,
            "Content-Type":
              "application/x-www-form-urlencoded"
          }
        }
      );

    return {
      providerReference:
        response.data.id,
      checkoutUrl:
        response.data.url,
      metadata: {
        paymentIntentId:
          response.data.payment_intent ||
          null
      }
    };
  };

const verifyWebhook =
  ({
    rawBody,
    headers
  }) => {
    if (
      !env.STRIPE_WEBHOOK_SECRET
    ) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is required"
      );
    }

    return verifyStripeSignature({
      rawBody,
      signatureHeader:
        headers["stripe-signature"],
      secret:
        env.STRIPE_WEBHOOK_SECRET
    });
  };

const normalizeWebhook =
  (event) => ({
    eventId:
      event.id,
    eventType:
      event.type,
    paymentReference:
      event.data?.object?.id ||
      null,
    providerPaymentId:
      event.data?.object?.payment_intent ||
      event.data?.object?.id ||
      null,
    attemptStatus:
      event.type ===
      "checkout.session.completed" &&
      event.data?.object?.payment_status ===
        "paid"
        ? "paid"
        : event.type ===
            "checkout.session.expired"
          ? "expired"
          : event.type ===
              "checkout.session.async_payment_failed"
            ? "failed"
            : null,
    isSuccessful:
      event.type ===
      "checkout.session.completed" &&
      event.data?.object?.payment_status ===
        "paid"
  });

module.exports = {
  createCheckoutSession,
  verifyWebhook,
  normalizeWebhook
};
