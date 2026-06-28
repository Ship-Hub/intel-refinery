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

const GITLAB_AUTHORIZE_URL =
  "https://gitlab.com/oauth/authorize";

const GITLAB_TOKEN_URL =
  "https://gitlab.com/oauth/token";

const GITLAB_USER_URL =
  "https://gitlab.com/api/v4/user";

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

const gitlabRedirect =
  (req, res) => {
    if (!env.GITLAB_CLIENT_ID) {
      return res
        .status(503)
        .send(
          "GitLab OAuth is not configured on this server."
        );
    }

    const callbackUrl =
      `${getApiBase(req)}/auth/gitlab/callback`;

    const params =
      new URLSearchParams({
        client_id:
          env.GITLAB_CLIENT_ID,
        redirect_uri:
          callbackUrl,
        response_type:
          "code",
        scope:
          "read_user",
        state:
          "intel-engine"
      });

    res.redirect(
      `${GITLAB_AUTHORIZE_URL}?${params}`
    );
  };

const gitlabCallback =
  async (req, res) => {
    const frontendBase =
      env.FRONTEND_BASE_URL ||
      getApiBase(req);

    try {
      const {
        code,
        error: oauthError
      } = req.query;

      if (oauthError) {
        throw new Error(
          `GitLab denied access: ${oauthError}`
        );
      }

      if (!code) {
        throw new Error(
          "No authorization code received from GitLab."
        );
      }

      const callbackUrl =
        `${getApiBase(req)}/auth/gitlab/callback`;

      // Exchange code for access token
      const tokenRes =
        await axios.post(
          GITLAB_TOKEN_URL,
          {
            client_id:
              env.GITLAB_CLIENT_ID,
            client_secret:
              env.GITLAB_CLIENT_SECRET,
            code,
            grant_type:
              "authorization_code",
            redirect_uri:
              callbackUrl
          }
        );

      const accessToken =
        tokenRes.data
          .access_token;

      if (!accessToken) {
        throw new Error(
          "GitLab did not return an access token."
        );
      }

      // Fetch user profile
      const userRes =
        await axios.get(
          GITLAB_USER_URL,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );

      const gitlabUser =
        userRes.data;

      const identity =
        await createOrGetOAuthUser({
          provider:
            "gitlab",
          providerUserId:
            String(
              gitlabUser.id
            ),
          email:
            gitlabUser.email ||
            null,
          displayName:
            gitlabUser.name ||
            gitlabUser.username,
          metadata: {
            username:
              gitlabUser.username,
            avatar_url:
              gitlabUser.avatar_url
          }
        });

      const session =
        await createUserSession({
          userId:
            identity.user.id
        });

      res.redirect(
        `${frontendBase}/console?token=${encodeURIComponent(session.token)}`
      );
    } catch (error) {
      res.redirect(
        `${frontendBase}/console?error=${encodeURIComponent(error.message)}`
      );
    }
  };

module.exports = {
  gitlabRedirect,
  gitlabCallback
};
