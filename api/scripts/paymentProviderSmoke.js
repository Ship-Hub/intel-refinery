require(
  "dotenv"
).config();

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

const amountCents =
  Number(
    process.env.PAYMENT_SMOKE_AMOUNT_CENTS ||
      100
  );
const currency =
  process.env.PAYMENT_SMOKE_CURRENCY ||
  "USD";
const successUrl =
  process.env.PAYMENT_SMOKE_SUCCESS_URL;
const cancelUrl =
  process.env.PAYMENT_SMOKE_CANCEL_URL;
const email =
  process.env.PAYMENT_SMOKE_EMAIL;
const selectedProvider =
  process.argv[2] ||
  "all";

const payment =
  {
    id:
      `smoke-${Date.now()}`,
    amountCents,
    currency,
    description:
      "Payment provider smoke test"
  };

const requireEnv =
  (
    names
  ) => {
    const missing =
      names.filter(
        (name) =>
          !process.env[name]
      );

    if (
      missing.length >
      0
    ) {
      throw new Error(
        `Missing required smoke env: ${missing.join(
          ", "
        )}`
      );
    }
  };

const runStripe =
  async () => {
    requireEnv([
      "STRIPE_SECRET_KEY",
      "PAYMENT_SMOKE_SUCCESS_URL",
      "PAYMENT_SMOKE_CANCEL_URL"
    ]);

    return stripe.createCheckoutSession({
      payment,
      successUrl,
      cancelUrl
    });
  };

const runPaystack =
  async () => {
    requireEnv([
      "PAYSTACK_SECRET_KEY",
      "PAYMENT_SMOKE_EMAIL",
      "PAYMENT_SMOKE_SUCCESS_URL"
    ]);

    return paystack.createCheckoutSession({
      payment,
      email,
      callbackUrl:
        successUrl
    });
  };

const runCoinbase =
  async () => {
    requireEnv([
      "COINBASE_COMMERCE_API_KEY",
      "PAYMENT_SMOKE_SUCCESS_URL",
      "PAYMENT_SMOKE_CANCEL_URL"
    ]);

    return coinbase.createCheckoutSession({
      payment,
      redirectUrl:
        successUrl,
      cancelUrl
    });
  };

const runners =
  {
    stripe:
      runStripe,
    paystack:
      runPaystack,
    coinbase_commerce:
      runCoinbase
  };

const summarize =
  (
    provider,
    checkout
  ) => ({
    provider,
    providerReference:
      checkout.providerReference,
    checkoutUrl:
      checkout.checkoutUrl
  });

const main =
  async () => {
    const providerNames =
      selectedProvider ===
      "all"
        ? Object.keys(
            runners
          )
        : [
            selectedProvider
          ];

    if (
      providerNames.some(
        (provider) =>
          !runners[provider]
      )
    ) {
      throw new Error(
        "Provider must be one of: stripe, paystack, coinbase_commerce, all"
      );
    }

    const results =
      [];

    for (
      const provider of providerNames
    ) {
      const checkout =
        await runners[provider]();
      results.push(
        summarize(
          provider,
          checkout
        )
      );
    }

    process.stdout.write(
      `${JSON.stringify(
        {
          ok:
            true,
          amountCents,
          currency,
          results
        },
        null,
        2
      )}\n`
    );
  };

main().catch(
  (error) => {
    process.stderr.write(
      `${JSON.stringify(
        {
          ok:
            false,
          error:
            error.message
        },
        null,
        2
      )}\n`
    );
    process.exitCode =
      1;
  }
);
