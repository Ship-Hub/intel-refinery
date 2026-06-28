const stripe = require("./stripeProvider");
const paystack = require("./paystackProvider");
const coinbaseCommerce = require("./coinbaseCommerceProvider");

const providers = {
  stripe,
  paystack,
  coinbase_commerce: coinbaseCommerce
};

const getProvider = (name) => {
  const provider = providers[name];

  if (!provider) {
    throw new Error(`Unsupported payment provider: ${name}`);
  }

  return provider;
};

const listProviderCodes =
  () =>
    Object.keys(
      providers
    );

module.exports = {
  getProvider,
  listProviderCodes
};
