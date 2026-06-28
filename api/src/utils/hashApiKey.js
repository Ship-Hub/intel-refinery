const bcrypt =
  require("bcryptjs");

const hashApiKey =
  async (
    apiKey
  ) => {

    return bcrypt.hash(
      apiKey,
      10
    );

};

const compareApiKey =
  async (
    apiKey,
    hash
  ) => {

    return bcrypt.compare(
      apiKey,
      hash
    );

};

module.exports = {

  hashApiKey,

  compareApiKey

};