const axios =
  require("axios");

const env =
  require(
    "../../config/env"
  );

const {
  createOrGetOAuthUser
} = require(
  "../../accounts/services/userIdentityService"
);

const {
  createUserSession
} = require(
  "../services/sessionService"
);

const GITHUB_AUTHORIZE_URL =
  "https://github.com/login/oauth/authorize";

const GITHUB_TOKEN_URL =
  "https://github.com/login/oauth/access_token";

const GITHUB_USER_URL =
  "https://api.github.com/user";

const GITHUB_EMAILS_URL =
  "https://api.github.com/user/emails";

// Derive the public-facing base URL from the incoming request
// (works for ngrok, local dev, and production without extra config)
const getApiBase = (req) => {
  const proto =
    req.get(
      "x-forwarded-proto"
    ) ||
    req.protocol;
  const host =
    req.get(
      "x-forwarded-host"
    ) ||
    req.get("host");
  return `${proto}://${host}`;
};

const getAuthFrontendBase = (req) => {
  const configured =
    env.AUTH_FRONTEND_BASE_URL ||
    env.FRONTEND_BASE_URL ||
    getApiBase(req);

  try {
    const url =
      new URL(configured);
    if (url.hostname.startsWith("app.")) {
      url.hostname =
        url.hostname.slice(4);
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return configured;
  }
};

const githubRedirect =
  (req, res) => {
    if (!env.GITHUB_CLIENT_ID) {
      return res
        .status(503)
        .send(
          "GitHub OAuth is not configured on this server."
        );
    }

    const callbackUrl =
      `${getApiBase(req)}/auth/github/callback`;

    const params =
      new URLSearchParams({
        client_id:
          env.GITHUB_CLIENT_ID,
        redirect_uri:
          callbackUrl,
        scope:
          "user:email",
        state:
          "intel-engine"
      });

    res.redirect(
      `${GITHUB_AUTHORIZE_URL}?${params}`
    );
  };

const githubCallback =
  async (req, res) => {
    const frontendBase =
      getAuthFrontendBase(req);

    try {
      const {
        code,
        error: oauthError
      } = req.query;

      if (oauthError) {
        throw new Error(
          `GitHub denied access: ${oauthError}`
        );
      }

      if (!code) {
        throw new Error(
          "No authorization code received from GitHub."
        );
      }

      // Exchange code for access token
      const callbackUrl =
        `${getApiBase(req)}/auth/github/callback`;

      const tokenRes =
        await axios.post(
          GITHUB_TOKEN_URL,
          {
            client_id:
              env.GITHUB_CLIENT_ID,
            client_secret:
              env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri:
              callbackUrl
          },
          {
            headers: {
              Accept:
                "application/json"
            }
          }
        );

      const accessToken =
        tokenRes.data
          .access_token;

      if (!accessToken) {
        throw new Error(
          "GitHub did not return an access token."
        );
      }

      const githubHeaders = {
        Authorization:
          `token ${accessToken}`,
        "User-Agent":
          "Intel-Engine-API"
      };

      // Fetch profile + emails in parallel
      const [
        userRes,
        emailsRes
      ] = await Promise.all([
        axios.get(
          GITHUB_USER_URL,
          { headers: githubHeaders }
        ),
        axios.get(
          GITHUB_EMAILS_URL,
          { headers: githubHeaders }
        )
      ]);

      const githubUser =
        userRes.data;

      const emails =
        Array.isArray(
          emailsRes.data
        )
          ? emailsRes.data
          : [];

      // Prefer verified primary email
      const primaryEmail =
        emails.find(
          (e) =>
            e.primary &&
            e.verified
        )?.email ||
        emails.find(
          (e) => e.verified
        )?.email ||
        emails[0]?.email ||
        null;

      const identity =
        await createOrGetOAuthUser({
          provider:
            "github",
          providerUserId:
            String(
              githubUser.id
            ),
          email:
            primaryEmail,
          displayName:
            githubUser.name ||
            githubUser.login,
          metadata: {
            login:
              githubUser.login,
            avatar_url:
              githubUser.avatar_url
          }
        });

      const session =
        await createUserSession({
          userId:
            identity.user.id
        });

      res.redirect(
        `${frontendBase}/auth/callback?token=${encodeURIComponent(session.token)}&provider=github`
      );
    } catch (error) {
      res.redirect(
        `${frontendBase}/auth/callback?error=${encodeURIComponent(error.message)}&provider=github`
      );
    }
  };

module.exports = {
  githubRedirect,
  githubCallback
};
