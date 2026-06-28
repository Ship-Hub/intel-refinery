const {
  z
} = require(
  "zod"
);

const googleAuthSchema =
  z.object({
    idToken:
      z.string()
        .min(1)
  });

module.exports = {
  googleAuthSchema
};
