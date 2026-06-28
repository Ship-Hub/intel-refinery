const {
  createPayment,
  createPaymentAttempt
} = require(
  "./paymentService"
);
const stripe =
  require(
    "../providers/stripeProvider"
  );
const paystack =
  require(
    "../providers/paystackProvider"
  );
const coinbase =
  require(
    "../providers/coinbaseCommerceProvider"
  );

const createCheckout =
  async ({
    provider,
    accountId,
    amountCents,
    currency,
    creditsToGrant,
    description,
    email,
    successUrl,
    cancelUrl
  }) => {
    const payment =
      await createPayment({
        accountId,
        amountCents,
        currency,
        creditsToGrant,
        description,
        provider
      });
    let checkout;

    if (
      provider ===
      "stripe"
    ) {
      checkout =
        await stripe.createCheckoutSession({
          payment,
          successUrl,
          cancelUrl
        });
    } else if (
      provider ===
      "paystack"
    ) {
      checkout =
        await paystack.createCheckoutSession({
          payment,
          email,
          callbackUrl:
            successUrl
        });
    } else if (
      provider ===
      "coinbase_commerce"
    ) {
      checkout =
        await coinbase.createCheckoutSession({
          payment,
          redirectUrl:
            successUrl,
          cancelUrl
        });
    } else {
      throw new Error(
        "Unsupported payment provider"
      );
    }

    const attempt =
      await createPaymentAttempt({
        paymentId:
          payment.id,
        providerCode:
          provider,
        providerReference:
          checkout.providerReference,
        checkoutUrl:
          checkout.checkoutUrl,
        metadata:
          checkout.metadata
      });

    return {
      payment,
      attempt
    };
  };

module.exports = {
  createCheckout
};
