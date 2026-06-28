const {
  OAuth2Client
} = require(
  "google-auth-library"
);
const env =
  require("../../config/env");

const verifyGoogleIdToken =
  async (
    idToken
  ) => {
    if (
      !env.GOOGLE_CLIENT_ID
    ) {
      throw new Error(
        "GOOGLE_CLIENT_ID is required"
      );
    }

    const client =
      new OAuth2Client(
        env.GOOGLE_CLIENT_ID
      );
    const ticket =
      await client.verifyIdToken({
        idToken,
        audience:
          env.GOOGLE_CLIENT_ID
      });
    const profile =
      ticket.getPayload();

    if (
      !profile ||
      !profile.email_verified
    ) {
      throw new Error(
        "Invalid Google ID token"
      );
    }

    return {
      googleUserId:
        profile.sub,
      email:
        profile.email,
      displayName:
        profile.name ||
        profile.email,
      picture:
        profile.picture ||
        null
    };
  };

module.exports = {
  verifyGoogleIdToken
};
